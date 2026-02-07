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
import { PACK_STATUS, PACK_CATEGORIES, formatSize, validateManifest, BUNDLED_PACKS, RESOURCE_TYPES } from './ContentPackSchema';
import { ZimReader } from '../zim/ZimReader';
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
    // Queue of pack IDs that failed and should retry when online
    _retryQueue: [],
    _onlineListenerAttached: false,

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
     * Fetch available packs from manifest or local fallback
     * @returns {Promise<Array>} List of available packs with install status
     */
    async getAvailablePacks() {
        let packs = [];

        // Try to read the bundled content manifest first
        try {
            const response = await fetch('/assets/content-manifest.json');
            if (response.ok) {
                const manifest = await response.json();
                packs = manifest.packs || [];
            }
        } catch (_fetchError) {
            log.debug('No content manifest, trying registry');
        }

        // Try pack registry as secondary source
        if (packs.length === 0) {
            try {
                const response = await fetch(PACK_REGISTRY_URL);
                if (response.ok) {
                    const data = await response.json();
                    packs = data.packs || [];
                }
            } catch (_fetchError) {
                log.warn('Could not fetch registry');
            }
        }

        // Fall back to bundled pack definitions
        if (packs.length === 0) {
            log.debug('Using bundled pack definitions');
            packs = BUNDLED_PACKS;
        }

        // Get installed packs to merge status
        const installed = await this.getInstalledPacks();
        const installedMap = new Map(installed.map(p => [p.id, p]));

        // Merge install status
        return packs.map(pack => {
            const installedPack = installedMap.get(pack.id);
            if (installedPack) {
                return {
                    ...pack,
                    status: installedPack.bundled ? PACK_STATUS.BUNDLED : PACK_STATUS.INSTALLED,
                    articleCount: installedPack.articleCount || pack.articleCount || 0,
                    installedVersion: installedPack.version,
                    installedAt: installedPack.installedAt
                };
            }
            return {
                ...pack,
                status: pack.bundled ? PACK_STATUS.NOT_INSTALLED : PACK_STATUS.NOT_INSTALLED
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
        this._attachOnlineListener();

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

        let tempFileHandle = null;

        // Proactive storage quota check before downloading large packs
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const { quota, usage } = await navigator.storage.estimate();
                const availableBytes = quota - usage;
                const requiredBytes = pack.size * 1.1; // 10% buffer for overhead

                if (requiredBytes > availableBytes) {
                    const availableMB = (availableBytes / (1024 * 1024)).toFixed(1);
                    const requiredMB = (requiredBytes / (1024 * 1024)).toFixed(1);
                    log.warn(`Proactive quota check failed: need ${requiredMB}MB, have ${availableMB}MB`);
                    return { success: false, error: `Insufficient storage: need ${requiredMB}MB, have ${availableMB}MB` };
                }
                log.debug(`Quota check passed: ${(availableBytes / (1024 * 1024)).toFixed(1)}MB available`);
            }
        } catch (quotaError) {
            log.warn('Quota check failed, proceeding with download', quotaError);
        }

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

            // Prepare for download: check if OPFS (Origin Private File System) is available
            let writable = null;
            let useMemory = true;
            let chunks = [];

            try {
                if (navigator.storage && navigator.storage.getDirectory) {
                    const root = await navigator.storage.getDirectory();
                    tempFileHandle = await root.getFileHandle(`temp_${packId}_${Date.now()}`, { create: true });
                    writable = await tempFileHandle.createWritable();
                    useMemory = false;
                    log.debug('Using OPFS for download streaming');
                }
            } catch (err) {
                log.warn('OPFS not available or failed, falling back to memory', err);
            }

            // Read response as stream with progress
            const reader = response.body.getReader();
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                receivedLength += value.length;

                if (useMemory) {
                    chunks.push(value);
                } else {
                    await writable.write(value);
                }

                const progress = Math.round((receivedLength / totalSize) * 80); // 0-80% for download
                this._downloadProgress.set(packId, progress);
                if (onProgress) {
                    onProgress(progress, `Downloading... ${formatSize(receivedLength)} / ${formatSize(totalSize)}`);
                }
            }

            if (!useMemory) {
                await writable.close();
            }

            if (onProgress) onProgress(85, 'Installing...');

            // Prepare install source
            let installSource;
            if (useMemory) {
                // Combine chunks
                installSource = new Uint8Array(receivedLength);
                let position = 0;
                for (const chunk of chunks) {
                    installSource.set(chunk, position);
                    position += chunk.length;
                }
                // Clear chunks to free some memory
                chunks = null;
            } else {
                installSource = await tempFileHandle.getFile();
            }

            // Install the pack
            await this._installPack(pack, installSource, (installProgress) => {
                const totalProgress = 85 + Math.round(installProgress * 0.15);
                this._downloadProgress.set(packId, totalProgress);
                if (onProgress) onProgress(totalProgress, 'Installing content...');
            });

            // Clean up temp file
            if (tempFileHandle) {
                try {
                    const root = await navigator.storage.getDirectory();
                    await root.removeEntry(tempFileHandle.name);
                } catch (cleanupErr) {
                    log.warn('Failed to cleanup temp file', cleanupErr);
                }
            }

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
            // Attempt cleanup on error
            if (tempFileHandle) {
                try {
                    const root = await navigator.storage.getDirectory();
                    await root.removeEntry(tempFileHandle.name);
                } catch (cleanupErr) {
                    // Ignore
                }
            }

            this._downloadProgress.delete(packId);
            this._abortControllers.delete(packId);

            if (error.name === 'AbortError') {
                return { success: false, error: 'Download cancelled' };
            }

            log.error('Download failed', error);

            // Attempt to rollback any partially installed content
            try {
                await this._rollbackPartialInstall(pack);
            } catch (rollbackErr) {
                log.warn('Rollback of partial install failed', rollbackErr);
            }

            // Queue for retry when back online (network errors only)
            if (!navigator.onLine || error.message.includes('fetch') || error.name === 'TypeError') {
                if (!this._retryQueue.includes(packId)) {
                    this._retryQueue.push(packId);
                    log.info(`Queued pack "${packId}" for retry when online`);
                }
                return { success: false, error: error.message, queued: true };
            }

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
     * @param {Object} pack - Pack metadata
     * @param {File|Uint8Array} packSource - The downloaded file (if OPFS) or data array (if memory)
     * @param {Function} onProgress
     */
    async _installPack(pack, packSource, onProgress) {
        // Parse pack data (ZIP or JSON depending on format)
        // For now, we'll simulate installation based on pack category

        // Note: In a real implementation, if packSource is a File (from OPFS),
        // we would use a streaming unzip/parser here to avoid loading it all into memory.

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

        const newDocs = [];

        // Mark resources as installed
        for (const resource of pack.resources || []) {
            if (resource.type === 'article' || resource.type === 'guide') {
                // Would store actual article content here
                log.debug(`Would install ${resource.id} to ${targetStore}`);

                // Generate a human-readable title from ID if needed
                const readableTitle = resource.id
                    .split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                newDocs.push({
                    id: resource.id,
                    slug: resource.id,
                    title: readableTitle,
                    content: '',
                    description: '',
                    category: pack.category
                });
            }
        }

        // Index for search
        if (newDocs.length > 0) {
            await SearchService.addDocuments(newDocs);
        }

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
     * Rollback a partially installed pack on failure
     * @param {Object} pack - Pack metadata
     */
    async _rollbackPartialInstall(pack) {
        log.info(`Rolling back partial install for pack ${pack.id}`);

        try {
            // Remove any pack content that may have been installed
            await this._removePackContent(pack.id, pack.category);

            // Remove pack metadata if it was written
            try {
                await db.delete(PACKS_STORE, pack.id);
            } catch (_e) {
                // Pack metadata may not have been written yet
            }

            log.info(`Rollback complete for pack ${pack.id}`);
        } catch (error) {
            log.error(`Rollback failed for pack ${pack.id}`, error);
            throw error;
        }
    },

    /**
     * Attach a listener to retry queued downloads when connection is restored
     */
    _attachOnlineListener() {
        if (this._onlineListenerAttached || typeof window === 'undefined') return;
        this._onlineListenerAttached = true;
        window.addEventListener('online', () => {
            if (this._retryQueue.length === 0) return;
            log.info(`Connection restored, retrying ${this._retryQueue.length} queued download(s)`);
            const queue = this._retryQueue.splice(0);
            queue.forEach(packId => {
                this.downloadPack(packId, (progress, msg) => {
                    log.debug(`Retry "${packId}": ${progress}% — ${msg}`);
                });
            });
        });
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
    },

    /**
     * Import a ZIM file and convert it to content pack format
     * @param {File} file - ZIM file to import
     * @param {Function} onProgress - Progress callback (0-100, message)
     * @returns {Promise<{success: boolean, packId?: string, error?: string, stats?: object}>}
     */
    async importZimFile(file, onProgress) {
        if (!file || !file.name.endsWith('.zim')) {
            return { success: false, error: 'Invalid file. Please select a .zim file.' };
        }

        const packId = `zim-import-${Date.now()}`;
        const reader = new ZimReader(file);

        try {
            if (onProgress) onProgress(0, 'Initializing ZIM reader...');

            // Initialize ZIM reader
            await reader.init();
            const stats = reader.getStats();

            log.info(`Importing ZIM file: ${stats.fileName}`, stats);

            if (onProgress) onProgress(5, `Found ${stats.articleCount} articles...`);

            // Check storage quota
            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const { quota, usage } = await navigator.storage.estimate();
                    const availableBytes = quota - usage;
                    // Estimate: each article ~500 bytes metadata + content
                    const estimatedSize = file.size * 0.5; // Rough estimate

                    if (estimatedSize > availableBytes) {
                        const availableMB = (availableBytes / (1024 * 1024)).toFixed(1);
                        return {
                            success: false,
                            error: `Insufficient storage. Need ~${formatSize(estimatedSize)}, have ${availableMB}MB available.`
                        };
                    }
                }
            } catch (quotaError) {
                log.warn('Storage quota check failed', quotaError);
            }

            // Process articles
            const articles = [];
            const targetStore = 'zim_content'; // Store for ZIM articles
            let processedCount = 0;
            let errorCount = 0;

            // Clear existing content for this ZIM file if re-importing
            // (We use a unique packId, so this shouldn't happen, but good to be safe)

            if (onProgress) onProgress(10, 'Reading articles from ZIM...');

            // Iterate through articles
            for await (const article of reader.iterateArticles({
                onlyHTML: true,
                skipRedirects: true,
                onProgress: (progressInfo) => {
                    if (onProgress && progressInfo.percent % 10 === 0) {
                        // Map 10-70% to reading progress
                        const mappedProgress = 10 + Math.round(progressInfo.percent * 0.6);
                        onProgress(mappedProgress, `Reading: ${progressInfo.processed} / ${progressInfo.total} articles...`);
                    }
                }
            })) {
                try {
                    const content = await article.getContent();
                    if (!content) continue;

                    // Clean HTML content
                    const cleanedHtml = this._cleanHtml(content);
                    const plainText = this._extractPlainText(cleanedHtml);

                    // Skip very short articles (likely redirects or stubs)
                    if (plainText.length < 100) continue;

                    // Create article record
                    const articleId = `${packId}-${article.index}`;
                    const articleRecord = {
                        id: articleId,
                        slug: article.url,
                        title: article.title,
                        content: plainText,
                        fullText: plainText,
                        html: cleanedHtml,
                        category: PACK_CATEGORIES.ZIM_IMPORT,
                        zimPath: article.url,
                        zimNamespace: article.namespace,
                        mimeType: article.mimeType,
                        source: 'zim-import',
                        importedAt: new Date().toISOString(),
                        packId: packId
                    };

                    // Store in IndexedDB
                    await db.put(targetStore, articleRecord);

                    // Add to search index batch
                    articles.push({
                        id: articleId,
                        slug: article.url,
                        title: article.title,
                        content: plainText,
                        description: plainText.substring(0, 200) + '...',
                        category: PACK_CATEGORIES.ZIM_IMPORT
                    });

                    processedCount++;

                    // Index in batches
                    if (articles.length >= 50) {
                        await SearchService.addDocuments(articles);
                        articles.length = 0;
                    }
                } catch (articleError) {
                    log.warn(`Failed to process article "${article.title}": ${articleError.message}`);
                    errorCount++;
                }
            }

            // Index remaining articles
            if (articles.length > 0) {
                await SearchService.addDocuments(articles);
            }

            if (onProgress) onProgress(80, 'Saving pack metadata...');

            // Save pack metadata
            const packMetadata = {
                id: packId,
                name: file.name.replace('.zim', ''),
                description: `Imported ZIM archive: ${stats.articleCount} articles, ${stats.fileSizeFormatted}`,
                category: PACK_CATEGORIES.ZIM_IMPORT,
                version: '1.0.0',
                size: file.size,
                sizeDisplay: formatSize(file.size),
                articleCount: processedCount,
                errorCount: errorCount,
                installedAt: new Date().toISOString(),
                metadata: {
                    source: 'ZIM Import',
                    license: 'Unknown', // Should extract from ZIM metadata
                    licenseUrl: '',
                    attribution: `Content from ${file.name}`,
                    zimVersion: stats.version,
                    mimeTypes: stats.mimeTypes
                },
                isZimImport: true
            };

            await db.put(PACKS_STORE, packMetadata);

            if (onProgress) onProgress(100, 'Complete!');

            log.info(`ZIM import complete: ${processedCount} articles imported, ${errorCount} errors`, {
                packId,
                processedCount,
                errorCount
            });

            return {
                success: true,
                packId,
                stats: {
                    fileName: file.name,
                    fileSize: stats.fileSizeFormatted,
                    totalArticles: stats.articleCount,
                    importedArticles: processedCount,
                    errors: errorCount
                }
            };

        } catch (error) {
            log.error('ZIM import failed', error);

            // Cleanup on failure
            try {
                await this._cleanupZimImport(packId);
            } catch (cleanupError) {
                log.warn('Cleanup failed after import error', cleanupError);
            }

            return {
                success: false,
                error: `Import failed: ${error.message}`
            };
        }
    },

    /**
     * Clean HTML content for storage
     * @param {string} html - Raw HTML
     * @returns {string} Cleaned HTML
     */
    _cleanHtml(html) {
        // Remove script and style tags
        let cleaned = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');

        // Remove data-mw attributes (Wikipedia metadata)
        cleaned = cleaned.replace(/data-mw="[^"]*"/g, '');

        // Remove edit sections
        cleaned = cleaned.replace(/<span[^>]*class="[^"]*editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');

        // Remove reference links but keep the text
        cleaned = cleaned.replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '');

        return cleaned;
    },

    /**
     * Extract plain text from HTML
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    _extractPlainText(html) {
        // Simple HTML to text conversion
        // Replace common block elements with newlines
        let text = html
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]+>/g, ' '); // Remove remaining tags

        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        text = textarea.value;

        // Normalize whitespace
        text = text
            .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
            .replace(/[ \t]+/g, ' ')   // Normalize spaces
            .trim();

        return text;
    },

    /**
     * Cleanup partial ZIM import on failure
     * @param {string} packId 
     */
    async _cleanupZimImport(packId) {
        log.info(`Cleaning up partial ZIM import: ${packId}`);

        try {
            // Remove pack metadata
            await db.delete(PACKS_STORE, packId);
        } catch (_e) {
            // May not exist
        }

        // Note: Individual articles are tied to packId in their ID,
        // so they would need to be cleaned up separately if partial import occurred
        // This is a simplified cleanup - in production, track all article IDs
    },

    /**
     * Get all ZIM-imported packs
     * @returns {Promise<Array>}
     */
    async getZimImports() {
        const allPacks = await this.getInstalledPacks();
        return allPacks.filter(p => p.category === PACK_CATEGORIES.ZIM_IMPORT);
    },

    /**
     * Uninstall a ZIM import
     * @param {string} packId 
     */
    async uninstallZimImport(packId) {
        try {
            const packInfo = await db.get(PACKS_STORE, packId);
            if (!packInfo || packInfo.category !== PACK_CATEGORIES.ZIM_IMPORT) {
                return { success: false, error: 'ZIM import not found' };
            }

            // Remove all articles for this pack
            // In production, query by packId and remove all
            // For now, this is a placeholder

            // Remove pack metadata
            await db.delete(PACKS_STORE, packId);

            log.info(`ZIM import uninstalled: ${packId}`);
            return { success: true };
        } catch (error) {
            log.error('Failed to uninstall ZIM import', error);
            return { success: false, error: error.message };
        }
    }
};

export default ContentPackManager;

