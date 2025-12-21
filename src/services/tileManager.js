import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('TileManager');

// Utils for tile math
const long2tile = (lon, zoom) => (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
const lat2tile = (lat, zoom) => (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

export const tileManager = {
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
    async downloadRegion(region, onProgress) {
        const ZOOM_LEVELS = [10, 11, 12, 13, 14];
        const [lat, lon] = region.coordinates;

        // Define a bounding box (approx +/- 0.1 degrees for demo)
        // In a real app, region would have a bbox property
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
        log.info(`Starting download of ${totalTiles} tiles for ${region.name}`);

        // 2. Download with rate limiting (batch of 5)
        let processed = 0;
        const BATCH_SIZE = 5;

        for (let i = 0; i < tilesToFetch.length; i += BATCH_SIZE) {
            const batch = tilesToFetch.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (tile) => {
                try {
                    // Check if exists first
                    const existing = await this.getTile(tile.x, tile.y, tile.z);
                    if (existing) return;

                    const url = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;

                    // Retry logic (3 attempts)
                    let response;
                    let attempts = 0;
                    while (attempts < 3) {
                        try {
                            response = await fetch(url);
                            if (response.ok) break;
                        } catch {
                            log.warn(`Attempt ${attempts + 1} failed for ${url}`);
                        }
                        attempts++;
                        await new Promise(r => setTimeout(r, 500 * attempts)); // Exponential backoffish
                    }

                    if (!response || !response.ok) throw new Error('Network response was not ok after retries');

                    const blob = await response.blob();

                    // Basic validation: Check if blob is image
                    if (blob.type.startsWith('image/')) {
                        await this.saveTile(tile.x, tile.y, tile.z, blob);
                    } else {
                        log.warn(`Invalid tile format: ${blob.type}`);
                    }
                } catch (err) {
                    log.warn(`Failed to fetch tile ${tile.z}/${tile.x}/${tile.y}`, err);
                }
            }));

            processed += batch.length;
            if (onProgress) onProgress(Math.min(100, Math.round((processed / totalTiles) * 100)));

            // Polite delay
            await new Promise(r => setTimeout(r, 200));
        }

        log.info('Region download complete');
    },

    async clearAllTiles() {
        // This is a heavy operation, ideally we'd delete by range keys if IDB supported it easily
        // For now, we clear the whole store (assuming one region active or user wants full clear)
        const keys = await db.getAllKeys('map_tiles');
        for (const key of keys) {
            await db.delete('map_tiles', key);
        }
    },

    async getStorageUsage() {
        // Approximate size
        const keys = await db.getAllKeys('map_tiles');
        // Assuming avg tile is 20KB
        return (keys.length * 0.02).toFixed(1);
    }
};
