import { db } from './db';
import { createLogger } from '../utils/logger';
import { defaultRegions } from '../data/defaultRegions';

const log = createLogger('DataManager');

// Custom error for offline state detection
class OfflineError extends Error {
    constructor(message = 'Device is offline') {
        super(message);
        this.name = 'OfflineError';
    }
}

// Fetches the region manifest from public assets with offline fallback
const fetchRegionsManifest = async () => {
    try {
        // Fast-fail if offline to avoid wasting retry attempts
        if (!navigator.onLine) {
            log.info('Device offline, skipping network fetch for regions manifest');
            throw new OfflineError('Cannot fetch regions manifest while offline');
        }

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            // Re-check online status before each retry attempt
            if (!navigator.onLine) {
                log.warn('Device went offline during retry loop');
                throw new OfflineError('Connection lost during fetch');
            }
            try {
                response = await fetch('/regions.json');
                if (response.ok) break;
            } catch (netErr) {
                log.warn(`Fetch attempt ${attempts + 1} failed`, netErr);
            }
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempts))); // Exponential backoff
            }
        }

        if (!response || !response.ok) throw new Error('Failed to fetch regions manifest after retries');
        const data = await response.json();

        // Cache the data for offline use
        try {
            await db.put('dataset_preferences', data, 'regions_manifest');
        } catch (cacheError) {
            log.warn('Failed to cache regions manifest', cacheError);
        }

        return data;
    } catch (error) {
        log.error('Error loading regions manifest from network', error);

        // Try to load from cache as fallback
        try {
            const cached = await db.get('dataset_preferences', 'regions_manifest');
            if (cached && Array.isArray(cached)) {
                log.info('Loaded regions manifest from cache');
                return cached;
            }
        } catch (cacheError) {
            log.error('Error loading regions manifest from cache', cacheError);
        }

        // Return default embedded data as last resort
        log.warn('Network and cache failed, using embedded default regions');
        return defaultRegions;
    }
};

