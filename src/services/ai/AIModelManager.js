/**
 * AIModelManager - Download and manage local LLM models
 *
 * Handles:
 * - Downloading models with progress tracking via transformers.js
 * - Storing models in IndexedDB cache
 * - Loading models for inference
 * - Model version management
 */

import { db } from '../db';
import { checkAICapability } from './AIArchitecture';
import TransformersEngine, { TRANSFORMERS_MODELS } from './TransformersEngine';
import { PurchaseManager } from './PurchaseManager';
import { createLogger } from '../../utils/logger';

const log = createLogger('AIModelManager');

// Store for model metadata
const MODELS_STORE = 'ai_models';

/**
 * AI Model Manager Service
 */
export const AIModelManager = {
    // TransformersEngine singleton
    _engine: null,
    _downloadProgress: new Map(),
    _abortControllers: new Map(),
    _isInitialized: false,

    /**
     * Initialize the model manager
     */
    async init() {
        if (this._isInitialized) {
            return this._capabilities;
        }

        try {
            // Check device capabilities (includes Windows native detection)
            const capabilities = await checkAICapability();

            log.info('Device capabilities', {
                webGPU: capabilities.webGPU,
                wasmSIMD: capabilities.wasmSIMD,
                aiAvailable: capabilities.aiAvailable,
                isWindowsNative: capabilities.isWindowsNative,
                recommendedModel: capabilities.recommendedModel?.name
            });

            // P1 FIX: Skip TransformersEngine initialization on Windows native
            // AI is unavailable on Windows desktop app - transformers.js requires browser APIs
            if (!capabilities.aiAvailable && capabilities.isWindowsNative) {
                log.warn('AI Model Manager initialized in fallback mode: Windows native');
                this._capabilities = capabilities;
                this._isInitialized = true;
                return capabilities;
            }

            // Get the TransformersEngine singleton (only for non-Windows platforms)
            this._engine = TransformersEngine.getInstance();
            this._capabilities = capabilities;
            this._isInitialized = true;

            return capabilities;
        } catch (error) {
            log.error('Init failed', error);
            return null;
        }
    },

    /**
     * Get all available models with install status
     */
    async getAvailableModels() {
        const installed = await this.getInstalledModels();
        const installedMap = new Map(installed.map(m => [m.id, m]));

        // Use TRANSFORMERS_MODELS from TransformersEngine
        return Object.values(TRANSFORMERS_MODELS).map(model => {
            const installedModel = installedMap.get(model.id);
            return {
                ...model,
                isInstalled: !!installedModel,
                installedAt: installedModel?.installedAt,
                version: installedModel?.version
            };
        });
    },

    /**
     * Get installed models
     */
    async getInstalledModels() {
        try {
            const models = await db.getAll(MODELS_STORE);
            return models || [];
        } catch (_error) {
            return [];
        }
    },

    /**
     * Download a model using transformers.js
     * @param {string} modelId - Model ID to download
     * @param {Function} onProgress - Progress callback (progress, message)
     */
    async downloadModel(modelId, onProgress) {
        const model = TRANSFORMERS_MODELS[modelId];
        if (!model) {
            return { success: false, error: 'Model not found' };
        }

        // Tier check: pro models require purchase
        if (model.tier === 'pro') {
            const canAccess = await PurchaseManager.canAccessTier('pro');
            if (!canAccess) {
                log.info('Pro model download blocked - not unlocked', { modelId });
                return {
                    success: false,
                    error: 'This model requires Pro unlock. Upgrade for £10 to access all AI models.',
                    requiresPro: true
                };
            }
        }

        // P1 FIX: Block AI model downloads on Windows native platform
        // transformers.js requires browser APIs (IndexedDB, WebGPU) unavailable in Electron
        if (this._capabilities?.isWindowsNative || !this._capabilities?.aiAvailable) {
            log.warn('AI download blocked: Windows native platform');
            return { 
                success: false, 
                error: 'AI models are not available in the Windows desktop app. Please use the web version at urbanoffline.app for AI-powered assistance.',
                isWindowsNative: true 
            };
        }

        // Check if already installed
        const installed = await this.isModelInstalled(modelId);
        if (installed) {
            // Verify the model is actually cached
            const isCached = await TransformersEngine.isModelCached(modelId);
            if (isCached) {
                return { success: true, message: 'Already installed' };
            }
            // Cache was cleared, remove metadata and re-download
            await db.delete(MODELS_STORE, modelId);
        }

        // Ensure engine is initialized
        if (!this._engine) {
            this._engine = TransformersEngine.getInstance();
        }

        // Set up tracking
        this._downloadProgress.set(modelId, 0);

        try {
            if (onProgress) onProgress(0, 'Initializing download...');

            // Stall detection: timeout if no progress for 30 seconds
            let lastProgressTime = Date.now();
            let lastProgress = 0;
            const stallCheck = setInterval(() => {
                if (Date.now() - lastProgressTime > 30000) {
                    log.warn('Download stalled, aborting', { modelId });
                    if (this._engine) {
                        this._engine.abort();
                    }
                    clearInterval(stallCheck);
                }
            }, 5000);

            // Use TransformersEngine to initialize (download) the model
            await this._engine.initialize(modelId, (progress, message) => {
                // Update stall detection timer on any progress
                if (progress !== lastProgress) {
                    lastProgressTime = Date.now();
                    lastProgress = progress;
                }
                this._downloadProgress.set(modelId, progress);
                if (onProgress) onProgress(progress, message);
            });

            // Clear stall check on success
            clearInterval(stallCheck);

            // Save model metadata after successful download
            await db.put(MODELS_STORE, {
                id: model.id,
                name: model.name,
                hfId: model.hfId,
                size: model.size,
                sizeDisplay: model.sizeDisplay,
                contextLength: model.contextLength,
                task: model.task,
                installedAt: new Date().toISOString(),
                version: '1.0.0'
            });

            this._downloadProgress.delete(modelId);

            if (onProgress) onProgress(100, 'Complete!');

            log.info('Model downloaded successfully', { modelId });
            return { success: true };

        } catch (error) {
            this._downloadProgress.delete(modelId);

            if (error.name === 'AbortError' || error.message?.includes('abort')) {
                log.info('Download cancelled', { modelId });
                return { success: false, error: 'Download cancelled' };
            }

            log.error('Download failed', { modelId, error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Cancel an in-progress download
     */
    cancelDownload(modelId) {
        if (this._engine) {
            this._engine.abort();
        }
        this._downloadProgress.delete(modelId);
    },

    /**
     * Get download progress
     */
    getDownloadProgress(modelId) {
        return this._downloadProgress.get(modelId) ?? -1;
    },

    /**
     * Check if a model is installed (metadata exists)
     */
    async isModelInstalled(modelId) {
        try {
            const model = await db.get(MODELS_STORE, modelId);
            return !!model;
        } catch (_error) {
            return false;
        }
    },

    /**
     * Load a model for inference
     * @param {string} modelId - Model to load
     * @param {Function} onProgress - Loading progress callback
     */
    async loadModel(modelId, onProgress) {
        const model = TRANSFORMERS_MODELS[modelId];
        if (!model) {
            return { success: false, error: 'Model not found' };
        }

        // Ensure engine is initialized
        if (!this._engine) {
            this._engine = TransformersEngine.getInstance();
        }

        // Check if already loaded
        if (this._engine.isModelLoaded() && this._engine.currentModelId === modelId) {
            if (onProgress) onProgress(100, 'Model ready!');
            return { success: true, message: 'Already loaded' };
        }

        try {
            if (onProgress) onProgress(0, 'Loading model...');

            // Initialize the model (loads from cache if already downloaded)
            await this._engine.initialize(modelId, (progress, message) => {
                if (onProgress) onProgress(progress, message);
            });

            // Update metadata with last loaded time
            const metadata = await db.get(MODELS_STORE, modelId);
            if (metadata) {
                await db.put(MODELS_STORE, {
                    ...metadata,
                    lastLoadedAt: new Date().toISOString()
                });
            }

            if (onProgress) onProgress(100, 'Model ready!');

            log.info('Model loaded', { modelId });
            return { success: true };

        } catch (error) {
            log.error('Load failed', { modelId, error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Unload current model to free memory
     */
    async unloadModel() {
        if (this._engine) {
            await this._engine.unload();
        }
        log.info('Model unloaded');
    },

    /**
     * Delete a model and its cache
     */
    async deleteModel(modelId) {
        try {
            // Unload if currently loaded
            if (this._engine?.currentModelId === modelId) {
                await this.unloadModel();
            }

            // Delete from metadata storage
            await db.delete(MODELS_STORE, modelId);

            // Delete from transformers.js cache
            await TransformersEngine.deleteModelCache(modelId);

            log.info('Model deleted', { modelId });
            return { success: true };
        } catch (error) {
            log.error('Delete failed', { modelId, error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current loaded model ID
     */
    getCurrentModel() {
        return this._engine?.currentModelId || null;
    },

    /**
     * Check if a model is loaded and ready
     */
    isModelLoaded() {
        return this._engine?.isModelLoaded() || false;
    },

    /**
     * Get the TransformersEngine for direct inference
     */
    getEngine() {
        return this._engine;
    },

    /**
     * Generate text using the loaded model
     * @param {string} systemPrompt - System instructions
     * @param {string} userMessage - User's query
     * @param {Object} options - Generation options
     */
    async generate(systemPrompt, userMessage, options = {}) {
        if (!this._engine?.isModelLoaded()) {
            throw new Error('No model loaded. Call loadModel() first.');
        }

        return this._engine.chat(systemPrompt, userMessage, options);
    },

    /**
     * Get storage used by AI models
     */
    async getStorageUsage() {
        const installed = await this.getInstalledModels();
        const totalBytes = installed.reduce((sum, model) => sum + (model.size || 0), 0);
        return {
            bytes: totalBytes,
            display: this._formatSize(totalBytes),
            modelCount: installed.length
        };
    },

    /**
     * Get models filtered by tier
     * @param {string} tier - 'free', 'pro', or 'all'
     * @returns {Promise<Array>}
     */
    async getModelsByTier(tier = 'all') {
        const allModels = await this.getAvailableModels();
        if (tier === 'all') return allModels;
        return allModels.filter(m => m.tier === tier);
    },

    /**
     * Check if a specific model is accessible (tier-gated)
     * @param {string} modelId
     * @returns {Promise<boolean>}
     */
    async canAccessModel(modelId) {
        const model = TRANSFORMERS_MODELS[modelId];
        if (!model) return false;
        if (model.tier === 'free' || model.source === 'local') return true;
        return PurchaseManager.canAccessTier(model.tier);
    },

    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
};

export default AIModelManager;
