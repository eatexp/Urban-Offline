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

import { createLogger } from '../../utils/logger';

const log = createLogger('AIArchitecture');

// Model Definitions - Using transformers.js compatible models
// See TransformersEngine.js for the actual model configurations
// Tier system: 'free' models available to all, 'pro' unlocked with one-time purchase
export const AI_MODELS = {
    'smollm-360m': {
        id: 'smollm-360m',
        name: 'SmolLM 360M',
        description: 'Ultra-fast, perfect for quick emergency queries',
        size: 200 * 1024 * 1024,
        sizeDisplay: '200 MB',
        contextLength: 2048,
        quantization: 'q4',
        recommended: false,
        capabilities: ['general'],
        hfId: 'HuggingFaceTB/SmolLM-360M-Instruct',
        tier: 'free',
        legacy: false
    },
    'qwen-0.5b': {
        id: 'qwen-0.5b',
        name: 'Qwen 0.5B',
        description: 'Fast and capable, great balance for mobile',
        size: 350 * 1024 * 1024,
        sizeDisplay: '350 MB',
        contextLength: 2048,
        quantization: 'q4',
        recommended: false,
        capabilities: ['general', 'medical'],
        hfId: 'Xenova/Qwen1.5-0.5B-Chat',
        tier: 'free',
        legacy: false
    },
    'tinyllama': {
        id: 'tinyllama',
        name: 'TinyLlama 1.1B',
        description: 'Balanced speed and quality, recommended for most users',
        size: 500 * 1024 * 1024,
        sizeDisplay: '500 MB',
        contextLength: 2048,
        quantization: 'q4',
        recommended: true,
        capabilities: ['general', 'medical'],
        hfId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
        tier: 'pro',
        legacy: false
    },
    'phi3-mini': {
        id: 'phi3-mini',
        name: 'Phi-3 Mini',
        description: 'Best reasoning ability, ideal for complex scenarios',
        size: 800 * 1024 * 1024,
        sizeDisplay: '800 MB',
        contextLength: 4096,
        quantization: 'q4',
        recommended: false,
        capabilities: ['medical', 'general', 'reasoning'],
        hfId: 'Xenova/Phi-3-mini-4k-instruct',
        tier: 'pro',
        legacy: false
    },
    'smollm-1.7b': {
        id: 'smollm-1.7b',
        name: 'SmolLM 1.7B',
        description: 'High quality responses, best for detailed guidance',
        size: 1200 * 1024 * 1024,
        sizeDisplay: '1.2 GB',
        contextLength: 4096,
        quantization: 'q4',
        recommended: false,
        capabilities: ['medical', 'general', 'reasoning'],
        hfId: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
        tier: 'pro',
        legacy: false
    }
};

// Legacy models - retired versions that still work if installed but are deprioritized
// When new models are added, old ones move here via legacy rotation
export const LEGACY_MODELS = [
    // Empty for now - models will be moved here as newer versions replace them
    // Example:
    // { id: 'tinyllama-v0', name: 'TinyLlama 1.0 (Legacy)', hfId: '...', tier: 'free', legacy: true }
];

