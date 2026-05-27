/**
 * SmartDownloadPrompt - Contextual AI model download prompt
 *
 * Shows a non-intrusive prompt to download AI models when conditions are favorable:
 * - Connected to WiFi (not cellular)
 * - Device is charging
 * - Sufficient storage available
 *
 * Respects user preferences and doesn't show again if dismissed.
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Wifi, Battery, HardDrive, Sparkles } from 'lucide-react';
import { AIModelManager } from '../../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../../services/ai/TransformersEngine';
import { createLogger } from '../../utils/logger';

const log = createLogger('SmartDownloadPrompt');

// Storage key for dismissal tracking
const PROMPT_DISMISSED_KEY = 'ai_download_prompt_dismissed';
const PROMPT_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if device conditions are favorable for download
 */
async function checkConditions() {
    const conditions = {
        wifi: false,
        charging: false,
        storage: false,
        allMet: false
    };

    try {
        // Check network connection type
        if ('connection' in navigator) {
            const conn = navigator.connection;
            conditions.wifi = conn.type === 'wifi' || conn.effectiveType === '4g';
        } else {
            // Assume wifi if online (can't determine connection type)
            conditions.wifi = navigator.onLine;
        }

        // Check battery status
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            conditions.charging = battery.charging;
        } else {
            // Assume plugged in on desktop
            conditions.charging = true;
        }

        // Check storage availability
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const availableGB = (estimate.quota - estimate.usage) / (1024 * 1024 * 1024);
            conditions.storage = availableGB >= 1; // At least 1GB free
        } else {
            conditions.storage = true; // Assume OK if can't check
        }

        conditions.allMet = conditions.wifi && conditions.charging && conditions.storage;

    } catch (error) {
        log.debug('Condition check failed', error);
    }

    return conditions;
}

/**
 * Check if prompt was recently dismissed
 */
function wasRecentlyDismissed() {
    try {
        const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < PROMPT_DISMISS_DURATION) {
                return true;
            }
        }
    } catch (_error) {
        // localStorage not available
    }
    return false;
}

/**
 * Mark prompt as dismissed
 */
function markDismissed() {
    try {
        localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    } catch (_error) {
        // localStorage not available
    }
}

/**
 * SmartDownloadPrompt Component
 *
 * @param {Object} props
 * @param {Function} props.onDownload - Called when user initiates download
 * @param {Function} props.onDismiss - Called when user dismisses prompt
 * @param {boolean} props.forceShow - Force show regardless of conditions (for testing)
 */
