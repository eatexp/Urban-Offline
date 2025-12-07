import { db, StorageQuotaError } from './db';

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

// Installation status enum
const InstallStatus = {
    DOWNLOADING: 'downloading',
    INSTALLED: 'installed',
    FAILED: 'failed'
};

export const dataManager = {
    async getAvailableRegions() {
        const installed = await db.getAll('datasets');
        const installedIds = new Map(installed.map(d => [d.id, d]));

        return AVAILABLE_REGIONS.map(r => {
            const record = installedIds.get(r.id);
            return {
                ...r,
                isInstalled: record?.status === InstallStatus.INSTALLED,
                isDownloading: record?.status === InstallStatus.DOWNLOADING,
                installedAt: record?.installedAt || null
            };
        });
    },

    async installRegion(regionId, onProgress) {
        const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
        if (!region) throw new Error('Region not found');

        // 1. Save metadata with DOWNLOADING status (atomic start)
        const metadata = {
            id: region.id,
            name: region.name,
            type: region.type,
            size: region.size,
            description: region.description,
            coordinates: region.coordinates,
            modules: region.modules,
            status: InstallStatus.DOWNLOADING,
            startedAt: new Date().toISOString(),
            installedAt: null
        };

        await db.put('datasets', metadata);

        try {
            // 2. Download tiles if needed
            if (region.modules.includes('map-tiles')) {
                const { tileManager } = await import('./tileManager');
                await tileManager.downloadRegion(region, onProgress);
            }

            // 3. Update status to INSTALLED only after successful download
            metadata.status = InstallStatus.INSTALLED;
            metadata.installedAt = new Date().toISOString();
            await db.put('datasets', metadata);

            return true;
        } catch (error) {
            // 4. On failure, mark as FAILED and cleanup
            console.error('Region installation failed:', error);

            // Mark as failed in database
            metadata.status = InstallStatus.FAILED;
            metadata.failedAt = new Date().toISOString();
            metadata.errorMessage = error.message;
            await db.put('datasets', metadata);

            // Clean up any partially downloaded tiles
            try {
                const { tileManager } = await import('./tileManager');
                await tileManager.clearRegionTiles(regionId);
            } catch (cleanupError) {
                console.warn('Tile cleanup failed:', cleanupError);
            }

            // Re-throw with user-friendly message
            if (error instanceof StorageQuotaError) {
                throw error;
            }
            throw new Error(`Installation failed: ${error.message}`);
        }
    },

    async uninstallRegion(regionId) {
        // Clean up tiles first, then remove metadata
        try {
            const { tileManager } = await import('./tileManager');
            await tileManager.clearRegionTiles(regionId);
        } catch (error) {
            console.warn('Tile cleanup error during uninstall:', error);
        }

        await db.delete('datasets', regionId);
        return true;
    },

    async getInstalledRegions() {
        const all = await db.getAll('datasets');
        // Only return fully installed regions
        return all.filter(r => r.status === InstallStatus.INSTALLED);
    },

    async getDownloadingRegions() {
        const all = await db.getAll('datasets');
        return all.filter(r => r.status === InstallStatus.DOWNLOADING);
    },

    async retryFailedInstall(regionId, onProgress) {
        // Remove failed record and retry
        await db.delete('datasets', regionId);
        return await this.installRegion(regionId, onProgress);
    },

    async getStorageUsage() {
        const installed = await db.getAll('datasets');
        const guides = await db.getAll('guides');

        let totalMB = 0;

        installed.forEach(item => {
            if (item.status === InstallStatus.INSTALLED) {
                const size = parseFloat(item.size);
                if (!isNaN(size)) totalMB += size;
            }
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
