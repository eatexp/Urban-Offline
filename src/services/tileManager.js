import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('TileManager');

// Utils for tile math (converting lat/lon to tile coordinates)
const long2tile = (lon, zoom) => Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
const lat2tile = (lat, zoom) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

// Default tile server (OpenStreetMap)
const DEFAULT_TILE_SERVER = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Batch size for concurrent downloads
const DOWNLOAD_BATCH_SIZE = 6;

// Delay between batches (ms) - be polite to tile servers
const BATCH_DELAY_MS = 250;

// Average tile size estimate for storage calculations
const AVG_TILE_SIZE_BYTES = 20480; // 20KB

export const tileManager = {
    /**
     * Generate a unique key for a tile
     */
    getTileKey(x, y, z, regionId = null) {
        if (regionId) {
            return `${regionId}:${z}-${x}-${y}`;
        }
        return `${z}-${x}-${y}`;
    },

    /**
     * Parse a tile key back into components
     */
    parseTileKey(key) {
        const parts = key.split(':');
        if (parts.length === 2) {
            const [regionId, coords] = parts;
            const [z, x, y] = coords.split('-').map(Number);
            return { regionId, x, y, z };
        }
        const [z, x, y] = key.split('-').map(Number);
        return { regionId: null, x, y, z };
    },

    /**
     * Save a tile blob to IndexedDB
     */
    async saveTile(x, y, z, blob, regionId = null) {
        const key = this.getTileKey(x, y, z, regionId);
        await db.put('map_tiles', blob, key);
    },

    /**
     * Get a tile blob URL from IndexedDB
     * Returns null if tile not found
     */
    async getTile(x, y, z, regionId = null) {
        // Try with region prefix first, then without
        const keys = regionId
            ? [this.getTileKey(x, y, z, regionId), this.getTileKey(x, y, z)]
            : [this.getTileKey(x, y, z)];

        for (const key of keys) {
            try {
                const blob = await db.get('map_tiles', key);
                if (blob) {
                    return URL.createObjectURL(blob);
                }
            } catch (_e) {
                // Key not found, try next
            }
        }
        return null;
    },

    /**
     * Check if a tile exists in cache
     */
    async hasTile(x, y, z, regionId = null) {
        const keys = regionId
            ? [this.getTileKey(x, y, z, regionId), this.getTileKey(x, y, z)]
            : [this.getTileKey(x, y, z)];

        for (const key of keys) {
            try {
                const blob = await db.get('map_tiles', key);
                if (blob) return true;
            } catch (_e) {
                // Continue
            }
        }
        return false;
    },

    /**
     * Calculate tiles needed for a bounding box at given zoom levels
     */
    calculateTilesForBounds(bounds, zoomLevels) {
        const tiles = [];
        const [[south, west], [north, east]] = bounds;

        for (const z of zoomLevels) {
            const left = long2tile(west, z);
            const right = long2tile(east, z);
            const top = lat2tile(north, z);
            const bottom = lat2tile(south, z);

            for (let x = left; x <= right; x++) {
                for (let y = top; y <= bottom; y++) {
                    tiles.push({ x, y, z });
                }
            }
        }

        return tiles;
    },

    /**
     * Download all tiles for a region
     */
    async downloadRegion(region, onProgress) {
        // Use region bounds if available, otherwise calculate from coordinates
        let bounds;
        if (region.bounds) {
            bounds = region.bounds;
        } else if (region.coordinates) {
            // Create a small bounding box around the coordinates
            const [lat, lon] = region.coordinates;
            const offset = 0.1; // ~10km
            bounds = [[lat - offset, lon - offset], [lat + offset, lon + offset]];
        } else {
            throw new Error('Region must have bounds or coordinates');
        }

        // Use region's zoom levels or defaults
        const zoomLevels = region.zoomLevels || [10, 11, 12, 13, 14];
        const tileServer = region.tileServer || DEFAULT_TILE_SERVER;

        // Calculate all tiles needed
        const tilesToFetch = this.calculateTilesForBounds(bounds, zoomLevels);
        const totalTiles = tilesToFetch.length;

        log.info(`Starting download of ${totalTiles} tiles for ${region.name || region.id}`);
        log.info(`Zoom levels: ${zoomLevels.join(', ')}`);

        if (totalTiles === 0) {
            log.warn('No tiles to download');
            if (onProgress) onProgress(100);
            return { downloaded: 0, skipped: 0, failed: 0 };
        }

        // Track progress
        let processed = 0;
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;

        // Download in batches
        for (let i = 0; i < tilesToFetch.length; i += DOWNLOAD_BATCH_SIZE) {
            const batch = tilesToFetch.slice(i, i + DOWNLOAD_BATCH_SIZE);

            await Promise.all(batch.map(async (tile) => {
                try {
                    // Check if tile already exists
                    const exists = await this.hasTile(tile.x, tile.y, tile.z, region.id);
                    if (exists) {
                        skipped++;
                        return;
                    }

                    // Build tile URL
                    const url = tileServer
                        .replace('{z}', tile.z)
                        .replace('{x}', tile.x)
                        .replace('{y}', tile.y);

                    // Fetch with retry logic
                    let response;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (attempts < maxAttempts) {
                        try {
                            response = await fetch(url, {
                                headers: {
                                    'User-Agent': 'Urban-Offline/1.0 (emergency-app)'
                                }
                            });
                            if (response.ok) break;
                            if (response.status === 404) {
                                // Tile doesn't exist on server
                                log.debug(`Tile not found: ${tile.z}/${tile.x}/${tile.y}`);
                                failed++;
                                return;
                            }
                        } catch (fetchError) {
                            log.debug(`Attempt ${attempts + 1} failed for tile ${tile.z}/${tile.x}/${tile.y}`);
                        }
                        attempts++;
                        if (attempts < maxAttempts) {
                            await new Promise(r => setTimeout(r, 500 * attempts));
                        }
                    }

                    if (!response || !response.ok) {
                        failed++;
                        return;
                    }

                    const blob = await response.blob();

                    // Validate it's an image
                    if (!blob.type.startsWith('image/')) {
                        log.warn(`Invalid tile format: ${blob.type}`);
                        failed++;
                        return;
                    }

                    // Save tile with region ID prefix
                    await this.saveTile(tile.x, tile.y, tile.z, blob, region.id);
                    downloaded++;
                } catch (err) {
                    log.warn(`Failed to process tile ${tile.z}/${tile.x}/${tile.y}`, err);
                    failed++;
                }
            }));

            processed += batch.length;
            if (onProgress) {
                onProgress(Math.min(100, Math.round((processed / totalTiles) * 100)));
            }

            // Be polite to tile servers
            if (i + DOWNLOAD_BATCH_SIZE < tilesToFetch.length) {
                await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
            }
        }

        log.info(`Region download complete: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);

        return { downloaded, skipped, failed, total: totalTiles };
    },

    /**
     * Clear all tiles for a specific region
     */
    async clearRegionTiles(regionId) {
        log.info(`Clearing tiles for region: ${regionId}`);

        try {
            const allKeys = await db.getAllKeys('map_tiles');
            const regionPrefix = `${regionId}:`;

            let deleted = 0;
            for (const key of allKeys) {
                if (key.startsWith(regionPrefix)) {
                    await db.delete('map_tiles', key);
                    deleted++;
                }
            }

            log.info(`Deleted ${deleted} tiles for region ${regionId}`);
            return deleted;
        } catch (error) {
            log.error('Failed to clear region tiles', error);
            throw error;
        }
    },

    /**
     * Clear all cached tiles
     */
    async clearAllTiles() {
        log.info('Clearing all cached tiles');

        try {
            const keys = await db.getAllKeys('map_tiles');
            for (const key of keys) {
                await db.delete('map_tiles', key);
            }
            log.info(`Deleted ${keys.length} tiles`);
            return keys.length;
        } catch (error) {
            log.error('Failed to clear all tiles', error);
            throw error;
        }
    },

    /**
     * Get storage usage statistics
     */
    async getStorageUsage() {
        try {
            const keys = await db.getAllKeys('map_tiles');
            const count = keys.length;
            const estimatedBytes = count * AVG_TILE_SIZE_BYTES;

            return {
                count,
                estimatedBytes,
                estimatedMB: (estimatedBytes / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            log.error('Failed to get storage usage', error);
            return { count: 0, estimatedBytes: 0, estimatedMB: '0.00' };
        }
    },

    /**
     * Get tile counts by region
     */
    async getTileCountsByRegion() {
        try {
            const keys = await db.getAllKeys('map_tiles');
            const counts = {};

            for (const key of keys) {
                const { regionId } = this.parseTileKey(key);
                const region = regionId || 'unknown';
                counts[region] = (counts[region] || 0) + 1;
            }

            return counts;
        } catch (error) {
            log.error('Failed to get tile counts by region', error);
            return {};
        }
    }
};
