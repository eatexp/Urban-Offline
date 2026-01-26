import { pipeline, env } from '@xenova/transformers';

// Configure for offline-first operation
// TODO: Critical - For true offline operation, models must be bundled with the app
// Current setup relies on browser cache and CDN, which violates offline-first principle
// Consider bundling models or implementing service worker pre-caching
env.allowLocalModels = true; // Enable local model loading
env.useBrowserCache = true;  // Use browser cache as fallback
env.localModelPath = '/models'; // Set local model path if bundled

let classifier = null;

// Categories mapped to our internal types
const CANDIDATE_LABELS = [
    'immediate medical emergency', // medical_critical
    'severe injury',               // medical_severe
    'medical question',            // medical_query
    'immediate danger',            // survival_critical
    'survival preparation',        // survival_prep
    'legal emergency',             // legal_immediate
    'legal question'               // legal_query
];

const LABEL_TO_TYPE = {
    'immediate medical emergency': 'medical_critical',
    'severe injury': 'medical_severe',
    'medical question': 'medical_query',
    'immediate danger': 'survival_critical',
    'survival preparation': 'survival_prep',
    'legal emergency': 'legal_immediate',
    'legal question': 'legal_query'
};

self.onmessage = async (event) => {
    const { type, payload, id } = event.data;

    if (type === 'init') {
        try {
            if (!classifier) {
                // Using a small, fast model suitable for mobile
                classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');
            }
            self.postMessage({ type: 'ready' });
        } catch (error) {
            console.error('ML Worker Init Error:', error);
            self.postMessage({ type: 'error', error: error.message, id });
        }
    } else if (type === 'classify') {
        if (!classifier) {
            self.postMessage({ type: 'error', error: 'Classifier not initialized', id });
            return;
        }

        try {
            const output = await classifier(payload.query, CANDIDATE_LABELS);

            // output format: { sequence: '...', labels: [...], scores: [...] }
            const topLabel = output.labels[0];
            const topScore = output.scores[0];

            self.postMessage({
                type: 'result',
                id, // Echo back the request ID for proper response matching
                payload: {
                    type: LABEL_TO_TYPE[topLabel],
                    confidence: topScore,
                    raw: output
                }
            });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message, id });
        }
    }
};
