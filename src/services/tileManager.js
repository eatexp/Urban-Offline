import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('TileManager');

// Utils for tile math
const long2tile = (lon, zoom) => (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
const lat2tile = (lat, zoom) => (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

export const tileManager = {
    // =============================================================================
    // VERIFIED: [Resilience] TILE_DOWNLOAD_QUOTA_CHECK
    // =============================================================================
    // Implementation: Proactively checks storage quota before starting large
    //   tile downloads using navigator.storage.estimate(). Calculates estimated
    //   tile size (~20KB per tile) and ensures 20% buffer available.
    //   Throws INSUFFICIENT_STORAGE error early if quota would be exceeded,
    //   preventing partial downloads and wasted bandwidth.
    // =============================================================================

    /**
     * Check if sufficient storage is available for tile download
     * @param {number} totalTiles - Number of tiles to download
     * @returns {Promise<{sufficient: boolean, availableMB: number, requiredMB: number}>}
     */
    async checkStorageQuota(totalTiles) {
        try {
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
                const estimatedTileSizeMB = totalTiles * 0.02; // ~20KB per tile avg
                const requiredMB = estimatedTileSizeMB * 1.2; // 20% buffer

                return {
                    sufficient: availableMB >= requiredMB,
                    availableMB,
                    requiredMB,
                    estimatedTileSizeMB
                };
            }
        } catch (e) {
            log.warn('Failed to check storage quota', e);
        }

        // If we can't check quota, assume sufficient (fail later if needed)
        return { sufficient: true, availableMB: null, requiredMB: null, estimatedTileSizeMB: null };
    },

    // Generate a unique key for the tile
    getTileKey(x, y, z) {
        return `${z}-${x}-${y}`;
    },

    // Save a tile blob to IndexedDB
    async saveTile(x, y, z, blob) {
        const key = this.getTileKey(x, y, z);
        await db.put('map_tiles', blob, key);
    },

    // Get a tile blob URL from IndexedDB
    async getTile(x, y, z) {
        const key = this.getTileKey(x, y, z);
        const blob = await db.get('map_tiles', key);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    },

    // Download all tiles for a region (Zoom levels 10-14)
    // Supports AbortController signal for cancellation and detailed progress reporting
    async downloadRegion(region, onProgress, signal) {
        if (signal?.aborted) {
            throw new Error('Download aborted');
        }

        const ZOOM_LEVELS = [10, 11, 12, 13, 14];
        const [lat, lon] = region.coordinates;

        // Define a bounding box (approx +/- 0.1 degrees for demo)
        const bounds = {
            north: lat + 0.05,
            south: lat - 0.05,
            east: lon + 0.08,
            west: lon - 0.08
        };

        let totalTiles = 0;
        let tilesToFetch = [];

        // 1. Calculate all tiles needed
        ZOOM_LEVELS.forEach(z => {
            const top = lat2tile(bounds.north, z);
            const bottom = lat2tile(bounds.south, z);
            const left = long2tile(bounds.west, z);
            const right = long2tile(bounds.east, z);

            for (let x = left; x <= right; x++) {
                for (let y = top; y <= bottom; y++) {
                    tilesToFetch.push({ x, y, z });
                }
            }
        });

        totalTiles = tilesToFetch.length;
        const startTime = Date.now();
        log.info(`Starting download of ${totalTiles} tiles for ${region.name}`);

        // Check storage quota before starting download
        const quotaCheck = await this.checkStorageQuota(totalTiles);
        if (!quotaCheck.sufficient) {
            const error = new Error(
                `INSUFFICIENT_STORAGE: Need ~${quotaCheck.estimatedTileSizeMB.toFixed(1)}MB, ` +
                `have ${quotaCheck.availableMB.toFixed(1)}MB available (with 20% buffer)`
            );
            error.name = 'QuotaExceededError';
            error.code = 'INSUFFICIENT_STORAGE';
            error.details = {
                requiredMB: quotaCheck.requiredMB,
                availableMB: quotaCheck.availableMB,
                estimatedTileSizeMB: quotaCheck.estimatedTileSizeMB,
                tileCount: totalTiles
            };
            throw error;
        }

        if (quotaCheck.availableMB) {
            log.debug(`Storage quota check passed: ${quotaCheck.availableMB.toFixed(1)}MB available, ` +
                      `need ~${quotaCheck.estimatedTileSizeMB.toFixed(1)}MB`);
        }

        // 2. Download with rate limiting (batch of 5)
        let processed = 0;
        const BATCH_SIZE = 5;

        for (let i = 0; i < tilesToFetch.length; i += BATCH_SIZE) {
            // Check for cancellation between batches
            if (signal?.aborted) {
                log.info('Download aborted by user, cleaning up...');
                await this.deleteRegionTiles(region);
                throw new Error('Download aborted');
            }

            const batch = tilesToFetch.slice(i, i + BATCH_SIZE);

            // Fast-fail if device goes offline during download
            if (!navigator.onLine) {
                log.warn('Device went offline during tile download, aborting batch');
                throw new Error('OFFLINE_DURING_DOWNLOAD');
            }

            // Use Promise.allSettled for partial success
            const results = await Promise.allSettled(batch.map(async (tile) => {
                // Pass signal to internal operations if needed, or check again
                if (signal?.aborted) throw new Error('Download aborted');

                // Check if exists first (skip already-cached tiles)
                const existing = await this.getTile(tile.x, tile.y, tile.z);
                if (existing) return { skipped: true };

                const tileUrlTemplate = region.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
                const url = tileUrlTemplate
                    .replace('{z}', tile.z)
                    .replace('{x}', tile.x)
                    .replace('{y}', tile.y);

                let response;
                let attempts = 0;

                // Fast-fail if offline before starting retries
                if (!navigator.onLine) throw new Error('Device offline, cannot fetch tile');

                while (attempts < 3) {
                    if (signal?.aborted) throw new Error('Download aborted');
                    if (!navigator.onLine) throw new Error('Device went offline during retry');

                    try {
                        response = await fetch(url, { signal });
                        if (response.ok) break;
                    } catch (err) {
                        if (err.name === 'AbortError') throw err;
                        log.warn(`Attempt ${attempts + 1} failed for ${url}`);
                    }
                    attempts++;
                    await new Promise(r => setTimeout(r, 500 * attempts));
                }

                if (!response || !response.ok) {
                    throw new Error(`Network response was not ok after ${attempts} retries`);
                }

                const blob = await response.blob();

                if (blob.type.startsWith('image/')) {
                    await this.saveTile(tile.x, tile.y, tile.z, blob);
                    return { saved: true };
                } else {
                    log.warn(`Invalid tile format: ${blob.type}`);
                    return { invalid: true };
                }
            }));

            // Analyze results
            const failures = results.filter(r => r.status === 'rejected');

            // Check for explicit aborts in failures
            if (failures.some(f => f.reason?.name === 'AbortError' || f.reason?.message === 'Download aborted')) {
                await this.deleteRegionTiles(region);
                throw new Error('Download aborted');
            }

            // Check for quota errors
            const quotaError = failures.find(f =>
                f.reason?.name === 'QuotaExceededError' ||
                f.reason?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                f.reason?.message === 'STORAGE_QUOTA_EXCEEDED'
            );

            if (quotaError) {
                log.error('Storage quota exceeded during tile download');
                try {
                    await this.deleteRegionTiles(region);
                } catch (cleanupErr) {
                    log.error('Failed to cleanup tiles after quota exceeded', cleanupErr);
                }
                const error = new Error('STORAGE_QUOTA_EXCEEDED');
                error.name = 'QuotaExceededError';
                throw error;
            }

            processed += batch.length;

            if (onProgress) {
                const percent = Math.min(100, Math.round((processed / totalTiles) * 100));

                // Detailed progress stats
                const elapsedSeconds = (Date.now() - startTime) / 1000;
                const tilesPerSec = elapsedSeconds > 0 ? processed / elapsedSeconds : 0;
                const remainingTiles = totalTiles - processed;
                const estimatedSecondsRemaining = tilesPerSec > 0 ? remainingTiles / tilesPerSec : 0;

                // Pass object as second argument to maintain backward compatibility with (percent) => ... signature
                onProgress(percent, {
                    percent,
                    processed,
                    total: totalTiles,
                    tilesPerSecond: tilesPerSec.toFixed(1),
                    estimatedSecondsRemaining: Math.round(estimatedSecondsRemaining)
                });
            }

            // Polite delay
            await new Promise(r => setTimeout(r, 200));
        }

        log.info('Region download complete');
    },

    // Delete tiles specific to a region (by recalculating the range)
    async deleteRegionTiles(region) {
        const ZOOM_LEVELS = [10, 11, 12, 13, 14];
        const [lat, lon] = region.coordinates;
        const bounds = {
            north: lat + 0.05,
            south: lat - 0.05,
            east: lon + 0.08,
            west: lon - 0.08
        };

        log.info(`Cleaning up tiles for region: ${region.name}`);

        for (const z of ZOOM_LEVELS) {
            const top = lat2tile(bounds.north, z);
            const bottom = lat2tile(bounds.south, z);
            const left = long2tile(bounds.west, z);
            const right = long2tile(bounds.east, z);

            const keysToDelete = [];
            for (let x = left; x <= right; x++) {
                for (let y = top; y <= bottom; y++) {
                    keysToDelete.push(this.getTileKey(x, y, z));
                }
            }

            // Batch delete
            await Promise.all(keysToDelete.map(key => db.delete('map_tiles', key).catch(() => { })));
        }
    },

    async clearAllTiles() {
        // Use store.clear() for O(1) deletion instead of sequential O(n) deletion
        // This is orders of magnitude faster with thousands of tiles
        try {
            await db.clear('map_tiles');
            log.info('All tiles cleared successfully');
        } catch (error) {
            log.error('Failed to clear tiles', error);
            throw error;
        }
    },

    async getStorageUsage() {
        try {
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return (estimate.usage / (1024 * 1024)).toFixed(1);
            }
        } catch (e) {
            log.warn('Failed to get storage estimate in TileManager', e);
        }

        // Fallback to approximate size
        const keys = await db.getAllKeys('map_tiles');
        // Assuming avg tile is 20KB
        return (keys.length * 0.02).toFixed(1);
    }
};