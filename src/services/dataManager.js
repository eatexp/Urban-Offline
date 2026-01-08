import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('DataManager');

/**
 * Default regions bundled with the app
 * These can be downloaded when online, or pre-bundled in the app package
 */
const DEFAULT_REGIONS = [
    {
        id: 'region-london',
        name: 'London, UK',
        type: 'region',
        coordinates: [51.5074, -0.1278],
        bounds: [[51.28, -0.51], [51.69, 0.33]], // SW, NE corners
        sizeBytes: 131072000, // 125 MB
        description: 'Greater London area. Includes hospitals, shelters, and offline map tiles.',
        modules: ['map-tiles', 'places-medical', 'places-shelter', 'flood-zones'],
        zoomLevels: [8, 9, 10, 11, 12, 13, 14],
        tileServer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        poiEndpoint: '/assets/regions/london-pois.json'
    },
    {
        id: 'region-manchester',
        name: 'Manchester, UK',
        type: 'region',
        coordinates: [53.4808, -2.2426],
        bounds: [[53.35, -2.45], [53.60, -2.05]],
        sizeBytes: 78643200, // 75 MB
        description: 'Greater Manchester area. Includes flood zone data and emergency shelters.',
        modules: ['map-tiles', 'places-medical', 'places-shelter', 'flood-zones'],
        zoomLevels: [8, 9, 10, 11, 12, 13, 14],
        tileServer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        poiEndpoint: '/assets/regions/manchester-pois.json'
    },
    {
        id: 'region-birmingham',
        name: 'Birmingham, UK',
        type: 'region',
        coordinates: [52.4862, -1.8904],
        bounds: [[52.35, -2.05], [52.60, -1.70]],
        sizeBytes: 73400320, // 70 MB
        description: 'West Midlands area. Includes hospitals and emergency services.',
        modules: ['map-tiles', 'places-medical', 'places-shelter'],
        zoomLevels: [8, 9, 10, 11, 12, 13, 14],
        tileServer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        poiEndpoint: '/assets/regions/birmingham-pois.json'
    },
    {
        id: 'region-uk-national',
        name: 'UK National (Low Detail)',
        type: 'national',
        coordinates: [54.0, -2.0],
        bounds: [[49.5, -8.5], [61.0, 2.0]],
        sizeBytes: 52428800, // 50 MB
        description: 'UK-wide coverage at lower zoom levels. Good for travel and overview.',
        modules: ['map-tiles'],
        zoomLevels: [5, 6, 7, 8, 9],
        tileServer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        poiEndpoint: null
    }
];

// Size budget constant
const SIZE_BUDGET_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse size string to bytes
 */
function parseSizeToBytes(sizeStr) {
    if (typeof sizeStr === 'number') return sizeStr;
    if (!sizeStr) return 0;

    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    switch (unit) {
        case 'GB': return value * 1024 * 1024 * 1024;
        case 'MB': return value * 1024 * 1024;
        case 'KB': return value * 1024;
        default: return value;
    }
}

