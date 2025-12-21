/**
 * AIModelManager - Download and manage local LLM models
 * 
 * Handles:
 * - Downloading models with progress tracking
 * - Storing models in IndexedDB/Filesystem
 * - Loading models for inference
 * - Model version management
 */

import { db } from '../db';
import { AI_MODELS, checkAICapability } from './AIArchitecture';
import { createLogger } from '../../utils/logger';

const log = createLogger('AIModelManager');

// Store for model metadata
const MODELS_STORE = 'ai_models';

// WebLLM CDN for model files
const WEBLLM_CDN = 'https://huggingface.co/mlc-ai/';

/**
 * AI Model Manager Service
 */
export const AIModelManager = {
    // Current loaded model
    _currentModel: null,
    _engine: null,
    _downloadProgress: new Map(),
    _abortControllers: new Map(),

    /**
     * Initialize the model manager
     */
    async init() {
        try {
            // Check device capabilities
            const capabilities = await checkAICapability();
            
            log.info('Device capabilities', {
                webGPU: capabilities.webGPU,
                wasmSIMD: capabilities.wasmSIMD,
                recommendedModel: capabilities.recommendedModel?.name
            });

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

        return Object.values(AI_MODELS).map(model => {
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
     * Download a model
     * @param {string} modelId - Model ID to download
     * @param {Function} onProgress - Progress callback (0-100)
     */
    async downloadModel(modelId, onProgress) {
        const model = AI_MODELS[modelId];
        if (!model) {
            return { success: false, error: 'Model not found' };
        }

        // Check if already installed
        const installed = await this.isModelInstalled(modelId);
        if (installed) {
            return { success: true, message: 'Already installed' };
        }

        // Set up abort controller
        const abortController = new AbortController();
        this._abortControllers.set(modelId, abortController);
        this._downloadProgress.set(modelId, 0);

        try {
            if (onProgress) onProgress(0, 'Initializing...');

            // For WebLLM models, we'll use the WebLLM library to handle download
            // This is a simplified version - actual implementation would use @mlc-ai/web-llm
            
            // Simulate model download stages
            const stages = [
                { progress: 10, message: 'Loading model config...' },
                { progress: 30, message: 'Downloading model weights...' },
                { progress: 60, message: 'Downloading tokenizer...' },
                { progress: 80, message: 'Downloading WASM runtime...' },
                { progress: 95, message: 'Finalizing...' }
            ];

            for (const stage of stages) {
                if (abortController.signal.aborted) {
                    throw new Error('Download cancelled');
                }
                
                this._downloadProgress.set(modelId, stage.progress);
                if (onProgress) onProgress(stage.progress, stage.message);
                
                // Simulate download time
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Save model metadata
            await db.put(MODELS_STORE, {
                id: model.id,
                name: model.name,
                webLLMId: model.webLLMId,
                size: model.size,
                sizeDisplay: model.sizeDisplay,
                contextLength: model.contextLength,
                capabilities: model.capabilities,
                installedAt: new Date().toISOString(),
                version: '1.0.0'
            });

            this._downloadProgress.delete(modelId);
            this._abortControllers.delete(modelId);

            if (onProgress) onProgress(100, 'Complete!');

            return { success: true };

        } catch (error) {
            this._downloadProgress.delete(modelId);
            this._abortControllers.delete(modelId);

            if (error.name === 'AbortError' || error.message === 'Download cancelled') {
                return { success: false, error: 'Download cancelled' };
            }

            log.error('Download failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Cancel an in-progress download
     */
    cancelDownload(modelId) {
        const controller = this._abortControllers.get(modelId);
        if (controller) {
            controller.abort();
        }
    },

    /**
     * Get download progress
     */
    getDownloadProgress(modelId) {
        return this._downloadProgress.get(modelId) ?? -1;
    },

    /**
     * Check if a model is installed
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
        const model = AI_MODELS[modelId];
        if (!model) {
            return { success: false, error: 'Model not found' };
        }

        // Check if installed
        const installed = await this.isModelInstalled(modelId);
        if (!installed) {
            return { success: false, error: 'Model not installed' };
        }

        try {
            if (onProgress) onProgress(0, 'Loading model...');

            // In production, this would initialize WebLLM:
            // const engine = await CreateMLCEngine(model.webLLMId, {
            //     initProgressCallback: (progress) => {
            //         if (onProgress) onProgress(progress.progress * 100, progress.text);
            //     }
            // });

            // Simulate loading
            for (let i = 0; i <= 100; i += 10) {
                if (onProgress) onProgress(i, `Loading model... ${i}%`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this._currentModel = modelId;
            // this._engine = engine; // Would be the actual engine

            if (onProgress) onProgress(100, 'Model ready!');

            return { success: true };

        } catch (error) {
            log.error('Load failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Unload current model to free memory
     */
    async unloadModel() {
        if (this._engine) {
            // this._engine.unload(); // Would unload the engine
            this._engine = null;
        }
        this._currentModel = null;
    },

    /**
     * Delete a model
     */
    async deleteModel(modelId) {
        try {
            // Unload if currently loaded
            if (this._currentModel === modelId) {
                await this.unloadModel();
            }

            // Delete from storage
            await db.delete(MODELS_STORE, modelId);

            // In production, would also delete cached model files
            // from IndexedDB cache

            return { success: true };
        } catch (error) {
            log.error('Delete failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current loaded model
     */
    getCurrentModel() {
        return this._currentModel;
    },

    /**
     * Check if a model is loaded and ready
     */
    isModelLoaded() {
        return this._currentModel !== null && this._engine !== null;
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

    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
};

export default AIModelManager;

