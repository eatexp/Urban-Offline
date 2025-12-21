/**
 * AI Architecture for Urban-Offline
 * 
 * Design Goals:
 * 1. Run small LLMs completely offline using downloaded content
 * 2. Use RAG (Retrieval Augmented Generation) to provide accurate answers
 * 3. Cite sources from downloaded articles
 * 4. Graceful degradation when AI not available
 * 
 * Architecture Overview:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      User Query                              │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                   Intent Classifier                          │
 * │   - Route to: AI Chat, Triage Flow, or Direct Search        │
 * │   - Detect emergency keywords                                │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *           ┌──────────────────┼──────────────────┐
 *           ▼                  ▼                  ▼
 *    ┌────────────┐     ┌────────────┐     ┌────────────┐
 *    │   Triage   │     │  AI Chat   │     │   Search   │
 *    │   (Ink)    │     │   (RAG)    │     │  (Hybrid)  │
 *    └────────────┘     └────────────┘     └────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                   RAG Pipeline                               │
 * │   1. Query → Vector embedding (if available)                │
 * │   2. Retrieve relevant chunks from IndexedDB                │
 * │   3. Build context with retrieved documents                 │
 * │   4. Generate response with local LLM                       │
 * │   5. Format response with source citations                  │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                   Local LLM Engine                           │
 * │   - Web: WebLLM (browser-based WASM inference)              │
 * │   - Native: llama.cpp via Capacitor plugin                  │
 * │   - Fallback: Pattern matching + template responses         │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Supported Models (quantized for mobile/browser):
 * - Phi-3 Mini 4K (2.8B params, ~1.5GB) - Recommended
 * - TinyLlama 1.1B (~600MB) - Lightweight option
 * - Qwen2 0.5B (~300MB) - Ultra-lightweight
 * 
 * Storage Requirements:
 * - Model files stored in IndexedDB (Web) or Filesystem (Native)
 * - Separate from content to allow independent updates
 */

// Model Definitions
export const AI_MODELS = {
    'phi3-mini': {
        id: 'phi3-mini',
        name: 'Phi-3 Mini',
        description: 'Microsoft Phi-3 Mini - Best balance of quality and size',
        size: 1.5 * 1024 * 1024 * 1024, // 1.5 GB
        sizeDisplay: '1.5 GB',
        contextLength: 4096,
        quantization: 'q4_k_m',
        recommended: true,
        capabilities: ['medical', 'general', 'reasoning'],
        webLLMId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC'
    },
    'tinyllama': {
        id: 'tinyllama',
        name: 'TinyLlama',
        description: 'Lightweight model for low-memory devices',
        size: 600 * 1024 * 1024, // 600 MB
        sizeDisplay: '600 MB',
        contextLength: 2048,
        quantization: 'q4_k_m',
        recommended: false,
        capabilities: ['general'],
        webLLMId: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC'
    },
    'qwen2-0.5b': {
        id: 'qwen2-0.5b',
        name: 'Qwen2 Mini',
        description: 'Ultra-lightweight for older devices',
        size: 300 * 1024 * 1024, // 300 MB
        sizeDisplay: '300 MB',
        contextLength: 1024,
        quantization: 'q4_0',
        recommended: false,
        capabilities: ['general'],
        webLLMId: 'Qwen2-0.5B-Instruct-q4f16_1-MLC'
    }
};

// System Prompts
export const SYSTEM_PROMPTS = {
    medical: `You are an emergency medical assistant for Urban-Offline, an app designed to help people in emergency situations when they may not have internet access.

IMPORTANT GUIDELINES:
1. Always recommend calling emergency services (911/999/112) for serious medical emergencies
2. Provide clear, step-by-step first aid instructions
3. Use simple, non-medical language that anyone can understand
4. If unsure, say so - never guess about medical conditions
5. Always cite your sources from the provided context
6. Include relevant safety warnings

You have access to offline medical articles. Use them to provide accurate information.`,

    general: `You are a helpful assistant for Urban-Offline, an emergency preparedness app. 
You help users find information about first aid, survival skills, and legal rights.
Always cite your sources and recommend professional help when appropriate.`,

    survival: `You are a survival expert assistant for Urban-Offline.
Provide practical advice for emergency situations including shelter, water, and safety.
Always prioritize safety and recommend seeking professional help when available.`
};

