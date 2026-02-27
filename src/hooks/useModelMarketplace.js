/**
 * useModelMarketplace Hook
 * 
 * Encapsulates all state and business logic for the Model Marketplace.
 * - Manages filtered model lists based on active tabs
 * - Handles model downloads and progress tracking
 * - Manages device capability profiling
 * - Handles model deletion and selection
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AIModelManager } from '../services/ai/AIModelManager';
import DeviceCapabilityProfiler from '../services/ai/DeviceCapabilityProfiler';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { HapticsService, ImpactStyle, NotificationType } from '../services/HapticsService';
import { createLogger } from '../utils/logger';

const log = createLogger('useModelMarketplace');

export const useModelMarketplace = () => {
    // State
    const [activeTab, setActiveTab] = useState('recommended');
    const [sortBy, setSortBy] = useState('compatibility');
    const [deviceProfile, setDeviceProfile] = useState(null);
    const [isProfiling, setIsProfiling] = useState(true);
    const [models, setModels] = useState([]);
    const [installedModels, setInstalledModels] = useState([]);
    const [activeModel, setActiveModel] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState({});
    const [downloadStatus, setDownloadStatus] = useState({});
    const [resumeInfo, setResumeInfo] = useState({});
    const [error, setError] = useState(null);

    // Refs for safe async state updates
    const isMounted = useRef(true);

    // Initial Load & Profiling
    useEffect(() => {
        isMounted.current = true;

        const init = async () => {
            try {
                // 1. Run device profiling
                log.info('Starting device profiling...');
                const profile = await DeviceCapabilityProfiler.profileDevice();

                if (isMounted.current) {
                    setDeviceProfile(profile);
                    setIsProfiling(false);
                }

                // 2. Load models
                await refreshModels();

            } catch (err) {
                log.error('Initialization failed', err);
                if (isMounted.current) {
                    setError('Failed to initialize marketplace');
                    setIsProfiling(false);
                }
            }
        };

        init();

        return () => {
            isMounted.current = false;
        };
    }, [refreshModels]);

    // Refresh model lists
    const refreshModels = useCallback(async () => {
        try {
            const allModels = TransformersEngine.getAvailableModels();
            const installed = await AIModelManager.getInstalledModels();
            const current = await AIModelManager.getCurrentModel();

            // Check for resumable downloads
            const resumable = {};
            for (const model of allModels) {
                const info = await AIModelManager.getResumeInfo(model.id);
                if (info && info.canResume) {
                    resumable[model.id] = info;
                }
            }

            if (isMounted.current) {
                setModels(allModels);
                setInstalledModels(installed.map(m => m.id));
                setActiveModel(current?.id || null);
                setResumeInfo(resumable);
            }
        } catch (err) {
            log.error('Failed to refresh models', err);
        }
    }, []);

    // Handlers
    const handleDownload = useCallback(async (modelId) => {
        if (downloadProgress[modelId]) return; // Already downloading

        try {
            setDownloadStatus(prev => ({ ...prev, [modelId]: 'Starting...' }));
            setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }));

            await AIModelManager.downloadModel(modelId, (progress, status) => {
                if (isMounted.current) {
                    setDownloadProgress(prev => ({ ...prev, [modelId]: progress }));
                    setDownloadStatus(prev => ({ ...prev, [modelId]: status }));
                }
            });

            HapticsService.notification(NotificationType.Success);
            await refreshModels();

        } catch (err) {
            log.error('Download failed', err);
            HapticsService.notification(NotificationType.Error);
            if (isMounted.current) {
                setDownloadStatus(prev => ({ ...prev, [modelId]: 'Failed' }));
            }
        } finally {
            if (isMounted.current) {
                // Clear progress after short delay
                setTimeout(() => {
                    setDownloadProgress(prev => {
                        const next = { ...prev };
                        delete next[modelId];
                        return next;
                    });
                    setDownloadStatus(prev => {
                        const next = { ...prev };
                        delete next[modelId];
                        return next;
                    });
                }, 1000);
            }
        }
    }, [downloadProgress, refreshModels]);

    const handleResume = useCallback(async (modelId) => {
        log.info('Resuming download', { modelId });
        await handleDownload(modelId);
    }, [handleDownload]);

    const handleSelect = useCallback(async (modelId) => {
        try {
            HapticsService.selection();
            await AIModelManager.loadModel(modelId, (_progress, _status) => {
                // Optional: show loading state for switching
            });
            await refreshModels();
        } catch (err) {
            log.error('Failed to select model', err);
            HapticsService.notification(NotificationType.Error);
        }
    }, [refreshModels]);

    const handleDelete = useCallback(async (modelId) => {
        try {
            HapticsService.impact(ImpactStyle.Heavy);
            await AIModelManager.deleteModel(modelId);
            await refreshModels();
            HapticsService.notification(NotificationType.Success);
        } catch (err) {
            log.error('Failed to delete model', err);
            HapticsService.notification(NotificationType.Error);
        }
    }, [refreshModels]);

    // Computed Logic: Filtering & Sorting
    const filteredAndSortedModels = useMemo(() => {
        if (!deviceProfile) return [];

        let result = [...models];

        // Filter by Tab
        if (activeTab === 'recommended') {
            result = result.filter(m => m.recommended || m.tier === 'pro');
        } else if (activeTab === 'fast') {
            result = result.filter(m => m.category === 'lightweight' || m.speedRating >= 4);
        } else if (activeTab === 'quality') {
            result = result.filter(m => m.category === 'quality' || m.qualityRating >= 4);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'compatibility') {
                const scoreA = calculateCompatibilityScore(a, deviceProfile);
                const scoreB = calculateCompatibilityScore(b, deviceProfile);
                return scoreB - scoreA;
            } else if (sortBy === 'size_asc') {
                return a.size - b.size;
            } else if (sortBy === 'size_desc') {
                return b.size - a.size;
            } else if (sortBy === 'quality') {
                return b.qualityRating - a.qualityRating;
            }
            return 0;
        });

        return result;
    }, [models, activeTab, sortBy, deviceProfile]);

    return {
        // State
        activeTab,
        setActiveTab,
        sortBy,
        setSortBy,
        deviceProfile,
        isProfiling,
        filteredModels: filteredAndSortedModels,
        installedModels,
        activeModel,
        downloadProgress,
        downloadStatus,
        resumeInfo,
        error,

        // Actions
        handleDownload,
        handleResume,
        handleSelect,
        handleDelete,
        refreshModels
    };
};

/**
 * Helper: Calculate compatibility score
 * (Moved from main component for reuse in Hook loops if needed, 
 * though strictly it's a util. Keeping it local to module for now)
 */
