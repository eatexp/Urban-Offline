/**
 * TransformersEngine - Singleton wrapper for @xenova/transformers
 *
 * Handles:
 * - Model initialization with progress callbacks
 * - IndexedDB caching for offline use
 * - Text generation with configurable parameters
 * - Memory management and model unloading
 *
 * Usage:
 *   const engine = TransformersEngine.getInstance();
 *   await engine.initialize('Xenova/TinyLlama-1.1B-Chat-v1.0', onProgress);
 *   const response = await engine.generate(prompt, { maxTokens: 256 });
 */

import { pipeline, env } from '@xenova/transformers';
import { createLogger } from '../../utils/logger';

const log = createLogger('TransformersEngine');

// Configure transformers.js for offline-first operation
env.cacheDir = 'indexeddb://urban-offline-models';
env.allowLocalModels = false;
env.useBrowserCache = true;

// Model configurations with transformers.js compatible IDs
export const TRANSFORMERS_MODELS = {
    'tinyllama': {
        id: 'tinyllama',
        hfId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
        name: 'TinyLlama',
        description: 'Faster responses, good for mobile',
        size: 500 * 1024 * 1024, // ~500MB
        sizeDisplay: '500 MB',
        contextLength: 2048,
        task: 'text-generation',
        chatTemplate: 'tinyllama'
    },
    'phi3-mini': {
        id: 'phi3-mini',
        hfId: 'Xenova/Phi-3-mini-4k-instruct',
        name: 'Phi-3 Mini',
        description: 'Best reasoning, larger download',
        size: 800 * 1024 * 1024, // ~800MB
        sizeDisplay: '800 MB',
        contextLength: 4096,
        task: 'text-generation',
        chatTemplate: 'phi3'
    }
};

// Chat templates for different models
const CHAT_TEMPLATES = {
    tinyllama: {
        format: (systemPrompt, userMessage) => {
            return `<|system|>
${systemPrompt}</s>
<|user|>
${userMessage}</s>
<|assistant|>
`;
        }
    },
    phi3: {
        format: (systemPrompt, userMessage) => {
            return `<|system|>
${systemPrompt}<|end|>
<|user|>
${userMessage}<|end|>
<|assistant|>
`;
        }
    }
};

/**
 * TransformersEngine Singleton
 * Manages LLM lifecycle and inference
 */
class TransformersEngine {
    static instance = null;

