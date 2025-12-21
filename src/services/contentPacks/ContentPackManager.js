/**
 * ContentPackManager - Kiwix-style content pack download and management
 * 
 * Handles:
 * - Fetching available packs from server/local manifest
 * - Downloading packs with progress tracking
 * - Installing packs to IndexedDB/SQLite
 * - Managing installed pack state
 * - Updating packs when new versions available
 */

import { db } from '../db';
import { SearchService } from '../SearchService';
import { PACK_STATUS, PACK_CATEGORIES, formatSize, validateManifest, EXAMPLE_PACKS } from './ContentPackSchema';
import { createLogger } from '../../utils/logger';

const log = createLogger('ContentPackManager');

// Pack registry URL (would be a real server in production)
const PACK_REGISTRY_URL = '/assets/pack-registry.json';

// IndexedDB store for pack metadata
const PACKS_STORE = 'content_packs';

/**
 * ContentPackManager service
 */
export const ContentPackManager = {
    // In-memory cache of download progress
    _downloadProgress: new Map(),
    _abortControllers: new Map(),

    /**
     * Initialize the pack manager
     * Ensures the packs store exists
     */
    async init() {
        try {
            // Verify packs store is accessible
            await db.getAll(PACKS_STORE);
            log.info('Initialized');
            return true;
        } catch (_error) {
            log.warn('Packs store may not exist, will be created on first write');
            return true;
        }
    },

    /**
     * Fetch available packs from server or local fallback
     * @returns {Promise<Array>} List of available packs with install status
     */
    async getAvailablePacks() {
        let packs = [];

        // Try to fetch from server
        try {
            const response = await fetch(PACK_REGISTRY_URL);
            if (response.ok) {
                const data = await response.json();
                packs = data.packs || [];
            }
        } catch (_fetchError) {
            log.warn('Could not fetch registry, using local examples');
        }

        // Fall back to example packs if fetch failed
        if (packs.length === 0) {
            log.debug('Using local example packs');
            packs = EXAMPLE_PACKS;
        }

        // Get installed packs to merge status
        const installed = await this.getInstalledPacks();
        const installedMap = new Map(installed.map(p => [p.id, p]));

        // Merge install status
        return packs.map(pack => {
            const installedPack = installedMap.get(pack.id);
            if (installedPack) {
                // Check if update available
                const updateAvailable = this._compareVersions(pack.version, installedPack.version) > 0;
                return {
                    ...pack,
                    status: updateAvailable ? PACK_STATUS.UPDATE_AVAILABLE : PACK_STATUS.INSTALLED,
                    installedVersion: installedPack.version,
                    installedAt: installedPack.installedAt
                };
            }
            return {
                ...pack,
                status: PACK_STATUS.NOT_INSTALLED
            };
        });
    },

    /**
     * Get packs by category
     * @param {string} category - Category to filter by
     */
    async getPacksByCategory(category) {
        const packs = await this.getAvailablePacks();
        return packs.filter(p => p.category === category);
    },

    /**
     * Get all installed packs
     */
    async getInstalledPacks() {
        try {
            const packs = await db.getAll(PACKS_STORE);
            return packs || [];
        } catch (_error) {
            return [];
        }
    },

    /**
     * Download and install a content pack
     * @param {string} packId - Pack ID to download
     * @param {Function} onProgress - Progress callback (0-100)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async downloadPack(packId, onProgress) {
        // Get pack info
        const packs = await this.getAvailablePacks();
        const pack = packs.find(p => p.id === packId);
        
        if (!pack) {
            return { success: false, error: 'Pack not found' };
        }

        // Validate manifest
        const validation = validateManifest(pack);
        if (!validation.valid) {
            return { success: false, error: `Invalid pack: ${validation.errors.join(', ')}` };
        }

        // Check dependencies
        for (const depId of pack.dependencies?.required || []) {
            const installed = await this.isPackInstalled(depId);
            if (!installed) {
                return { success: false, error: `Required pack not installed: ${depId}` };
            }
        }

        // Set up abort controller
        const abortController = new AbortController();
        this._abortControllers.set(packId, abortController);
        this._downloadProgress.set(packId, 0);

        try {
            // Update status to downloading
            if (onProgress) onProgress(0, 'Starting download...');

            // Fetch the pack (with progress tracking)
            const response = await fetch(pack.downloadUrl, {
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            // Get total size for progress
            const contentLength = response.headers.get('content-length');
            const totalSize = contentLength ? parseInt(contentLength, 10) : pack.size;

            // Read response as stream with progress
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                const progress = Math.round((receivedLength / totalSize) * 80); // 0-80% for download
                this._downloadProgress.set(packId, progress);
                if (onProgress) {
                    onProgress(progress, `Downloading... ${formatSize(receivedLength)} / ${formatSize(totalSize)}`);
                }
            }

            // Combine chunks
            const packData = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                packData.set(chunk, position);
                position += chunk.length;
            }

            if (onProgress) onProgress(85, 'Installing...');

            // Install the pack
            await this._installPack(pack, packData, (installProgress) => {
                const totalProgress = 85 + Math.round(installProgress * 0.15);
                this._downloadProgress.set(packId, totalProgress);
                if (onProgress) onProgress(totalProgress, 'Installing content...');
            });

            // Save pack metadata
            await db.put(PACKS_STORE, {
                id: pack.id,
                name: pack.name,
                version: pack.version,
                category: pack.category,
                size: pack.size,
                sizeDisplay: pack.sizeDisplay,
                installedAt: new Date().toISOString(),
                metadata: pack.metadata
            });

            this._downloadProgress.delete(packId);
            this._abortControllers.delete(packId);

            if (onProgress) onProgress(100, 'Complete!');

            return { success: true };

        } catch (error) {
            this._downloadProgress.delete(packId);
            this._abortControllers.delete(packId);

            if (error.name === 'AbortError') {
                return { success: false, error: 'Download cancelled' };
            }

            log.error('Download failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Cancel an in-progress download
     * @param {string} packId 
     */
    cancelDownload(packId) {
        const controller = this._abortControllers.get(packId);
        if (controller) {
            controller.abort();
        }
    },

    /**
     * Get download progress for a pack
     * @param {string} packId 
     * @returns {number} Progress 0-100 or -1 if not downloading
     */
    getDownloadProgress(packId) {
        return this._downloadProgress.get(packId) ?? -1;
    },

    /**
     * Check if a pack is installed
     * @param {string} packId 
     */
    async isPackInstalled(packId) {
        try {
            const pack = await db.get(PACKS_STORE, packId);
            return !!pack;
        } catch (_error) {
            return false;
        }
    },

    /**
     * Uninstall a pack
     * @param {string} packId 
     */
    async uninstallPack(packId) {
        try {
            // Get pack info first
            const packInfo = await db.get(PACKS_STORE, packId);
            if (!packInfo) {
                return { success: false, error: 'Pack not installed' };
            }

            // Remove pack content based on category
            await this._removePackContent(packId, packInfo.category);

            // Remove pack metadata
            await db.delete(PACKS_STORE, packId);

            return { success: true };
        } catch (error) {
            log.error('Uninstall failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get total storage used by installed packs
     */
    async getStorageUsage() {
        const installed = await this.getInstalledPacks();
        const totalBytes = installed.reduce((sum, pack) => sum + (pack.size || 0), 0);
        return {
            bytes: totalBytes,
            display: formatSize(totalBytes),
            packCount: installed.length
        };
    },

    /**
     * Internal: Install pack data to storage
     */
    async _installPack(pack, _packData, onProgress) {
        // Parse pack data (ZIP or JSON depending on format)
        // For now, we'll simulate installation based on pack category
        
        const category = pack.category;
        
        if (onProgress) onProgress(10);

        switch (category) {
            case PACK_CATEGORIES.MEDICAL:
            case PACK_CATEGORIES.LEGAL:
            case PACK_CATEGORIES.SURVIVAL:
                // Install articles to appropriate store
                await this._installArticles(pack, onProgress);
                break;
                
            case PACK_CATEGORIES.REGION:
                // Install map tiles and places
                await this._installRegionData(pack, onProgress);
                break;
                
            case PACK_CATEGORIES.AI_MODEL:
                // Store model file reference
                await this._installAIModel(pack, onProgress);
                break;
        }

        if (onProgress) onProgress(100);
    },

    /**
     * Install articles from a content pack
     */
    async _installArticles(pack, onProgress) {
        // Determine target store based on category
        const storeMap = {
            [PACK_CATEGORIES.MEDICAL]: 'health_content',
            [PACK_CATEGORIES.LEGAL]: 'law_content',
            [PACK_CATEGORIES.SURVIVAL]: 'survival_content'
        };
        const targetStore = storeMap[pack.category] || 'health_content';

        // In real implementation, would parse pack data
        // For now, we store pack metadata
        if (onProgress) onProgress(50);

        // Mark resources as installed
        for (const resource of pack.resources || []) {
            if (resource.type === 'article' || resource.type === 'guide') {
                // Would store actual article content here
                log.debug(`Would install ${resource.id} to ${targetStore}`);
            }
        }

        // Index for search
        await SearchService.rebuildIndex();
        
        if (onProgress) onProgress(100);
    },

    /**
     * Install region data (maps, places)
     */
    async _installRegionData(pack, onProgress) {
        if (onProgress) onProgress(30);
        
        // Would install map tiles and places data
        for (const resource of pack.resources || []) {
            log.debug(`Would install ${resource.type}: ${resource.id}`);
        }

        if (onProgress) onProgress(100);
    },

    /**
     * Install AI model
     */
    async _installAIModel(pack, onProgress) {
        if (onProgress) onProgress(20);
        
        // Store model reference (actual file would be stored in Filesystem API)
        const modelInfo = {
            id: pack.id,
            name: pack.name,
            path: pack.resources[0]?.path,
            size: pack.size,
            installedAt: new Date().toISOString()
        };
        
        await db.put('ai_models', modelInfo);
        
        if (onProgress) onProgress(100);
    },

    /**
     * Remove pack content during uninstall
     */
    async _removePackContent(packId, category) {
        // Remove content based on category
        log.debug(`Removing content for pack ${packId} (${category})`);
        
        // In real implementation, would query and remove specific content
        // tied to this pack ID
    },

    /**
     * Compare semantic versions
     * @returns {number} 1 if a > b, -1 if a < b, 0 if equal
     */
    _compareVersions(a, b) {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if ((partsA[i] || 0) > (partsB[i] || 0)) return 1;
            if ((partsA[i] || 0) < (partsB[i] || 0)) return -1;
        }
        return 0;
    }
};

export default ContentPackManager;