// Embedding model for semantic search (auto-downloads)
export const EMBEDDING_MODEL = {
    id: 'all-minilm',
    name: 'MiniLM Embeddings',
    description: 'Semantic search embeddings',
    size: 23 * 1024 * 1024, // ~23 MB
    sizeDisplay: '23 MB',
    hfId: 'Xenova/all-MiniLM-L6-v2'
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

    survival: `You are an offline survival and emergency preparedness assistant for Urban-Offline. Your role is to provide practical guidance for emergency situations when normal services may be unavailable or delayed.

CORE PRINCIPLES:
1. **Safety first** - Always prioritize personal safety and de-escalation
2. **Practical guidance** - Provide actionable, step-by-step instructions
3. **Emergency context** - Recognize that users may have limited resources or connectivity
4. **Responsible advice** - Balance practicality with appropriate safety warnings

PRIMARY SCENARIOS:
- Natural disasters (floods, storms, extreme weather)
- Infrastructure disruptions (power outages, water supply issues)
- Wilderness emergencies (getting lost, exposure, basic survival)
- Urban emergencies (building evacuation, finding shelter)

GUIDANCE APPROACH:
- Provide clear, actionable survival information
- Include safety warnings where appropriate
- Recommend professional help when available
- Focus on prevention and preparedness alongside emergency response

IMPORTANT GUIDELINES:
1. Always recommend calling emergency services (999/911/112) as the first option when safe to do so
2. If emergency services are unavailable, provide the best available guidance
3. Prioritize: Safety > Shelter > Water > Food > Communication
4. Include relevant safety warnings for any potentially dangerous procedures
5. Focus on UK context but provide universal principles

RESPONSE FORMAT:
- Start with immediate safety considerations
- Provide step-by-step guidance
- Include relevant warnings or precautions
- Suggest when to seek professional help

Remember: This app is for emergency preparedness and education. Always encourage users to seek professional help when available.`,

    protocol: `Generate emergency protocols optimized for stressed, cognitively impaired users.

RULES:
- Exactly 5 steps
- Each step: ONE sentence, ONE action
- Use user's actual inventory (don't suggest items they don't have)
- Binary decisions only (YES/NO, not "maybe")
- Voice-readable (short words, simple grammar)
- Prioritize: Safety > Resources > Communication > Documentation

FORMAT:
Each step as:
{
  text: "The action in simple language",
  context: "Why this matters (optional, 10 words max)"
}

EXAMPLE:
User has: [3 water bottles, 1 lighter, ground floor apartment, wife at work 3 miles away]
Scenario: RIOT NEARBY

Response:
1. Fill bathtub with water (You have no stored water)
2. Retrieve bug-out bag from closet (Pre-packed supplies)
3. Text code "RED" to wife (Network congestion probable)
4. Lock secondary door (Your ground floor apartment)
5. Stay away from windows (Avoid projectiles)

Use UK terminology, locations, and infrastructure context.`
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
 * Detect if running in Windows native environment (Electron)
 * @returns {boolean}
 */
const isWindowsNative = () => {
    if (typeof window === 'undefined') return false;
    
    const hasElectronAPI = !!(window.electron || window.process?.versions?.electron);
    const isWindows = window.navigator?.platform?.includes('Win') || 
                      window.navigator?.userAgent?.includes('Windows');
    
    return hasElectronAPI || (isWindows && typeof window.require !== 'undefined');
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
        recommendedModel: null,
        aiAvailable: true,
        isWindowsNative: false,
        unavailableReason: null
    };

    // P1 FIX: Check for Windows native environment first
    // Windows native (Electron) doesn't support transformers.js
    if (isWindowsNative()) {
        capabilities.isWindowsNative = true;
        capabilities.aiAvailable = false;
        capabilities.unavailableReason = 'AI features are not available in the Windows desktop app. Please use the web version for AI-powered assistance.';
        log.warn('AI unavailable: Windows native environment detected');
        return capabilities;
    }

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

    // Check if we have minimum requirements for AI
    if (!capabilities.wasmSIMD && !capabilities.webGPU) {
        capabilities.aiAvailable = false;
        capabilities.unavailableReason = 'Your device does not support the required graphics capabilities for AI features.';
    }

    // Recommend a model based on capabilities
    // Note: Only recommend models that exist in AI_MODELS
    if (capabilities.aiAvailable) {
        if (capabilities.webGPU && capabilities.sufficientMemory) {
            capabilities.recommendedModel = AI_MODELS['phi3-mini'];
        } else {
            // TinyLlama works with WASM SIMD and is our lightweight fallback
            capabilities.recommendedModel = AI_MODELS['tinyllama'];
        }
    }

    return capabilities;
}

export default {
    AI_MODELS,
    LEGACY_MODELS,
    SYSTEM_PROMPTS,
    FALLBACK_TEMPLATES,
    AI_CONFIG,
    checkAICapability
};













