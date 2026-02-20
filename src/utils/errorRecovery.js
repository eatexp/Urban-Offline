/**
 * Error Recovery System
 * 
 * Comprehensive error handling with:
 * - Categorized error types
 * - Recovery strategies per error
 * - User-friendly error messages
 * - Automatic retry logic
 * - Fallback mechanisms
 * 
 * Compliance: .clinerules §5 - Error states with actionable next steps
 *             .clinerules §6 - Never dead ends
 */

import { createLogger } from './logger';
import { isNativeMobile } from './platform';

const log = createLogger('ErrorRecovery');

/**
 * Error categories and recovery strategies
 */
export const ERROR_RECOVERY_STRATEGIES = {
    // Storage errors
    'QuotaExceededError': {
        category: 'storage',
        severity: 'critical',
        title: 'Storage Full',
        message: 'Your device is running low on storage. This can prevent downloads and updates.',
        icon: 'storage',
        actions: [
            {
                id: 'openStorageManager',
                label: 'Manage Storage',
                primary: true,
                handler: async () => {
                    // Navigate to storage management
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/settings/storage' } 
                    }));
                }
            },
            {
                id: 'enableSurvivalMode',
                label: 'Enable Survival Mode',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('enable-survival-mode'));
                }
            },
            {
                id: 'deleteLargeModels',
                label: 'Delete Large AI Models',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/ai-models', params: { filter: 'installed' } } 
                    }));
                }
            }
        ]
    },

    // AI/Model errors
    'ModelLoadError': {
        category: 'ai',
        severity: 'error',
        title: 'AI Model Failed to Load',
        message: 'The AI model could not be loaded. This may be due to insufficient memory or a corrupted download.',
        icon: 'brain',
        actions: [
            {
                id: 'suggestSmallerModel',
                label: 'Try Smaller Model',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/ai-models', params: { filter: 'fast' } } 
                    }));
                }
            },
            {
                id: 'retryDownload',
                label: 'Redownload Model',
                primary: false,
                handler: async (context) => {
                    if (context?.modelId) {
                        window.dispatchEvent(new CustomEvent('redownload-model', { 
                            detail: { modelId: context.modelId } 
                        }));
                    }
                }
            },
            {
                id: 'useOfflineMode',
                label: 'Use Offline Content',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/grokopedia' } 
                    }));
                }
            }
        ]
    },

    'ModelDownloadError': {
        category: 'ai',
        severity: 'error',
        title: 'Download Failed',
        message: 'The model download was interrupted. You can resume from where it left off.',
        icon: 'download',
        actions: [
            {
                id: 'resumeDownload',
                label: 'Resume Download',
                primary: true,
                handler: async (context) => {
                    if (context?.modelId) {
                        window.dispatchEvent(new CustomEvent('resume-download', { 
                            detail: { modelId: context.modelId } 
                        }));
                    }
                }
            },
            {
                id: 'retryDownload',
                label: 'Start Over',
                primary: false,
                handler: async (context) => {
                    if (context?.modelId) {
                        window.dispatchEvent(new CustomEvent('restart-download', { 
                            detail: { modelId: context.modelId } 
                        }));
                    }
                }
            },
            {
                id: 'checkConnection',
                label: 'Check Connection',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('check-connection'));
                }
            }
        ]
    },

    // Network errors
    'NetworkError': {
        category: 'network',
        severity: 'warning',
        title: 'Connection Issue',
        message: 'Unable to connect to the network. The app will continue working with cached content.',
        icon: 'wifi',
        actions: [
            {
                id: 'retry',
                label: 'Try Again',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('retry-last-action'));
                }
            },
            {
                id: 'showOfflineContent',
                label: 'Browse Offline Content',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/library' } 
                    }));
                }
            },
            {
                id: 'syncWhenOnline',
                label: 'Sync When Online',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('enable-auto-sync'));
                }
            }
        ]
    },

    'TimeoutError': {
        category: 'network',
        severity: 'warning',
        title: 'Request Timed Out',
        message: 'The operation took too long to complete. This may be due to slow network conditions.',
        icon: 'clock',
        actions: [
            {
                id: 'retry',
                label: 'Try Again',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('retry-last-action'));
                }
            },
            {
                id: 'workOffline',
                label: 'Work Offline',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('switch-offline-mode'));
                }
            }
        ]
    },

    // Content errors
    'ContentNotFoundError': {
        category: 'content',
        severity: 'error',
        title: 'Content Not Found',
        message: 'The requested content could not be found. It may have been removed or corrupted.',
        icon: 'file-x',
        actions: [
            {
                id: 'browseLibrary',
                label: 'Browse Library',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('navigate', { 
                        detail: { path: '/library' } 
                    }));
                }
            },
            {
                id: 'searchContent',
                label: 'Search',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('open-search'));
                }
            },
            {
                id: 'reportMissing',
                label: 'Report Missing',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('report-content-issue'));
                }
            }
        ]
    },

    'ZimReadError': {
        category: 'content',
        severity: 'error',
        title: 'Cannot Read Content Pack',
        message: 'There was an error reading the offline content pack. The file may be corrupted.',
        icon: 'archive',
        actions: [
            {
                id: 'reimportPack',
                label: 'Reimport Pack',
                primary: true,
                handler: async (context) => {
                    if (context?.packId) {
                        window.dispatchEvent(new CustomEvent('reimport-pack', { 
                            detail: { packId: context.packId } 
                        }));
                    }
                }
            },
            {
                id: 'deletePack',
                label: 'Remove Pack',
                primary: false,
                handler: async (context) => {
                    if (context?.packId) {
                        window.dispatchEvent(new CustomEvent('delete-pack', { 
                            detail: { packId: context.packId } 
                        }));
                    }
                }
            }
        ]
    },

    // Permission errors
    'PermissionDeniedError': {
        category: 'permission',
        severity: 'warning',
        title: 'Permission Required',
        message: 'This feature requires additional permissions to function properly.',
        icon: 'shield',
        actions: [
            {
                id: 'openSettings',
                label: 'Open Settings',
                primary: true,
                handler: async () => {
                    if (isNativeMobile()) {
                        // const { NativeSettings } = await import('@capacitor/native-settings');
                        // await NativeSettings.open({
                        //     optionAndroid: 'application-details',
                        //     optionIOS: 'app'
                        // });
                        console.warn('NativeSettings not available in this environment');
                    }
                }
            },
            {
                id: 'dismiss',
                label: 'Dismiss',
                primary: false,
                handler: async () => {
                    // Just close the error
                }
            }
        ]
    },

    // Battery/Performance errors
    'BatteryCriticalError': {
        category: 'performance',
        severity: 'warning',
        title: 'Low Battery',
        message: 'Battery is critically low. AI features have been disabled to preserve power.',
        icon: 'battery-warning',
        actions: [
            {
                id: 'enableSurvivalMode',
                label: 'Enable Survival Mode',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('enable-survival-mode'));
                }
            },
            {
                id: 'continueAnyway',
                label: 'Continue Anyway',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('override-battery-warning'));
                }
            }
        ]
    },

    'ThermalThrottlingError': {
        category: 'performance',
        severity: 'info',
        title: 'Device Warm',
        message: 'Your device is warm. Performance may be reduced to prevent overheating.',
        icon: 'thermometer',
        actions: [
            {
                id: 'coolDown',
                label: 'Pause AI Features',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('pause-ai'));
                }
            },
            {
                id: 'continue',
                label: 'Continue',
                primary: false,
                handler: async () => {
                    // Just acknowledge
                }
            }
        ]
    },

    // Default fallback
    'default': {
        category: 'unknown',
        severity: 'error',
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        icon: 'alert-circle',
        actions: [
            {
                id: 'retry',
                label: 'Try Again',
                primary: true,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('retry-last-action'));
                }
            },
            {
                id: 'report',
                label: 'Report Issue',
                primary: false,
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('report-error'));
                }
            }
        ]
    }
};

