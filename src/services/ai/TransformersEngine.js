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
import { isWindowsNative } from '../../utils/platform';
import ContextManager from '../context/ContextManager';
import TactileSignatureEngine from '../haptics/TactileSignatureEngine.js';

const log = createLogger('TransformersEngine');

// Configure transformers.js for offline-first operation
// P1 FIX: Avoid configuring env on Windows Native where it might crash or is unsupported
if (!isWindowsNative()) {
    try {
        env.cacheDir = 'indexeddb://urban-offline-models';
        env.allowLocalModels = false;
        env.useBrowserCache = true;
    } catch (e) {
        log.warn('Failed to configure transformers env', e);
    }
}

// Model configurations with transformers.js compatible IDs
// Extended with rich metadata for Locally AI-style model picker
// NOTE: Checksums should be updated when models are updated
export const TRANSFORMERS_MODELS = {
    'smollm-360m': {
        id: 'smollm-360m',
        hfId: 'HuggingFaceTB/SmolLM-360M-Instruct',
        name: 'SmolLM 360M',
        description: 'Ultra-fast, perfect for quick emergency queries',
        size: 200 * 1024 * 1024, // ~200MB
        sizeDisplay: '200 MB',
        contextLength: 2048,
        task: 'text-generation',
        chatTemplate: 'smollm',
        qualityRating: 2,
        speedRating: 5,
        category: 'lightweight',
        useCases: ['Quick lookups', 'Basic first aid', 'Simple questions'],
        recommended: false,
        tier: 'free',
        legacy: false,
        // SHA-256 checksum for model.onnx from HuggingFace LFS
        checksum: '454394e1f92c1479bf71926b2cc845a3e29040c0844ba0d97ce693a390bca40c',
        checksumSource: 'huggingface',
        modelUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM-360M-Instruct/resolve/main/onnx/model.onnx'
    },
    'qwen-0.5b': {
        id: 'qwen-0.5b',
        hfId: 'Xenova/Qwen1.5-0.5B-Chat',
        name: 'Qwen 0.5B',
        description: 'Fast and capable, great balance for mobile',
        size: 350 * 1024 * 1024, // ~350MB
        sizeDisplay: '350 MB',
        contextLength: 2048,
        task: 'text-generation',
        chatTemplate: 'qwen',
        qualityRating: 3,
        speedRating: 4,
        category: 'lightweight',
        useCases: ['Emergency guidance', 'Medical info', 'Survival tips'],
        recommended: false,
        tier: 'free',
        legacy: false,
        // SHA-256 checksum for model.onnx from HuggingFace LFS
        checksum: '3d63556db976ef2983174f01cc496aa8d90715a81e6c9f130c2965d473984979',
        checksumSource: 'huggingface',
        modelUrl: 'https://huggingface.co/Xenova/Qwen1.5-0.5B-Chat/resolve/main/onnx/model.onnx'
    },
    'tinyllama': {
        id: 'tinyllama',
        hfId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
        name: 'TinyLlama 1.1B',
        description: 'Balanced speed and quality, recommended for most users',
        size: 500 * 1024 * 1024, // ~500MB
        sizeDisplay: '500 MB',
        contextLength: 2048,
        task: 'text-generation',
        chatTemplate: 'tinyllama',
        qualityRating: 3,
        speedRating: 4,
        category: 'balanced',
        useCases: ['General assistance', 'Medical triage', 'Survival guidance'],
        recommended: true,
        tier: 'pro',
        legacy: false,
        // SHA-256 checksum for model.onnx from HuggingFace LFS
        checksum: '8de9e56185700b13c893ce0a7343055cf8e89b4731b5235c28343bd15524ea23',
        checksumSource: 'huggingface',
        modelUrl: 'https://huggingface.co/Xenova/TinyLlama-1.1B-Chat-v1.0/resolve/main/onnx/model.onnx'
    },
    'phi3-mini': {
        id: 'phi3-mini',
        hfId: 'Xenova/Phi-3-mini-4k-instruct',
        name: 'Phi-3 Mini',
        description: 'Best reasoning ability, ideal for complex scenarios',
        size: 800 * 1024 * 1024, // ~800MB
        sizeDisplay: '800 MB',
        contextLength: 4096,
        task: 'text-generation',
        chatTemplate: 'phi3',
        qualityRating: 4,
        speedRating: 3,
        category: 'quality',
        useCases: ['Complex medical questions', 'Legal rights', 'Detailed analysis'],
        recommended: false,
        tier: 'pro',
        legacy: false,
        // SHA-256 checksum for model_q4.onnx from HuggingFace LFS (quantized version)
        checksum: '16b8e5d28a757c37bbfa7d9420fd094c0c20e3615ca3c203b5b9501015045c8f',
        checksumSource: 'huggingface',
        modelUrl: 'https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/onnx/model_q4.onnx'
    },
    'smollm-1.7b': {
        id: 'smollm-1.7b',
        hfId: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
        name: 'SmolLM 1.7B',
        description: 'High quality responses, best for detailed guidance',
        size: 1200 * 1024 * 1024, // ~1.2GB
        sizeDisplay: '1.2 GB',
        contextLength: 4096,
        task: 'text-generation',
        chatTemplate: 'smollm',
        qualityRating: 4,
        speedRating: 2,
        category: 'quality',
        useCases: ['In-depth medical advice', 'Emergency protocols', 'Comprehensive guidance'],
        recommended: false,
        tier: 'pro',
        legacy: false,
        // SHA-256 checksum for model.onnx from HuggingFace LFS
        checksum: 'c538daa78f811830dc9028aa228a63a218147ab478c0c65ef6e2d8cab532380a',
        checksumSource: 'huggingface',
        modelUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct/resolve/main/onnx/model.onnx'
    }
};