export const dataManager = {
    /**
     * Get all available regions (bundled + any from server)
     */
    async getAvailableRegions() {
        try {
            // Get installed regions from database
            const installed = await db.getAll('datasets').catch(() => []);
            const installedIds = new Set((installed || []).map(d => d.id));

            // Try to fetch additional regions from manifest (if available)
            let additionalRegions = [];
            try {
                const response = await fetch('/assets/regions-manifest.json');
                if (response.ok) {
                    const manifest = await response.json();
                    additionalRegions = manifest.regions || [];
                }
            } catch (_fetchError) {
                // No additional regions available
            }

            // Merge default and additional regions
            const allRegions = [...DEFAULT_REGIONS];
            for (const region of additionalRegions) {
                if (!allRegions.find(r => r.id === region.id)) {
                    allRegions.push(region);
                }
            }

            // Mark installed status
            return allRegions.map(r => {
                const installedData = (installed || []).find(d => d.id === r.id);
                return {
                    ...r,
                    size: formatBytes(r.sizeBytes),
                    isInstalled: installedIds.has(r.id),
                    installedAt: installedData?.installedAt || null,
                    downloadedBytes: installedData?.downloadedBytes || 0
                };
            });
        } catch (error) {
            log.error('Failed to get regions', error);
            // Return default regions with none installed
            return DEFAULT_REGIONS.map(r => ({
                ...r,
                size: formatBytes(r.sizeBytes),
                isInstalled: false,
                installedAt: null
            }));
        }
    },

    /**
     * Install a region (download tiles and POI data)
     */
    async installRegion(regionId, onProgress) {
        // Find region definition
        const regions = await this.getAvailableRegions();
        const region = regions.find(r => r.id === regionId);

        if (!region) {
            throw new Error(`Region not found: ${regionId}`);
        }

        if (region.isInstalled) {
            log.info(`Region ${regionId} is already installed`);
            return true;
        }

        log.info(`Installing region: ${region.name}`);

        try {
            // Check storage budget
            const usage = await this.getStorageUsage();
            const availableBytes = SIZE_BUDGET_BYTES - usage.usedBytes;

            if (region.sizeBytes > availableBytes) {
                throw new Error(`Insufficient storage. Need ${formatBytes(region.sizeBytes)}, have ${formatBytes(availableBytes)}`);
            }

            // Save metadata first (marks as "installing")
            const installRecord = {
                id: region.id,
                name: region.name,
                type: region.type,
                sizeBytes: region.sizeBytes,
                size: formatBytes(region.sizeBytes),
                description: region.description,
                coordinates: region.coordinates,
                bounds: region.bounds,
                modules: region.modules,
                zoomLevels: region.zoomLevels,
                status: 'installing',
                installedAt: new Date().toISOString(),
                downloadedBytes: 0
            };

            await db.put('datasets', installRecord);

            let progress = 0;
            const reportProgress = (p) => {
                progress = p;
                if (onProgress) onProgress(p);
            };

            // Download map tiles if module includes them
            if (region.modules.includes('map-tiles')) {
                reportProgress(5);

                try {
                    const { tileManager } = await import('./tileManager');
                    await tileManager.downloadRegion(region, (tileProgress) => {
                        // Tiles are 80% of the work
                        reportProgress(5 + (tileProgress * 0.8));
                    });
                } catch (tileError) {
                    log.error('Tile download failed', tileError);
                    // Continue - partial installation is better than none
                }
            }

            reportProgress(85);

            // Download POI data if available
            if (region.poiEndpoint) {
                try {
                    const poiResponse = await fetch(region.poiEndpoint);
                    if (poiResponse.ok) {
                        const poiData = await poiResponse.json();
                        await db.put('data_content', {
                            id: `${region.id}-pois`,
                            regionId: region.id,
                            type: 'pois',
                            data: poiData,
                            importedAt: new Date().toISOString()
                        });
                    }
                } catch (poiError) {
                    log.warn('POI download failed', poiError);
                    // Non-critical, continue
                }
            }

            reportProgress(95);

            // Update record to mark as complete
            installRecord.status = 'installed';
            installRecord.downloadedBytes = region.sizeBytes;
            await db.put('datasets', installRecord);

            reportProgress(100);
            log.info(`Region ${region.name} installed successfully`);

            return true;
        } catch (error) {
            log.error('Region installation failed', error);

            // Clean up partial installation
            try {
                await db.delete('datasets', regionId);
            } catch (cleanupError) {
                log.error('Failed to cleanup after installation error', cleanupError);
            }

            throw error;
        }
    },

    /**
     * Uninstall a region
     */
    async uninstallRegion(regionId) {
        log.info(`Uninstalling region: ${regionId}`);

        try {
            // Get region data first
            const region = await db.get('datasets', regionId);

            // Delete metadata
            await db.delete('datasets', regionId);

            // Delete POI data
            try {
                await db.delete('data_content', `${regionId}-pois`);
            } catch (_e) {
                // POI data might not exist
            }

            // Clean up tiles for this region
            if (region?.bounds) {
                try {
                    const { tileManager } = await import('./tileManager');
                    await tileManager.clearRegionTiles(regionId);
                } catch (tileError) {
                    log.warn('Failed to clear region tiles', tileError);
                }
            }

            log.info(`Region ${regionId} uninstalled`);
            return true;
        } catch (error) {
            log.error('Region uninstallation failed', error);
            throw error;
        }
    },

    /**
     * Get all installed regions
     */
    async getInstalledRegions() {
        try {
            const regions = await db.getAll('datasets');
            return (regions || []).filter(r => r.status === 'installed' || !r.status);
        } catch (error) {
            log.error('Failed to get installed regions', error);
            return [];
        }
    },

    /**
     * Get storage usage statistics
     */
    async getStorageUsage() {
        try {
            const [installed, guides, content, tiles] = await Promise.all([
                db.getAll('datasets').catch(() => []),
                db.getAll('guides').catch(() => []),
                db.getAll('health_content').catch(() => []),
                db.getAll('map_tiles').catch(() => [])
            ]);

            let usedBytes = 0;

            // Sum region sizes
            (installed || []).forEach(item => {
                usedBytes += item.downloadedBytes || parseSizeToBytes(item.size) || 0;
            });

            // Estimate guide sizes
            (guides || []).forEach(item => {
                usedBytes += parseSizeToBytes(item.size) || 10240; // Default 10KB per guide
            });

            // Estimate content sizes (rough estimate: 50KB per article)
            usedBytes += (content || []).length * 51200;

            // Count tiles (estimate 20KB per tile)
            usedBytes += (tiles || []).length * 20480;

            return {
                usedBytes,
                used: formatBytes(usedBytes),
                totalBytes: SIZE_BUDGET_BYTES,
                total: formatBytes(SIZE_BUDGET_BYTES),
                availableBytes: SIZE_BUDGET_BYTES - usedBytes,
                available: formatBytes(SIZE_BUDGET_BYTES - usedBytes),
                percentUsed: Math.round((usedBytes / SIZE_BUDGET_BYTES) * 100)
            };
        } catch (error) {
            log.error('Failed to calculate storage usage', error);
            return {
                usedBytes: 0,
                used: '0 B',
                totalBytes: SIZE_BUDGET_BYTES,
                total: formatBytes(SIZE_BUDGET_BYTES),
                availableBytes: SIZE_BUDGET_BYTES,
                available: formatBytes(SIZE_BUDGET_BYTES),
                percentUsed: 0
            };
        }
    },

    /**
     * Get region by ID
     */
    async getRegion(regionId) {
        try {
            return await db.get('datasets', regionId);
        } catch (error) {
            log.error(`Failed to get region ${regionId}`, error);
            return null;
        }
    },

    /**
     * Check if a specific region is installed
     */
    async isRegionInstalled(regionId) {
        const region = await this.getRegion(regionId);
        return region?.status === 'installed' || (region && !region.status);
    }
};
