import { useState, useCallback } from 'react';
import { dataManager } from '../services/dataManager';
import { createLogger } from '../utils/logger';

const log = createLogger('useOfflineData');

export const useOfflineData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const downloadRegion = useCallback(async (regionId) => {
        setLoading(true);
        setError(null);
        try {
            await dataManager.installRegion(regionId);
            log.info(`Region ${regionId} installed successfully`);
            return true;
        } catch (err) {
            log.error(`Failed to install region ${regionId}`, err);
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRegion = useCallback(async (regionId) => {
        setLoading(true);
        try {
            await dataManager.uninstallRegion(regionId);
            log.info(`Region ${regionId} uninstalled successfully`);
            return true;
        } catch (err) {
            log.error(`Failed to uninstall region ${regionId}`, err);
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        downloadRegion,
        deleteRegion,
        loading,
        error
    };
};
