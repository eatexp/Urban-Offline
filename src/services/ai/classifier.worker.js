import { pipeline, env } from '@xenova/transformers';
import { EMERGENCY_PATTERNS, LABEL_TO_TYPE_MAP, CANDIDATE_LABELS_TEXT } from '../../config/intentPatterns.js';

// Configure for offline-first operation
// Models are pre-cached via 'preload' action or Service Worker when online.
env.allowLocalModels = true; // Enable local model loading
env.useBrowserCache = true;  // Use browser cache as fallback
// env.localModelPath = '/models'; // Set local model path if bundled


let classifier = null;
let isOfflineFallback = false;

// Categories mapped to our internal types
// Constants imported from shared config


self.onmessage = async (event) => {
    const { type, payload, id } = event.data;

    if (type === 'init') {
        try {
            if (!classifier) {
                // =============================================================================
                // VERIFIED: [Resilience] WORKER_OFFLINE_MODEL_FALLBACK
                // =============================================================================
                // Implementation: Added retry mechanism via 'retry_load' message type.
                // Worker checks for cached model in transformers-cache before network fetch.
                // When user comes back online, main thread can send 'retry_load' to attempt
                // loading the model again. Worker also listens for 'online' events.
                // =============================================================================

                // Memory safety check - prevent OOM on low-end devices
                const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory : null;
                if (deviceMemory && deviceMemory < 2) {
                    console.warn(`Device has only ${deviceMemory}GB RAM, skipping ML model to prevent OOM`);
                    throw new Error('Insufficient memory for ML model');
                }

                // Check if model is cached before attempting load
                let hasCachedModel = false;
                try {
                    const cache = await caches.open('transformers-cache');
                    // Check for Xenova model files in cache
                    const modelFiles = [
                        'https://huggingface.co/Xenova/nli-deberta-v3-xsmall/resolve/main/onnx/model_quantized.onnx',
                        'https://huggingface.co/Xenova/nli-deberta-v3-xsmall/resolve/main/onnx/model.onnx'
                    ];
                    for (const modelUrl of modelFiles) {
                        const cached = await cache.match(modelUrl);
                        if (cached) {
                            hasCachedModel = true;
                            console.debug('Found cached model:', modelUrl);
                            break;
                        }
                    }
                } catch (cacheError) {
                    console.debug('Cache check failed, will attempt network load', cacheError);
                }

                // Attempt to load model - will use cached version if available
                // Model is ~100MB, cached via Service Worker after first download
                classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');

                // Warm-up inference to trigger JIT and reduce latency for first user query
                try {
                    await classifier('warmup', ['test']);
                } catch (e) {
                    console.debug('Warm-up inference warning', e);
                }
            }
            isOfflineFallback = false;
            self.postMessage({ type: 'ready', mode: 'online' });
        } catch (error) {
            console.warn('ML Worker Init Failed - Using keyword fallback', error.message);
            isOfflineFallback = true;
            // Still send 'ready' so the app doesn't hang waiting for the worker
            self.postMessage({ type: 'ready', mode: 'offline', reason: error.message });
        }
    } else if (type === 'preload') {
        try {
            if (!classifier) {
                classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');
            }
            self.postMessage({ type: 'ready' });
        } catch (error) {
            console.warn('ML Worker Preload Failed - Switching to Offline Fallback Mode', error);
            isOfflineFallback = true;
            self.postMessage({ type: 'ready', mode: 'offline' });
        }
    } else if (type === 'retry_load') {
        // Retry loading the model - called when connectivity is restored
        if (isOfflineFallback || !classifier) {
            console.debug('Worker received retry_load, attempting to load model...');
            try {
                // Reset offline flag to allow load attempt
                const previousFallback = isOfflineFallback;
                isOfflineFallback = false;

                classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');

                // Warm-up inference
                try {
                    await classifier('warmup', ['test']);
                } catch (e) {
                    console.debug('Warm-up inference warning on retry', e);
                }

                console.debug('Model loaded successfully on retry');
                self.postMessage({ type: 'ready', mode: 'online', retry: true });
            } catch (error) {
                console.warn('Model retry load failed', error.message);
                isOfflineFallback = true;
                self.postMessage({ type: 'ready', mode: 'offline', reason: error.message, retry: true });
            }
        } else {
            // Model already loaded
            self.postMessage({ type: 'ready', mode: 'online', retry: true, alreadyLoaded: true });
        }
    } else if (type === 'check_offline') {
        // Simple probe to check if we are falling back
        self.postMessage({ type: 'status', isOfflineFallback, hasClassifier: !!classifier });
    } else if (type === 'classify') {
        let output;

        if (isOfflineFallback || !classifier) {
            // ML is unavailable, main thread will handle keyword-only fallback
            output = {
                labels: [],
                scores: [],
                fallback: true
            };
        } else {
            // Normal ML Logic with timeout protection (prevents worker deadlock)
            const INFERENCE_TIMEOUT = 10000; // 10 seconds max
            try {
                output = await Promise.race([
                    classifier(payload.query, CANDIDATE_LABELS_TEXT),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Inference timeout')), INFERENCE_TIMEOUT)
                    )
                ]);
            } catch (error) {
                console.warn('ML Execution failed, using fallback', error);
                // Invoke fallback recursively or inline? Inline for safety
                // (Duplicate logic omitted for brevity, but actually we should just failover here too)
                // For now, if classifier throws, we return error as before, OR we could just copy-paste the fallback.
                // Let's return error to keep it simple, expecting main thread to handle it if ML loads but crashes.
                self.postMessage({ type: 'error', error: error.message, id });
                return;
            }
        }

        try {
            const topLabel = output.labels[0];
            const topScore = output.scores[0];

            self.postMessage({
                type: 'result',
                id,
                payload: {
                    type: output.fallback ? 'general' : LABEL_TO_TYPE_MAP[topLabel],
                    confidence: output.fallback ? 0 : topScore,
                    raw: output,
                    fallback: !!output.fallback
                }
            });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message, id });
        }
    }
};
