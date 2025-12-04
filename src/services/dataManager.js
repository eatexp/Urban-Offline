import { db } from './db';

// Mock Regions (Simulating a server response)
const AVAILABLE_REGIONS = [
    {
        id: 'region-london',
        name: 'London, UK',
        type: 'region',
        coordinates: [51.5074, -0.1278],
        size: '125 MB',
        description: 'Greater London area. Includes hospitals, shelters, and offline map tiles.',
        modules: ['map-tiles', 'places-medical', 'places-shelter']
    },
    {
        id: 'region-nyc',
        name: 'New York City, USA',
        type: 'region',
        coordinates: [40.7128, -74.0060],
        size: '140 MB',
        description: 'NYC Metro area. Includes evacuation routes and medical centers.',
        modules: ['map-tiles', 'places-medical', 'places-evac']
    },
    {
        id: 'region-sf',
        name: 'San Francisco, USA',
        type: 'region',
        coordinates: [37.7749, -122.4194],
        size: '95 MB',
        description: 'Bay Area. Includes seismic safety zones and water points.',
        modules: ['map-tiles', 'places-water', 'places-seismic']
    }
];

export const dataManager = {
    async getAvailableRegions() {
        const installed = await db.getAll('datasets'); // Reusing 'datasets' store for regions
        const installedIds = new Set(installed.map(d => d.id));

        return AVAILABLE_REGIONS.map(r => ({
            ...r,
            isInstalled: installedIds.has(r.id),
            installedAt: installedIds.has(r.id) ? installed.find(d => d.id === r.id).installedAt : null
        }));
    },

    async installRegion(regionId, onProgress) {
        const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
        if (!region) throw new Error('Region not found');

        // Save metadata
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

        // Trigger tile download
        if (region.modules.includes('map-tiles')) {
            // Await the download to track progress
            const { tileManager } = await import('./tileManager');
            await tileManager.downloadRegion(region, onProgress);
        }

        return true;
    },

    async uninstallRegion(regionId) {
        await db.delete('datasets', regionId);
        // Clean up tiles
        import('./tileManager').then(({ tileManager }) => {
            tileManager.clearAllTiles();
        });
        return true;
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