/**
 * Categorize and recover from errors
 */
export class ErrorRecovery {
    static instance = null;

    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 50;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    static getInstance() {
        if (!ErrorRecovery.instance) {
            ErrorRecovery.instance = new ErrorRecovery();
        }
        return ErrorRecovery.instance;
    }

    /**
     * Categorize an error and return recovery strategy
     */
    categorizeError(error) {
        const errorName = error.name || 'Error';
        const errorMessage = error.message || '';

        // Check for specific error types
        if (errorName === 'QuotaExceededError' || 
            errorMessage.includes('quota') || 
            errorMessage.includes('storage')) {
            return 'QuotaExceededError';
        }

        if (errorName === 'NetworkError' || 
            errorMessage.includes('network') || 
            errorMessage.includes('fetch') ||
            errorMessage.includes('offline')) {
            return 'NetworkError';
        }

        if (errorName === 'TimeoutError' || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('timed out')) {
            return 'TimeoutError';
        }

        if (errorMessage.includes('model') && 
            (errorMessage.includes('load') || errorMessage.includes('initialize'))) {
            return 'ModelLoadError';
        }

        if (errorMessage.includes('download') && 
            errorMessage.includes('model')) {
            return 'ModelDownloadError';
        }

        if (errorMessage.includes('permission') || 
            errorMessage.includes('denied')) {
            return 'PermissionDeniedError';
        }

        if (errorMessage.includes('battery') && 
            errorMessage.includes('low')) {
            return 'BatteryCriticalError';
        }

        if (errorMessage.includes('thermal') || 
            errorMessage.includes('throttle')) {
            return 'ThermalThrottlingError';
        }

        if (errorMessage.includes('zim') || 
            errorMessage.includes('content pack')) {
            return 'ZimReadError';
        }

        if (errorMessage.includes('not found') || 
            errorMessage.includes('404')) {
            return 'ContentNotFoundError';
        }

        return 'default';
    }