export const calculateCompatibilityScore = (model, deviceProfile) => {
    if (!deviceProfile) return 50;

    const { recommendations, hardware, runtime } = deviceProfile;
    const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };

    let score = 50; // Base score

    // 1. Tier match (0-30 points)
    const deviceTier = tierPriority[recommendations.tier] || 1;
    const modelTier = tierPriority[model.tier] || 1;
    const tierDiff = Math.abs(deviceTier - modelTier);
    score += Math.max(0, 30 - (tierDiff * 15));

    // 2. Size fit (0-20 points)
    const sizeRatio = model.size / recommendations.maxModelSize;
    if (sizeRatio <= 0.5) score += 20;
    else if (sizeRatio <= 0.8) score += 15;
    else if (sizeRatio <= 1.0) score += 10;
    else if (sizeRatio <= 1.5) score += 5;

    // 3. Performance match (0-20 points)
    const qualityMatch = model.qualityRating / 5;
    const speedMatch = model.speedRating / 5;

    if (recommendations.inferencePriority === 'quality') {
        score += qualityMatch * 20;
    } else if (recommendations.inferencePriority === 'speed') {
        score += speedMatch * 20;
    } else {
        score += ((qualityMatch + speedMatch) / 2) * 20;
    }

    // 4. Battery (0-15 points)
    if (runtime.battery.isLowPower) {
        if (model.size < 400 * 1024 * 1024) score += 15;
        else if (model.size < 800 * 1024 * 1024) score += 8;
    } else {
        score += 10;
    }

    // 5. Storage (0-10 points)
    if (hardware.storage.available) {
        const storageRatio = model.size / hardware.storage.available;
        if (storageRatio < 0.1) score += 10;
        else if (storageRatio < 0.2) score += 7;
        else if (storageRatio < 0.3) score += 4;
    }

    // 6. Category bonus
    const categoryBonus = {
        'lightweight': recommendations.inferencePriority === 'speed' ? 5 : 2,
        'balanced': 3,
        'quality': recommendations.inferencePriority === 'quality' ? 5 : 2
    };
    score += categoryBonus[model.category] || 0;

    return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Helper: Get warning level
 */
export const getModelWarningLevel = (model, deviceProfile) => {
    if (!deviceProfile) return { level: 'none', message: null };

    const { recommendations, runtime } = deviceProfile;

    // Critical: > 2x max size
    if (model.size > recommendations.maxModelSize * 2) {
        return {
            level: 'critical',
            severity: 'critical',
            message: `Requires ${model.sizeDisplay} (Limit: ${Math.round(recommendations.maxModelSize * 2 / 1024 / 1024 / 1024 * 10) / 10}GB). Likely won't run.`,
            canRun: false
        };
    }

    // Severe: > 1.5x max size
    if (model.size > recommendations.maxModelSize * 1.5) {
        return {
            level: 'severe',
            severity: 'warning',
            message: `Much larger than recommended. Expect fast battery drain and lag.`,
            canRun: true,
            batteryImpact: 'high',
            performanceImpact: 'severe'
        };
    }

    // Warning: > max size
    if (model.size > recommendations.maxModelSize) {
        return {
            level: 'warning',
            severity: 'warning',
            message: `Exceeds recommended size. Will run sluggishly.`,
            canRun: true,
            batteryImpact: 'medium',
            performanceImpact: 'moderate'
        };
    }

    // Battery Warning
    if (runtime.battery.isLowPower && model.size > 600 * 1024 * 1024) {
        return {
            level: 'battery',
            severity: 'info',
            message: `Low Battery. Large models drain power quickly.`,
            canRun: true,
            batteryImpact: 'medium',
            performanceImpact: 'low'
        };
    }

    // Thermal Warning
    if (deviceProfile.thermal.state === 'serious' || deviceProfile.thermal.state === 'critical') {
        return {
            level: 'thermal',
            severity: 'info',
            message: `Device is warm. Big models may cause throttling.`,
            canRun: true,
            batteryImpact: 'low',
            performanceImpact: 'moderate'
        };
    }

    return { level: 'none', severity: 'none', message: null, canRun: true };
};

// Needed for TransformersEngine usage (it was a named import in original)
import TransformersEngine from '../services/ai/TransformersEngine';