// Response Templates for fallback mode
export const FALLBACK_TEMPLATES = {
    cpr: {
        keywords: ['cpr', 'resuscitation', 'heart stopped', 'not breathing'],
        response: `**CPR Quick Guide:**

1. **Check** - Is the person responsive? Tap shoulders and shout.
2. **Call** - Call 999/911 immediately or ask someone to call.
3. **Compress** - Place heel of hand on center of chest, push hard and fast (100-120/min).
4. **Continue** - Don't stop until help arrives or person recovers.

⚠️ This is basic guidance. Professional training is recommended.

[Source: Basic Life Support guidelines]`
    },
    choking: {
        keywords: ['choking', 'cannot breathe', 'something stuck'],
        response: `**Choking First Aid:**

For conscious adult:
1. Encourage coughing
2. Give 5 back blows between shoulder blades
3. Give 5 abdominal thrusts (Heimlich)
4. Alternate until object clears

⚠️ Call 999/911 if breathing doesn't improve.

[Source: First aid choking guidelines]`
    },
    bleeding: {
        keywords: ['bleeding', 'blood', 'cut', 'wound'],
        response: `**Severe Bleeding Control:**

1. **Apply pressure** - Use clean cloth, press firmly
2. **Elevate** - Raise injured area above heart if possible
3. **Don't remove** - If cloth soaks through, add more on top
4. **Tourniquet** - Only for life-threatening limb bleeding

⚠️ Call 999/911 for heavy bleeding.

[Source: Hemorrhage control guidelines]`
    }
};

/**
 * Configuration for AI features
 */
export const AI_CONFIG = {
    // Minimum device requirements
    requirements: {
        minRAM: 4 * 1024 * 1024 * 1024, // 4 GB
        minStorage: 2 * 1024 * 1024 * 1024, // 2 GB free
        webGPURequired: true // For WebLLM acceleration
    },
    
    // RAG settings
    rag: {
        maxContextChunks: 5,
        chunkSize: 500, // words
        minRelevanceScore: 0.3,
        includeMetadata: true
    },
    
    // Generation settings
    generation: {
        maxTokens: 512,
        temperature: 0.3, // Low for factual responses
        topP: 0.9,
        stopSequences: ['[End]', '[Source:', '\n\nUser:']
    }
};

/**
 * Check if AI features are available on this device
 */
export async function checkAICapability() {
    const capabilities = {
        webGPU: false,
        wasmSIMD: false,
        sufficientMemory: false,
        sufficientStorage: false,
        recommendedModel: null
    };

    // Check WebGPU support
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            capabilities.webGPU = !!adapter;
        } catch (_e) {
            capabilities.webGPU = false;
        }
    }

    // Check WASM SIMD support
    try {
        capabilities.wasmSIMD = WebAssembly.validate(new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
        ]));
    } catch (_e) {
        capabilities.wasmSIMD = false;
    }

    // Check memory (if available)
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
        const memoryGB = navigator.deviceMemory;
        capabilities.sufficientMemory = memoryGB >= 4;
    }

    // Check storage quota
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
        try {
            const estimate = await navigator.storage.estimate();
            const availableGB = (estimate.quota - estimate.usage) / (1024 * 1024 * 1024);
            capabilities.sufficientStorage = availableGB >= 2;
        } catch (_e) {
            capabilities.sufficientStorage = true; // Assume OK if can't check
        }
    }

    // Recommend a model based on capabilities
    if (capabilities.webGPU && capabilities.sufficientMemory) {
        capabilities.recommendedModel = AI_MODELS['phi3-mini'];
    } else if (capabilities.wasmSIMD) {
        capabilities.recommendedModel = AI_MODELS['tinyllama'];
    } else {
        capabilities.recommendedModel = AI_MODELS['qwen2-0.5b'];
    }

    return capabilities;
}

export default {
    AI_MODELS,
    SYSTEM_PROMPTS,
    FALLBACK_TEMPLATES,
    AI_CONFIG,
    checkAICapability
};