    constructor() {
        this.generator = null;
        this.currentModelId = null;
        this.isInitializing = false;
        this.isReady = false;
        this.abortController = null;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TransformersEngine.instance) {
            TransformersEngine.instance = new TransformersEngine();
        }
        return TransformersEngine.instance;
    }

    /**
     * Initialize a model for text generation
     * @param {string} modelId - Model key from TRANSFORMERS_MODELS
     * @param {Function} onProgress - Progress callback (progress, status)
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(modelId, onProgress = () => {}) {
        const modelConfig = TRANSFORMERS_MODELS[modelId];

        if (!modelConfig) {
            log.error('Unknown model ID', { modelId });
            throw new Error(`Unknown model: ${modelId}`);
        }

        // Already loaded this model
        if (this.currentModelId === modelId && this.isReady) {
            log.info('Model already loaded', { modelId });
            onProgress(100, 'Model ready');
            return true;
        }

        // Prevent concurrent initialization
        if (this.isInitializing) {
            log.warn('Initialization already in progress');
            throw new Error('Model initialization already in progress');
        }

        this.isInitializing = true;
        this.isReady = false;
        this.abortController = new AbortController();

        try {
            log.info('Starting model initialization', {
                modelId,
                hfId: modelConfig.hfId
            });

            onProgress(0, 'Starting download...');

            // Create the text-generation pipeline
            this.generator = await pipeline(modelConfig.task, modelConfig.hfId, {
                progress_callback: (progressData) => {
                    this._handleProgress(progressData, onProgress);
                },
                quantized: true,
                // Use WebGPU if available, fall back to WASM
                device: await this._getBestDevice()
            });

            this.currentModelId = modelId;
            this.isReady = true;
            this.isInitializing = false;

            log.info('Model initialized successfully', { modelId });
            onProgress(100, 'Model ready');

            return true;

        } catch (error) {
            this.isInitializing = false;
            this.isReady = false;
            this.generator = null;
            this.currentModelId = null;

            if (error.name === 'AbortError') {
                log.info('Model initialization aborted');
                onProgress(0, 'Download cancelled');
            } else {
                log.error('Model initialization failed', error);
                onProgress(0, `Error: ${error.message}`);
            }

            throw error;
        }
    }

    /**
     * Handle progress updates from transformers.js
     */
    _handleProgress(progressData, onProgress) {
        if (!progressData) return;

        const { status, progress, file } = progressData;

        // Map transformers.js status to user-friendly messages
        const statusMessages = {
            'initiate': 'Preparing download...',
            'download': `Downloading ${file || 'model'}...`,
            'progress': `Downloading... ${Math.round(progress || 0)}%`,
            'done': 'Processing model...',
            'ready': 'Model ready'
        };

        const message = statusMessages[status] || status;
        const progressPercent = progress ? Math.round(progress) : 0;

        log.debug('Download progress', { status, progress: progressPercent, file });
        onProgress(progressPercent, message);
    }

    /**
     * Determine best compute device
     */
    async _getBestDevice() {
        // Check WebGPU support
        if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    log.info('Using WebGPU for inference');
                    return 'webgpu';
                }
            } catch (e) {
                log.debug('WebGPU not available', e);
            }
        }

        log.info('Using WASM for inference');
        return 'wasm';
    }

    /**
     * Generate text response
     * @param {string} prompt - Full prompt including system message
     * @param {Object} options - Generation options
     * @returns {Promise<string>} - Generated text
     */
    async generate(prompt, options = {}) {
        if (!this.isReady || !this.generator) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        const {
            maxTokens = 512,
            temperature = 0.3,
            topP = 0.9,
            doSample = true,
            stopSequences = []
        } = options;

        log.debug('Generating response', {
            promptLength: prompt.length,
            maxTokens,
            temperature
        });

        const startTime = Date.now();

        try {
            const output = await this.generator(prompt, {
                max_new_tokens: maxTokens,
                temperature: temperature,
                top_p: topP,
                do_sample: doSample,
                return_full_text: false
            });

            const generatedText = output[0]?.generated_text || '';

            // Apply stop sequences
            let finalText = generatedText;
            for (const stop of stopSequences) {
                const stopIndex = finalText.indexOf(stop);
                if (stopIndex !== -1) {
                    finalText = finalText.substring(0, stopIndex);
                }
            }

            const elapsed = Date.now() - startTime;
            log.info('Generation complete', {
                elapsed: `${elapsed}ms`,
                outputLength: finalText.length
            });

            return finalText.trim();

        } catch (error) {
            log.error('Generation failed', error);
            throw error;
        }
    }

    /**
     * Generate with chat formatting
     * @param {string} systemPrompt - System instructions
     * @param {string} userMessage - User's query
     * @param {Object} options - Generation options
     * @returns {Promise<string>} - Generated response
     */
    async chat(systemPrompt, userMessage, options = {}) {
        if (!this.currentModelId) {
            throw new Error('No model loaded');
        }

        const modelConfig = TRANSFORMERS_MODELS[this.currentModelId];
        const template = CHAT_TEMPLATES[modelConfig.chatTemplate];

        if (!template) {
            // Fallback to simple formatting
            const prompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
            return this.generate(prompt, options);
        }

        const formattedPrompt = template.format(systemPrompt, userMessage);
        return this.generate(formattedPrompt, options);
    }

    /**
     * Generate with streaming (yields tokens as they're generated)
     *
     * IMPORTANT LIMITATION: This method currently simulates streaming by:
     * 1. Generating the full response first
     * 2. Splitting into words and yielding them with small delays
     *
     * This is NOT true token-by-token streaming. True streaming would require
     * using the TextStreamer callback in transformers.js, but support varies
     * by model and may not work with all configurations.
     *
     * For true streaming UX, consider using this method's output to progressively
     * display text, but be aware the full generation happens upfront.
     *
     * @param {string} prompt - Full prompt
     * @param {Object} options - Generation options
     * @yields {string} - Word chunks (simulated streaming, not true token streaming)
     */
    async *generateStream(prompt, options = {}) {
        if (!this.isReady || !this.generator) {
            throw new Error('Model not initialized');
        }

        const {
            maxTokens = 512,
            temperature = 0.3,
            topP = 0.9
        } = options;

        log.debug('Starting generation (simulated streaming)');

        try {
            // Generate full response first - this is NOT true streaming
            const output = await this.generator(prompt, {
                max_new_tokens: maxTokens,
                temperature: temperature,
                top_p: topP,
                do_sample: true,
                return_full_text: false
            });

            const generatedText = output[0]?.generated_text || '';

            // Simulate streaming by yielding word chunks
            // NOTE: The full generation has already completed at this point
            const words = generatedText.split(' ');
            for (const word of words) {
                yield word + ' ';
                // Small delay for visual streaming effect (not real-time generation)
                await new Promise(resolve => setTimeout(resolve, 10));
            }

        } catch (error) {
            log.error('Generation failed', error);
            throw error;
        }
    }

    /**
     * Abort current initialization
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isInitializing = false;
    }

    /**
     * Unload current model to free memory
     */
    async unload() {
        log.info('Unloading model', { modelId: this.currentModelId });

        this.abort();
        this.generator = null;
        this.currentModelId = null;
        this.isReady = false;

        // Attempt garbage collection hint
        if (typeof globalThis.gc === 'function') {
            globalThis.gc();
        }
    }

    /**
     * Check if a model is currently loaded
     */
    isModelLoaded() {
        return this.isReady && this.generator !== null;
    }

    /**
     * Get current model info
     */
    getCurrentModel() {
        if (!this.currentModelId) return null;
        return TRANSFORMERS_MODELS[this.currentModelId];
    }

    /**
     * Get all available models
     */
    static getAvailableModels() {
        return Object.values(TRANSFORMERS_MODELS);
    }

    /**
     * Check if a model is cached in IndexedDB
     * @param {string} modelId - Model key
     * @returns {Promise<boolean>}
     */
    static async isModelCached(modelId) {
        const modelConfig = TRANSFORMERS_MODELS[modelId];
        if (!modelConfig) return false;

        try {
            // Check if model files exist in IndexedDB cache
            // transformers.js uses a specific cache structure
            const cacheKey = `transformers-cache-${modelConfig.hfId}`;

            // Open IndexedDB to check for cached model
            return new Promise((resolve) => {
                const request = indexedDB.open('transformers-cache', 1);

                request.onerror = () => resolve(false);

                request.onsuccess = (event) => {
                    const db = event.target.result;

                    if (!db.objectStoreNames.contains('models')) {
                        db.close();
                        resolve(false);
                        return;
                    }

                    const transaction = db.transaction(['models'], 'readonly');
                    const store = transaction.objectStore('models');
                    const getRequest = store.get(modelConfig.hfId);

                    getRequest.onsuccess = () => {
                        db.close();
                        resolve(!!getRequest.result);
                    };

                    getRequest.onerror = () => {
                        db.close();
                        resolve(false);
                    };
                };

                request.onupgradeneeded = (event) => {
                    // Database doesn't exist or needs upgrade - model not cached
                    event.target.transaction.abort();
                    resolve(false);
                };
            });
        } catch (error) {
            log.debug('Cache check failed', error);
            return false;
        }
    }

    /**
     * Delete a cached model
     * @param {string} modelId - Model key
     */
    static async deleteModelCache(modelId) {
        const modelConfig = TRANSFORMERS_MODELS[modelId];
        if (!modelConfig) return;

        log.info('Deleting model cache', { modelId });

        try {
            // Clear the transformers.js cache for this model
            // This is a simplified approach - full implementation would
            // need to handle the specific cache structure
            const caches = await window.caches?.keys();
            if (caches) {
                for (const cacheName of caches) {
                    if (cacheName.includes(modelConfig.hfId)) {
                        await window.caches.delete(cacheName);
                    }
                }
            }
        } catch (error) {
            log.error('Failed to delete cache', error);
        }
    }
}

export default TransformersEngine;
