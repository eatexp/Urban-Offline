import { db } from './db';

// Utils for tile math
const long2tile = (lon, zoom) => (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
const lat2tile = (lat, zoom) => (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

// Active blob URLs for memory management
const activeBlobUrls = new Map();

export const tileManager = {
    // Generate a unique key for the tile
    getTileKey(x, y, z) {
        return `${z}-${x}-${y}`;
    },

    // Save a tile blob to IndexedDB
    async saveTile(x, y, z, blob, regionId) {
        const key = this.getTileKey(x, y, z);
        await db.put('map_tiles', blob, key);

        // Track tile in region manifest
        if (regionId) {
            await this.addTileToManifest(regionId, key);
        }
    },

    // Get a tile blob URL from IndexedDB
    async getTile(x, y, z) {
        const key = this.getTileKey(x, y, z);
        const blob = await db.get('map_tiles', key);
        if (blob) {
            const url = URL.createObjectURL(blob);
            // Track for cleanup
            activeBlobUrls.set(key, url);
            return url;
        }
        return null;
    },

    // Revoke a blob URL to prevent memory leaks
    revokeTileUrl(x, y, z) {
        const key = this.getTileKey(x, y, z);
        const url = activeBlobUrls.get(key);
        if (url) {
            URL.revokeObjectURL(url);
            activeBlobUrls.delete(key);
        }
    },

    // Clean up all active blob URLs
    revokeAllTileUrls() {
        for (const url of activeBlobUrls.values()) {
            URL.revokeObjectURL(url);
        }
        activeBlobUrls.clear();
    },

    // Region tile manifest management
    async getRegionManifest(regionId) {
        const manifest = await db.get('datasets', `manifest-${regionId}`);
        return manifest?.tiles || [];
    },

    async addTileToManifest(regionId, tileKey) {
        const manifestKey = `manifest-${regionId}`;
        let manifest = await db.get('datasets', manifestKey);
        if (!manifest) {
            manifest = { id: manifestKey, tiles: [] };
        }
        if (!manifest.tiles.includes(tileKey)) {
            manifest.tiles.push(tileKey);
            await db.put('datasets', manifest);
        }
    },

    async saveRegionManifest(regionId, tileKeys) {
        const manifestKey = `manifest-${regionId}`;
        await db.put('datasets', { id: manifestKey, tiles: tileKeys });
    },

    // Calculate tiles needed for a region
    calculateRegionTiles(region) {
        const ZOOM_LEVELS = [10, 11, 12, 13, 14];
        const [lat, lon] = region.coordinates;

        const bounds = {
            north: lat + 0.05,
            south: lat - 0.05,
            east: lon + 0.08,
            west: lon - 0.08
        };

        const tilesToFetch = [];

        ZOOM_LEVELS.forEach(z => {
            const top = lat2tile(bounds.north, z);
            const bottom = lat2tile(bounds.south, z);
            const left = long2tile(bounds.west, z);
            const right = long2tile(bounds.east, z);

            for (let x = left; x <= right; x++) {
                for (let y = top; y <= bottom; y++) {
                    tilesToFetch.push({ x, y, z, key: this.getTileKey(x, y, z) });
                }
            }
        });

        return tilesToFetch;
    },

    // Download all tiles for a region (Zoom levels 10-14)
    async downloadRegion(region, onProgress) {
        const tilesToFetch = this.calculateRegionTiles(region);
        const totalTiles = tilesToFetch.length;
        const downloadedKeys = [];

        console.log(`Starting download of ${totalTiles} tiles for ${region.name}`);

        // Download with rate limiting (batch of 5)
        let processed = 0;
        const BATCH_SIZE = 5;
        let failedCount = 0;

        for (let i = 0; i < tilesToFetch.length; i += BATCH_SIZE) {
            const batch = tilesToFetch.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (tile) => {
                try {
                    // Check if exists first
                    const existingBlob = await db.get('map_tiles', tile.key);
                    if (existingBlob) {
                        downloadedKeys.push(tile.key);
                        return;
                    }

                    const url = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;

                    // Retry logic (3 attempts)
                    let response;
                    let attempts = 0;
                    while (attempts < 3) {
                        try {
                            response = await fetch(url);
                            if (response.ok) break;
                        } catch {
                            console.warn(`Attempt ${attempts + 1} failed for ${url}`);
                        }
                        attempts++;
                        await new Promise(r => setTimeout(r, 500 * attempts));
                    }

                    if (!response || !response.ok) {
                        failedCount++;
                        throw new Error('Network response was not ok after retries');
                    }

                    const blob = await response.blob();

                    // Basic validation: Check if blob is image
                    if (blob.type.startsWith('image/')) {
                        await db.put('map_tiles', blob, tile.key);
                        downloadedKeys.push(tile.key);
                    } else {
                        console.warn('Invalid tile format:', blob.type);
                        failedCount++;
                    }
                } catch (err) {
                    console.warn(`Failed to fetch tile ${tile.z}/${tile.x}/${tile.y}`, err);
                    failedCount++;
                }
            }));

            processed += batch.length;
            if (onProgress) {
                onProgress(Math.min(100, Math.round((processed / totalTiles) * 100)));
            }

            // Polite delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
        }

        // Save manifest of downloaded tiles for this region
        await this.saveRegionManifest(region.id, downloadedKeys);

        console.log(`Region download complete. ${downloadedKeys.length}/${totalTiles} tiles saved. ${failedCount} failed.`);

        // If too many tiles failed, consider it a failure
        if (failedCount > totalTiles * 0.2) {
            throw new Error(`Too many tile downloads failed (${failedCount}/${totalTiles})`);
        }
    },

    // Clear tiles for a specific region
    async clearRegionTiles(regionId) {
        const manifestKey = `manifest-${regionId}`;
        const manifest = await db.get('datasets', manifestKey);

        if (manifest?.tiles) {
            console.log(`Clearing ${manifest.tiles.length} tiles for region ${regionId}`);
            for (const key of manifest.tiles) {
                try {
                    await db.delete('map_tiles', key);
                } catch (e) {
                    console.warn(`Failed to delete tile ${key}:`, e);
                }
            }
        }

        // Remove manifest
        await db.delete('datasets', manifestKey);
    },

    async clearAllTiles() {
        const keys = await db.getAllKeys('map_tiles');
        console.log(`Clearing all ${keys.length} tiles`);
        for (const key of keys) {
            await db.delete('map_tiles', key);
        }
        // Also revoke any active blob URLs
        this.revokeAllTileUrls();
    },

    async getStorageUsage() {
        const keys = await db.getAllKeys('map_tiles');
        // Assuming avg tile is 20KB
        return (keys.length * 0.02).toFixed(1);
    },

    async getTileCount() {
        const keys = await db.getAllKeys('map_tiles');
        return keys.length;
    }
};