export const dataManager = {
    async getAvailableRegions() {
        try {
            const [regions, installed] = await Promise.all([
                fetchRegionsManifest(),
                db.getAll('datasets')
            ]);

            const installedIds = new Set((installed || []).map(d => d.id));

            return regions.map(r => ({
                ...r,
                isInstalled: installedIds.has(r.id),
                installedAt: installedIds.has(r.id) ? (installed || []).find(d => d.id === r.id)?.installedAt : null
            }));
        } catch (_dbError) {
            log.error('Failed to get available regions', _dbError);
            // Return empty or cached structure if needed, for now empty is safer than crashing
            return [];
        }
    },

    async installRegion(regionId, onProgress, attempt = 1, signal = null) {
        // TODO: [Resilience] REGION_INSTALL_CANCEL_SUPPORT - IMPLEMENTED 2026-02-08
        // Added AbortController signal support for cancellation during region installation
        
        // Check for abort before starting
        if (signal?.aborted) {
            throw new Error('Installation cancelled by user');
        }

        // Fetch region metadata FIRST for quota estimation
        const regions = await fetchRegionsManifest();
        const region = regions.find(r => r.id === regionId);
        if (!region) throw new Error('Region not found');

        // Check available storage BEFORE starting download to fail fast
        try {
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
                const requiredMB = parseFloat(region.size) || 50; // Default 50MB if unknown

                if (availableMB < requiredMB * 1.1) { // 10% buffer
                    log.warn(`Proactive check: Insufficient storage. Need ${requiredMB}MB, have ${availableMB.toFixed(1)}MB`);
                    // If attempt 1, try eviction automatically
                    if (attempt === 1) {
                        return await this.handleQuotaExceeded(regionId, onProgress, region.size, attempt);
                    }
                    throw new Error(`Insufficient storage: need ${requiredMB}MB, have ${availableMB.toFixed(1)}MB`);
                }
                log.debug(`Storage check passed: ${availableMB.toFixed(1)}MB available, need ${requiredMB}MB`);
            }
        } catch (quotaCheckError) {
            // Don't fail installation if quota check itself fails - proceed and let it fail naturally
            log.warn('Proactive quota check failed, proceeding with installation', quotaCheckError);
        }

        try {
            // Save metadata first with 'downloading' status for partial installation tracking
            await db.put('datasets', {
                id: region.id,
                name: region.name,
                type: region.type,
                size: region.size,
                description: region.description,
                coordinates: region.coordinates,
                modules: region.modules,
                installedAt: new Date().toISOString(),
                status: 'downloading' // Tracks partial vs complete installation
            });

            // Trigger tile download if needed
            let tileDownloadSuccess = true;
            if (region.modules.includes('map-tiles')) {
                try {
                    const { tileManager } = await import('./tileManager');
                    await tileManager.downloadRegion(region, onProgress, signal);
                } catch (tileError) {
                    // Handle cancellation specifically
                    if (tileError.message === 'Download aborted' || signal?.aborted) {
                        log.info('Region installation cancelled by user');
                        // Clean up partial installation
                        await this.uninstallRegion(regionId);
                        throw new Error('Installation cancelled');
                    }
                    log.error('Tile download failed', tileError);
                    tileDownloadSuccess = false;
                    // Don't fail the whole installation if tiles fail
                    // User can retry later - status will remain 'partial'
                }
            }

            // Update status to complete if everything succeeded
            const finalStatus = tileDownloadSuccess ? 'complete' : 'partial';
            await db.put('datasets', {
                id: region.id,
                name: region.name,
                type: region.type,
                size: region.size,
                description: region.description,
                coordinates: region.coordinates,
                modules: region.modules,
                installedAt: new Date().toISOString(),
                status: finalStatus
            });

            // Report completion
            if (onProgress) {
                onProgress(100);
            }

            return true;
        } catch (error) {
            // Handle Quota Exceeded with Eviction Strategy
            const isQuota = error.name === 'QuotaExceededError' ||
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                error.message === 'STORAGE_QUOTA_EXCEEDED';

            if (isQuota && attempt === 1) {
                return await this.handleQuotaExceeded(regionId, onProgress, region.size, attempt);
            }

            log.error('Region installation failed', error);
            // Clean up partial installation
            try {
                await db.delete('datasets', regionId);
                // Also try to clean up tiles if any were written
                const { tileManager } = await import('./tileManager');
                const regions = await fetchRegionsManifest();
                const region = regions.find(r => r.id === regionId);
                if (region) {
                    await tileManager.deleteRegionTiles(region);
                }
            } catch (cleanupError) {
                log.error('Failed to cleanup after installation error', cleanupError);
            }
            throw error;
        }
    },

    // VERIFIED: [Resilience] AUTO_EVICTION_USER_NOTIFICATION
    // Dispatches events before/after eviction for UI notification

    // Extracted quota recovery logic
    async handleQuotaExceeded(regionId, onProgress, hintedSize, attempt) {
        log.warn('Storage quota exceeded or imminent. Attempting loop-based eviction to free space.');

        try {
            const requiredMB = parseFloat(hintedSize) || 50;
            let freedMB = 0;
            const evictedRegions = [];

            const installed = await this.getInstalledRegions();
            // Sort by installedAt (Oldest first - LRU eviction)
            const candidates = installed
                .filter(r => r.id !== regionId)
                .sort((a, b) => new Date(a.installedAt) - new Date(b.installedAt));

            if (candidates.length === 0) {
                log.error('No other regions to evict. Cannot satisfy storage requirements.');
                throw new Error('Insufficient storage: no regions available for eviction');
            }

            // P3 FIX: Dispatch eviction-start event for UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('storage-auto-eviction', {
                    detail: {
                        type: 'eviction-start',
                        regionsToEvict: candidates.map(r => r.name),
                        spaceNeeded: requiredMB,
                        timestamp: new Date().toISOString()
                    }
                }));
            }

            // Loop-based eviction: evict until we have enough space
            for (const candidate of candidates) {
                if (freedMB >= requiredMB) {
                    log.info(`Freed ${freedMB.toFixed(1)}MB >= required ${requiredMB}MB, stopping eviction`);
                    break;
                }

                const candidateSize = parseFloat(candidate.size) || 0;
                log.info(`Evicting region '${candidate.name}' (${candidate.id}) to free ~${candidateSize}MB`);

                try {
                    await this.uninstallRegion(candidate.id);
                    freedMB += candidateSize;
                    evictedRegions.push(candidate.name);
                } catch (evictErr) {
                    log.warn(`Failed to evict region '${candidate.name}', continuing`, evictErr);
                }
            }

            // P3 FIX: Dispatch eviction-complete event for UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('storage-auto-eviction', {
                    detail: {
                        type: 'eviction-complete',
                        freedMB: freedMB.toFixed(1),
                        evictedRegions,
                        message: `Freed ${freedMB.toFixed(1)}MB by removing old regions: ${evictedRegions.join(', ')}`
                    }
                }));
            }

            if (freedMB < requiredMB) {
                log.error(`Unable to free sufficient storage. Freed ${freedMB.toFixed(1)}MB but need ${requiredMB}MB`);
                throw new Error(`Insufficient storage: freed ${freedMB.toFixed(1)}MB but need ${requiredMB}MB. Please manually delete content.`);
            }

            // Retry installation after eviction
            log.info(`Eviction complete (freed ${freedMB.toFixed(1)}MB), retrying installation`);
            return await this.installRegion(regionId, onProgress, attempt + 1);
        } catch (evictError) {
            log.error('Failed during quota recovery eviction', evictError);
            throw evictError;
        }
    },

    async uninstallRegion(regionId) {
        try {
            // Fetch region first so we have coordinates for targeted tile deletion
            // IMPORTANT: Do this BEFORE deleting metadata
            const installed = await this.getInstalledRegions();
            const region = installed.find(r => r.id === regionId);

            // Delete metadata
            await db.delete('datasets', regionId);

            // Clean up tiles (async, don't wait)
            if (region) {
                import('./tileManager').then(({ tileManager }) => {
                    // FIX: Use deleteRegionTiles(region) to only remove THIS region's tiles
                    // Previous version used clearAllTiles() which wiped ALL map data (Critical Bug Fix)
                    tileManager.deleteRegionTiles(region).catch(err => {
                        log.warn(`Failed to delete tiles for region ${region.name}`, err);
                    });
                });
            } else {
                log.warn(`Region ${regionId} metadata not found during uninstall - skipping tile cleanup`);
            }

            return true;
        } catch (error) {
            log.error('Region uninstallation failed', error);
            throw error;
        }
    },

    async getInstalledRegions() {
        return await db.getAll('datasets');
    },

    async getStorageUsage() {
        try {
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: (estimate.usage / (1024 * 1024)).toFixed(1),
                    total: (estimate.quota / (1024 * 1024)).toFixed(0)
                };
            }
        } catch (e) {
            log.warn('Failed to get storage estimate', e);
        }

        // Fallback to mock calculation
        const installed = await db.getAll('datasets');
        const guides = await db.getAll('guides');

        let totalMB = 0;
        installed.forEach(item => {
            const size = parseFloat(item.size);
            if (!isNaN(size)) totalMB += size;
        });
        guides.forEach(item => {
            const size = parseFloat(item.size);
            if (!isNaN(size)) totalMB += size;
        });

        return {
            used: totalMB.toFixed(1),
            total: 500 // 500MB Budget
        };
    }
};