// Chat templates for different models
const CHAT_TEMPLATES = {
    smollm: {
        format: (systemPrompt, userMessage) => {
            // Inject Tool Use Instructions into System Prompt
            const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
            return `<|im_start|>system
${systemPrompt}
${toolInstructions}<|im_end|>
<|im_start|>user
${userMessage}<|im_end|>
<|im_start|>assistant
`;
        }
    },
    qwen: {
        format: (systemPrompt, userMessage) => {
            const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
            return `<|im_start|>system
${systemPrompt}
${toolInstructions}<|im_end|>
<|im_start|>user
${userMessage}<|im_end|>
<|im_start|>assistant
`;
        }
    },
    tinyllama: {
        format: (systemPrompt, userMessage) => {
            const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
            return `<|system|>
${systemPrompt}
${toolInstructions}</s>
<|user|>
${userMessage}</s>
<|assistant|>
`;
        }
    },
    phi3: {
        format: (systemPrompt, userMessage) => {
            const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
            return `<|system|>
${systemPrompt}
${toolInstructions}<|end|>
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
        this._isSwitching = false;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TransformersEngine.instance) {
            if (isWindowsNative()) {
                log.warn('TransformersEngine instantiated on Windows Native - AI features disabled');
            }
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
    async initialize(modelId, onProgress = () => { }) {
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
     * Switch to a different model
     * @param {string} modelId - Target model ID from TRANSFORMERS_MODELS
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<boolean>}
     */
    async switchModel(modelId, onProgress = () => {}) {
        // Guard: Prevent concurrent switches
        if (this._isSwitching) {
            log.warn('Model switch already in progress, ignoring request');
            throw new Error('Model switch already in progress');
        }

        // Guard: Check if already on this model
        if (this.currentModelId === modelId && this.isReady) {
            log.info('Already using requested model', { modelId });
            onProgress(100, 'Model ready');
            return true;
        }

        this._isSwitching = true;

        try {
            // Unload current model
            if (this.generator) {
                log.info('Unloading current model before switch', { from: this.currentModelId, to: modelId });
                await this.unload();
            }

            // Initialize new model
            const success = await this.initialize(modelId, onProgress);
            
            return success;
        } finally {
            this._isSwitching = false;
        }
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
            // Start thinking loop
            TactileSignatureEngine.getInstance().startLoop('ai:thinking');

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

            // Stop thinking loop, play completion signature
            TactileSignatureEngine.getInstance().stopLoop('ai:thinking');
            TactileSignatureEngine.getInstance().fire('ai:complete');

            return finalText.trim();

        } catch (error) {
            // Ensure loop stops on error
            TactileSignatureEngine.getInstance().stopLoop('ai:thinking');
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

        // --- CONTEXT INJECTION (The HUD) ---
        // Get the live system state (Map coords, Battery, etc.)
        const contextBlock = ContextManager.getInstance().getSystemContext();

        // Prepend context to system prompt
        // We add it just before the tool instructions or main system prompt
        const contextualizedSystemPrompt = `${systemPrompt}\n\n${contextBlock}`;

        const formattedPrompt = template.format(contextualizedSystemPrompt, userMessage);
        return this.generate(formattedPrompt, options);
    }

    /**
     * Generate with true token-level streaming
     *
     * This method provides real-time token streaming using transformers.js's
     * TextStreamer callback mechanism. Tokens are yielded as they're generated
     * by the model, providing immediate visual feedback to users.
     *
     * @param {string} prompt - Full prompt
     * @param {Object} options - Generation options
     * @param {Function} options.onToken - Optional callback for each token (for UI updates)
     * @yields {string} - Individual tokens as they're generated
     */
    async *generateStream(prompt, options = {}) {
        if (!this.isReady || !this.generator) {
            throw new Error('Model not initialized');
        }

        const {
            maxTokens = 512,
            temperature = 0.3,
            topP = 0.9,
            doSample = true,
            stopSequences = [],
            onToken = null
        } = options;

        log.debug('Starting true token-level streaming generation', {
            promptLength: prompt.length,
            maxTokens,
            temperature
        });

        // Create a queue to bridge callback-based streaming with async generator
        const tokenQueue = [];
        let isComplete = false;
        let hasError = null;

        // Custom streamer that receives tokens from transformers.js
        const streamer = {
            put: (token) => {
                // Clean up the token (remove special tokens)
                const cleanToken = this._cleanToken(token);
                if (cleanToken) {
                    tokenQueue.push(cleanToken);
                    // Call optional onToken callback for immediate UI updates
                    if (onToken) {
                        try {
                            onToken(cleanToken);
                        } catch (e) {
                            log.warn('onToken callback error', e);
                        }
                    }
                }
            },
            end: () => {
                isComplete = true;
            }
        };

        // Start generation in the background
        const generationPromise = this.generator(prompt, {
            max_new_tokens: maxTokens,
            temperature: temperature,
            top_p: topP,
            do_sample: doSample,
            return_full_text: false,
            streamer: streamer
        }).then(output => {
            // Handle stop sequences on complete text
            let finalText = output[0]?.generated_text || '';
            for (const stop of stopSequences) {
                const stopIndex = finalText.indexOf(stop);
                if (stopIndex !== -1) {
                    finalText = finalText.substring(0, stopIndex);
                }
            }
            return finalText;
        }).catch(error => {
            hasError = error;
            throw error;
        });

        // Start thinking loop
        TactileSignatureEngine.getInstance().startLoop('ai:thinking');

        try {
            // Yield tokens as they arrive
            while (!isComplete || tokenQueue.length > 0) {
                // Check for errors
                if (hasError) {
                    throw hasError;
                }

                // Yield available tokens
                while (tokenQueue.length > 0) {
                    const token = tokenQueue.shift();
                    yield token;
                }

                // If not complete, wait a bit for more tokens
                if (!isComplete) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }

            // Ensure generation promise completes (for error handling)
            await generationPromise;

        } catch (error) {
            log.error('Streaming generation failed', error);
            throw error;
        } finally {
            // Always stop thinking loop
            TactileSignatureEngine.getInstance().stopLoop('ai:thinking');
            TactileSignatureEngine.getInstance().fire('ai:complete');
        }
    }

    /**
     * Clean up special tokens from model output
     * @private
     */
    _cleanToken(token) {
        if (!token || typeof token !== 'string') return '';

        // List of common special tokens to filter
        const specialTokens = [
            '<|endoftext|>',
            '<|im_end|>',
            '</s>',
            '<|end|>',
            '<|assistant|>',
            '<|user|>',
            '<|system|>'
        ];

        let cleaned = token;

        // Remove special tokens
        for (const special of specialTokens) {
            cleaned = cleaned.replaceAll(special, '');
        }

        return cleaned;
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
            const _cacheKey = `transformers-cache-${modelConfig.hfId}`;

            // Open IndexedDB to check for cached model
            return new Promise((resolve) => {
                const request = indexedDB.open('transformers-cache', 1);

                request.onerror = () => { /* Ignore DB access errors */ resolve(false); };

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