    /**
     * Get recovery strategy for an error
     */
    getRecoveryStrategy(error, context = {}) {
        const errorType = this.categorizeError(error);
        const strategy = ERROR_RECOVERY_STRATEGIES[errorType] || ERROR_RECOVERY_STRATEGIES.default;

        // Log the error
        this.logError(error, errorType, context);

        return {
            ...strategy,
            errorType,
            originalError: error,
            context
        };
    }

    /**
     * Attempt automatic recovery
     */
    async attemptRecovery(error, context = {}) {
        const strategy = this.getRecoveryStrategy(error, context);
        const errorKey = `${strategy.errorType}:${context?.operation || 'unknown'}`;

        // Check retry count
        const currentRetries = this.retryAttempts.get(errorKey) || 0;
        if (currentRetries >= this.maxRetries) {
            log.warn('Max retries exceeded', { errorType: strategy.errorType, context });
            return {
                success: false,
                strategy,
                reason: 'max_retries_exceeded'
            };
        }

        // Attempt recovery based on category
        try {
            let result = false;

            switch (strategy.category) {
                case 'network':
                    result = await this.handleNetworkRecovery(error, context);
                    break;
                case 'storage':
                    result = await this.handleStorageRecovery(error, context);
                    break;
                case 'ai':
                    result = await this.handleAIRecovery(error, context);
                    break;
                case 'content':
                    result = await this.handleContentRecovery(error, context);
                    break;
                default:
                    result = false;
            }

            if (result) {
                this.retryAttempts.delete(errorKey);
            } else {
                this.retryAttempts.set(errorKey, currentRetries + 1);
            }

            return {
                success: result,
                strategy,
                retries: currentRetries + 1
            };

        } catch (recoveryError) {
            log.error('Recovery failed', recoveryError);
            return {
                success: false,
                strategy,
                recoveryError
            };
        }
    }

    /**
     * Handle network-related recovery
     */
    async handleNetworkRecovery(error, context) {
        // Check if we're actually offline
        if (!navigator.onLine) {
            // Already offline, can't recover
            return false;
        }

        // Wait a bit and retry
        await this.delay(1000);
        return true;
    }

    /**
     * Handle storage-related recovery
     */
    async handleStorageRecovery(error, context) {
        // Try to clear some cache
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const name of cacheNames) {
                    if (name.includes('temp') || name.includes('cache')) {
                        await caches.delete(name);
                        log.info('Cleared cache', { name });
                    }
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Handle AI-related recovery
     */
    async handleAIRecovery(error, context) {
        // Unload current model to free memory
        try {
            const { AIModelManager } = await import('../services/ai/AIModelManager');
            await AIModelManager.unloadModel();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Handle content-related recovery
     */
    async handleContentRecovery(error, context) {
        // Try to reload content index
        try {
            const { ZimContentService } = await import('../services/grokopedia/ZimContentService');
            await ZimContentService.rebuildIndex();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Log error to history
     */
    logError(error, errorType, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            errorType,
            message: error.message,
            stack: error.stack,
            context
        };

        this.errorHistory.unshift(entry);
        
        // Trim history
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }

        log.error('Error logged', entry);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {};
        
        for (const entry of this.errorHistory) {
            stats[entry.errorType] = (stats[entry.errorType] || 0) + 1;
        }

        return {
            total: this.errorHistory.length,
            byType: stats,
            recent: this.errorHistory.slice(0, 10)
        };
    }

    /**
     * Clear error history
     */
    clearHistory() {
        this.errorHistory = [];
        this.retryAttempts.clear();
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Error boundary fallback component props generator
 */
export const getErrorFallbackProps = (error, errorInfo) => {
    const recovery = ErrorRecovery.getInstance();
    const strategy = recovery.getRecoveryStrategy(error);

    return {
        title: strategy.title,
        message: strategy.message,
        icon: strategy.icon,
        actions: strategy.actions,
        error,
        errorInfo,
        canRetry: strategy.actions.some(a => a.id === 'retry')
    };
};

/**
 * React hook for error recovery
 */
export const useErrorRecovery = () => {
    const recovery = ErrorRecovery.getInstance();

    const handleError = async (error, context = {}) => {
        const strategy = recovery.getRecoveryStrategy(error, context);
        
        // Try automatic recovery first
        const autoResult = await recovery.attemptRecovery(error, context);
        
        if (autoResult.success) {
            return {
                recovered: true,
                strategy,
                autoResult
            };
        }

        // Return strategy for UI handling
        return {
            recovered: false,
            strategy,
            autoResult
        };
    };

    const retry = async (error, context = {}) => {
        return recovery.attemptRecovery(error, context);
    };

    const getStats = () => {
        return recovery.getErrorStats();
    };

    return {
        handleError,
        retry,
        getStats,
        categorizeError: recovery.categorizeError.bind(recovery)
    };
};

export default ErrorRecovery;