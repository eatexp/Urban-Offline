import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('DataManager');

// Fetches the region manifest from public assets with offline fallback
const fetchRegionsManifest = async () => {
    try {
        const response = await fetch('/regions.json');
        if (!response.ok) throw new Error('Failed to fetch regions manifest');
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

        // Return empty array as last resort
        return [];
    }
    // TODO: Resilience - Implement offline fallback (e.g. cache regions.json or bundle it)
    // If fetch fails, try to load from local storage or service worker cache specifically if not handled by generic SW.
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

    async installRegion(regionId, onProgress) {
        const regions = await fetchRegionsManifest();
        const region = regions.find(r => r.id === regionId);
        if (!region) throw new Error('Region not found');

        try {
            // Save metadata first
            await db.put('datasets', {
                id: region.id,
                name: region.name,
                type: region.type,
                size: region.size,
                description: region.description,
                coordinates: region.coordinates,
                modules: region.modules,
                installedAt: new Date().toISOString()
            });

            // Trigger tile download if needed
            if (region.modules.includes('map-tiles')) {
                try {
                    const { tileManager } = await import('./tileManager');
                    await tileManager.downloadRegion(region, onProgress);
                } catch (tileError) {
                    log.error('Tile download failed', tileError);
                    // Don't fail the whole installation if tiles fail
                    // User can retry later
                }
            }

            // Report completion
            if (onProgress) {
                onProgress(100);
            }

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

    async uninstallRegion(regionId) {
        try {
            // Delete metadata
            await db.delete('datasets', regionId);

            // Clean up tiles (async, don't wait)
            import('./tileManager').then(({ tileManager }) => {
                tileManager.clearAllTiles().catch(err => {
                    log.warn('Failed to clear tiles', err);
                });
            });

            return true;
        } catch (error) {
            log.error('Region uninstallation failed', error);
            throw error;
        }
    },

    async getInstalledRegions() {
        return await db.getAll('datasets');
    },

    // Helper to calculate total storage used (mock)
    async getStorageUsage() {
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