const SmartDownloadPrompt = ({ onDownload, onDismiss, forceShow = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [conditions, setConditions] = useState(null);
    const [hasAIModel, setHasAIModel] = useState(false);
    const [selectedModel, setSelectedModel] = useState('tinyllama');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Check conditions and model status on mount
    useEffect(() => {
        const init = async () => {
            // Check if any model is already installed
            await AIModelManager.init();
            const models = await AIModelManager.getAvailableModels();
            const hasInstalled = models.some(m => m.isInstalled);
            setHasAIModel(hasInstalled);

            if (hasInstalled) {
                log.debug('AI model already installed, not showing prompt');
                return;
            }

            // Check if recently dismissed
            if (wasRecentlyDismissed() && !forceShow) {
                log.debug('Prompt recently dismissed');
                return;
            }

            // Check device conditions
            const deviceConditions = await checkConditions();
            setConditions(deviceConditions);

            // Show prompt if conditions are favorable
            if (deviceConditions.allMet || forceShow) {
                setIsVisible(true);
                log.info('Showing download prompt', deviceConditions);
            }
        };

        init();

        // Re-check conditions periodically
        const interval = setInterval(async () => {
            if (!isVisible && !hasAIModel) {
                const deviceConditions = await checkConditions();
                setConditions(deviceConditions);
                if (deviceConditions.allMet && !wasRecentlyDismissed()) {
                    setIsVisible(true);
                }
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [forceShow, hasAIModel, isVisible]);

    // Handle dismiss
    const handleDismiss = () => {
        markDismissed();
        setIsVisible(false);
        onDismiss?.();
    };

    // Handle download
    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            const result = await AIModelManager.downloadModel(selectedModel, (progress, message) => {
                setDownloadProgress(progress);
                log.debug('Download progress', { progress, message });
            });

            if (result.success) {
                setIsDownloading(false);
                setHasAIModel(true);
                setIsVisible(false);
                onDownload?.();
            } else {
                // Download completed but failed
                setIsDownloading(false);
                log.error('Download returned failure', result.error);
            }
        } catch (error) {
            log.error('Download failed', error);
            setIsDownloading(false);
        }
    };

    if (!isVisible) return null;

    const modelConfig = TRANSFORMERS_MODELS[selectedModel];

    return (
        <div
            className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up"
            style={{ maxWidth: '400px', margin: '0 auto' }}
            role="region"
            aria-label="Smart Download Prompt"
        >
            <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border-primary)'
                }}
            >
                {/* Header with gradient */}
                <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-purple))'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-white" />
                        <span className="font-semibold text-white">Enhance Your Assistant</span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        disabled={isDownloading}
                        aria-label="Dismiss download prompt"
                    >
                        <X size={18} className="text-white/80" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {!isDownloading ? (
                        <>
                            {/* Description */}
                            <p
                                className="text-sm mb-4"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                Download AI for personalized answers that work completely offline.
                            </p>

                            {/* Conditions met indicators */}
                            {conditions && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                        style={{
                                            background: conditions.wifi ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: conditions.wifi ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}
                                    >
                                        <Wifi size={12} />
                                        {conditions.wifi ? 'WiFi' : 'No WiFi'}
                                    </span>
                                    <span
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                        style={{
                                            background: conditions.charging ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: conditions.charging ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}
                                    >
                                        <Battery size={12} />
                                        {conditions.charging ? 'Charging' : 'On Battery'}
                                    </span>
                                    <span
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                        style={{
                                            background: conditions.storage ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: conditions.storage ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}
                                    >
                                        <HardDrive size={12} />
                                        {conditions.storage ? 'Storage OK' : 'Low Storage'}
                                    </span>
                                </div>
                            )}

                            {/* Model selection */}
                            <div className="mb-4">
                                <p
                                    className="text-xs mb-2"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    Choose AI model:
                                </p>
                                <div className="space-y-2">
                                    {Object.values(TRANSFORMERS_MODELS).map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
                                            aria-pressed={selectedModel === model.id}
                                            style={{
                                                background: selectedModel === model.id
                                                    ? 'var(--color-primary-900)'
                                                    : 'var(--color-bg-tertiary)',
                                                border: selectedModel === model.id
                                                    ? '1px solid var(--color-primary-500)'
                                                    : '1px solid var(--color-border-primary)'
                                            }}
                                        >
                                            <div className="text-left">
                                                <div
                                                    className="text-sm font-medium"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                    {model.name}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{ color: 'var(--color-text-muted)' }}
                                                >
                                                    {model.description}
                                                </div>
                                            </div>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
                                                {model.sizeDisplay}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        color: 'var(--color-text-secondary)',
                                        border: '1px solid var(--color-border-primary)'
                                    }}
                                >
                                    Maybe Later
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                                        color: 'white'
                                    }}
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                            </div>

                            {/* Note */}
                            <p
                                className="text-xs text-center mt-3"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                The app works fully without this
                            </p>
                        </>
                    ) : (
                        /* Download progress with cancel button */
                        <div className="py-2">
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    Downloading {modelConfig?.name}...
                                </span>
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {downloadProgress}%
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: 'var(--color-bg-tertiary)' }}
                                role="progressbar"
                                aria-valuenow={downloadProgress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${downloadProgress}%`,
                                        background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-accent-purple))'
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    Don't close the app during download
                                </p>
                                <button
                                    onClick={() => {
                                        AIModelManager.cancelDownload(selectedModel);
                                        setIsDownloading(false);
                                        setDownloadProgress(0);
                                    }}
                                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        color: 'var(--color-danger)',
                                        border: '1px solid var(--color-border-primary)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartDownloadPrompt;
