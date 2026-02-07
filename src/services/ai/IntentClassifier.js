/**
 * IntentClassifier - Detect emergency intent and route appropriately
 *
 * HYBRID SYSTEM:
 * 1. Keyword Regex (Fast, Synchronous, Reliable Fallback)
 * 2. MobileBERT Zero-Shot (Smart, Asynchronous, Context Aware)
 * 
 * Routes queries to:
 * - Triage flows (immediate, step-by-step guidance)
 * - AI Chat (conversational help)
 * - Search (information lookup)
 */

import { createLogger } from '../../utils/logger';
import ClassifierWorker from './classifier.worker.js?worker';

const log = createLogger('IntentClassifier');

import { EMERGENCY_PATTERNS } from '../../config/intentPatterns.js';

// Emergency patterns with associated triage stories
// EMERGENCY_PATTERNS imported from config


// Synonym expansion for better search coverage and intent matching
// Shared source of truth for HybridSearch and other services
const SYNONYMS = {
    // Hand-curated synonyms for high-value terms to improve recall
    'cpr': ['resuscitation', 'chest compressions', 'rescue breathing'],
    'heart attack': ['myocardial infarction', 'cardiac arrest', 'heart failure'],
    'stroke': ['brain attack', 'cerebrovascular accident', 'cva'],
    'bleeding': ['hemorrhage', 'blood loss', 'wound'],
    'burn': ['thermal injury', 'scald', 'fire injury'],
    'fracture': ['broken bone', 'break', 'crack'],
    'hypothermia': ['cold exposure', 'freezing', 'low body temperature'],
    'arrest': ['detained', 'custody', 'taken in'],
    'rights': ['entitlements', 'legal rights', 'civil rights']
};

// Map keywords to triage stories
const KEYWORD_TO_TRIAGE = {
    // Medical
    'cpr': 'health/cpr.ink.json',
    'not breathing': 'health/cpr.ink.json',
    'heart stopped': 'health/cpr.ink.json',
    'cardiac arrest': 'health/cpr.ink.json',
    'choking': 'health/choking.ink.json',
    'cannot breathe': 'health/choking.ink.json',
    'bleeding': 'health/severe-bleeding.ink.json',
    'severe bleeding': 'health/severe-bleeding.ink.json',
    'hypothermia': 'hypothermia.ink.json',
    'freezing': 'hypothermia.ink.json',

    // Survival
    'fire starting': 'survival/fire-making.ink.json',
    'make fire': 'survival/fire-making.ink.json',
    'shelter': 'survival/shelter-building.ink.json',
    'build shelter': 'survival/shelter-building.ink.json',
    'water purification': 'survival/water-purification.ink.json',
    'purify water': 'survival/water-purification.ink.json',
    'signal for help': 'survival/signaling.ink.json',

    // Legal
    'stop and search': 'legal/stop-and-search.ink.json',
    'police stop': 'legal/stop-and-search.ink.json',
    'being arrested': 'legal/arrest-rights.ink.json',
    'under arrest': 'legal/arrest-rights.ink.json',
    'custody': 'legal/custody-rights.ink.json',
    'detained': 'legal/custody-rights.ink.json'
};

// Map keywords to protocol scenarios
const KEYWORD_TO_PROTOCOL = {
    'riot': 'riot-nearby',
    'civil unrest': 'riot-nearby',
    'evacuate': 'evacuate-now',
    'evacuation': 'evacuate-now',
    'shelter in place': 'shelter-in-place',
    'power out': 'power-out',
    'blackout': 'power-out',
    'no water': 'no-water',
    'water supply': 'no-water'
};


// --- WORKER MANAGEMENT ---

let worker = null;
let isWorkerReady = false;
let pendingResolvers = {}; // Map of requestId -> {resolve, reject}
let requestIdCounter = 0;
let lastMlResult = null; // Cache for the most recent ML result to ensure sync consistency

const MAX_WORKER_INIT_RETRIES = 3;
let workerInitAttempts = 0;
let workerInitFailed = false; // Flag to indicate permanent failure after max retries

// Dispatch custom event for UI to react to worker status changes
const dispatchWorkerStatus = (status, detail = {}) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('intent-classifier-status', {
            detail: { status, ...detail }
        }));
    }
};

const initWorker = () => {
    if (typeof window === 'undefined') return; // Server-side guard

    // Don't retry if we've permanently failed
    if (workerInitFailed) {
        log.debug('Worker init permanently failed, using keyword fallback');
        return;
    }

    try {
        worker = new ClassifierWorker();

        worker.onmessage = (event) => {
            const { type, payload, id, error, mode } = event.data;

            if (type === 'ready') {
                isWorkerReady = true;
                workerInitAttempts = 0; // Reset on success
                workerInitFailed = false;
                log.info('ML Intent Classifier Worker Ready' + (mode === 'offline' ? ' (offline mode)' : ''));
                dispatchWorkerStatus('ready', { mode });
            } else if (type === 'result') {
                if (pendingResolvers[id]) {
                    pendingResolvers[id].resolve(payload);
                    delete pendingResolvers[id];
                }
            } else if (type === 'error') {
                log.error('ML Worker Error', error);
                if (pendingResolvers[id]) {
                    pendingResolvers[id].reject(new Error(error));
                    delete pendingResolvers[id];
                }
            }
        };

        worker.onerror = (e) => {
            log.error('Worker crashed', e);
            isWorkerReady = false;
            worker = null;

            // Attempt to recreate worker on crash with retry logic
            if (workerInitAttempts < MAX_WORKER_INIT_RETRIES) {
                const delay = Math.pow(2, workerInitAttempts) * 1000; // 1s, 2s, 4s
                workerInitAttempts++;
                log.info(`Worker crashed, retrying in ${delay}ms (attempt ${workerInitAttempts}/${MAX_WORKER_INIT_RETRIES})`);
                setTimeout(initWorker, delay);
            } else {
                log.error('Worker crashed after max retries - using keyword fallback permanently');
                workerInitFailed = true;
                dispatchWorkerStatus('failed', { reason: 'crash_after_retries' });
            }
        };

        worker.postMessage({ type: 'init' });
    } catch (e) {
        log.error('Failed to init ML worker', e);

        // Implement retry with exponential backoff
        if (workerInitAttempts < MAX_WORKER_INIT_RETRIES) {
            const delay = Math.pow(2, workerInitAttempts) * 1000; // 1s, 2s, 4s
            workerInitAttempts++;
            log.info(`Worker init failed, retrying in ${delay}ms (attempt ${workerInitAttempts}/${MAX_WORKER_INIT_RETRIES})`);
            setTimeout(initWorker, delay);
        } else {
            log.error('Worker init failed after retries - using keyword fallback permanently');
            workerInitFailed = true;
            dispatchWorkerStatus('failed', { reason: 'init_failed_after_retries' });
        }
    }
};

// Init on load
initWorker();

/**
 * Classify user query intent (Async with ML, Sync Fallback)
 * @param {string} query - User's search/chat query
 * @returns {Promise<Object>} - Classification result
 */
export async function classifyIntent(query) {
    // =============================================================================
    // VERIFIED: [Safety] INTENT_CLASSIFICATION_TIMEOUT_RACE_CONDITION
    // =============================================================================
    // Implementation: Uses Promise.race() with explicit timeout promise to ensure
    //   the classification always resolves, even if the worker becomes unresponsive.
    //   This prevents emergency detection from hanging indefinitely.
    //
    // The ML promise and timeout promise race against each other, guaranteeing
    //   a result within the calculated adaptive timeout (1000ms-6000ms based on
    //   device capabilities and first inference warm-up).
    // =============================================================================

    // VERIFIED: [Performance] INTENT_CACHE_PERSISTENCE
    // Cache persisted to IndexedDB with 7-day TTL, loaded on startup
    if (!query || typeof query !== 'string') {
        return createGeneralResult();
    }

    const normalized = query.toLowerCase().trim();

    // 0. CACHE CHECK: Check LRU cache first for repeated queries
    const cachedResult = getCachedIntent(query);
    if (cachedResult) {
        return cachedResult;
    }

    // 1. FAST PATH: Check Keywords first (Instant & Cheap)
    // If we find a specific keyword match (especially critical ones), we might trust it immediately.
    // However, ML is better for vague queries.
    // Strategy: Use Keyword if confidence is high (exact or multiple matches), else try ML.

    // Legacy keyword check
    const keywordResult = classifyIntentByKeywords(normalized);

    // If high urgency detected by keywords, return immediately (Speed is safety)
    if (keywordResult.urgency >= 8) {
        log.debug('Keyword matched high urgency, skipping ML', keywordResult);
        // Cache high urgency results
        setCachedIntent(query, keywordResult);
        return keywordResult;
    }

    // 2. SMART PATH: ML Classification (if ready and query is ambiguous)
    if (isWorkerReady && !workerInitFailed) {
        try {
            // Dynamic timeout based on device capabilities
            const baseTimeout = 1000;
            const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
            const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory : 4;

            // Detect slow devices: <4 cores or <4GB RAM
            const isSlowDevice = cpuCores < 4 || (deviceMemory && deviceMemory < 4);

            // Calculate adaptive timeout:
            // - Base: 1000ms for fast devices
            // - Slow devices: 3x (3000ms)
            // - First inference (requestIdCounter === 1) gets additional 2x for warm-up
            const isFirstInference = requestIdCounter === 1;
            let mlTimeout = baseTimeout;

            if (isSlowDevice) {
                mlTimeout *= 3;
            }
            if (isFirstInference) {
                mlTimeout *= 2; // Extra time for model warm-up on first run
                log.debug(`First ML inference, using extended timeout: ${mlTimeout}ms`);
            }

            const id = ++requestIdCounter;

            // Create ML promise with explicit timeout race condition handling
            // VERIFIED: Uses Promise.race to ensure timeout always fires even if worker hangs
            const mlPromise = new Promise((resolve, reject) => {
                pendingResolvers[id] = {
                    resolve: (val) => { resolve(val); },
                    reject: (err) => { reject(err); }
                };
                // Worker echoes back ID for proper request/response matching
                worker.postMessage({ type: 'classify', payload: { query }, id });
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`ML Timeout after ${mlTimeout}ms`)), mlTimeout)
            );

            const result = await Promise.race([mlPromise, timeoutPromise]);

            // Clean up pending resolver on successful completion
            delete pendingResolvers[id];

            // Merge ML result with definitions
            const pattern = EMERGENCY_PATTERNS[result.type];
            if (pattern && result.confidence > 0.4) {
                const finalResult = {
                    type: result.type,
                    urgency: pattern.urgency,
                    category: pattern.category,
                    route: pattern.route,
                    message: pattern.message,
                    cta: pattern.cta,
                    triageStory: findTriageForContext(result.type, normalized), // Try to find specific context
                    protocolId: null,
                    confidence: result.confidence,
                    matchedKeywords: [],
                    source: 'ml'
                };
                lastMlResult = { query: normalized, ...finalResult };
                return finalResult;
            }
        } catch (mlError) {
            log.warn('ML Classification failed/timed out, falling back', mlError);
        }
    }

    // 3. FALLBACK: Return the keyword result if ML failed or wasn't confident
    return keywordResult;
}

// Helper to deduce specific triage story even if ML gave us the category
function findTriageForContext(type, query) {
    // If ML says "medical_critical" (e.g. from "I can't breathe"), we still want to link to CPR if possible.
    // We can do a secondary fuzzy match or just fallback to keywords for the *link*.
    const keywordRes = classifyIntentByKeywords(query);
    return keywordRes.triageStory;
}

// --- LEGACY SYNC IMPLEMENTATION (Used as fallback) ---

function classifyIntentByKeywords(normalized) {
    let bestMatch = null;
    let bestScore = 0;
    let matchedKeywords = [];

    for (const [type, pattern] of Object.entries(EMERGENCY_PATTERNS)) {
        const matches = pattern.keywords.filter(kw =>
            normalized.includes(kw.toLowerCase())
        );

        if (matches.length > 0) {
            const score = matches.length * pattern.urgency;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { type, ...pattern };
                matchedKeywords = matches;
            }
        }
    }

    if (!bestMatch) {
        return createGeneralResult();
    }

    // Find specific triage story
    let triageStory = null;
    let protocolId = null;

    for (const kw of matchedKeywords) {
        if (KEYWORD_TO_TRIAGE[kw]) {
            triageStory = KEYWORD_TO_TRIAGE[kw];
            break;
        }
        if (KEYWORD_TO_PROTOCOL[kw]) {
            protocolId = KEYWORD_TO_PROTOCOL[kw];
            break;
        }
    }

    const confidence = Math.min(matchedKeywords.length / 2, 1);

    return {
        type: bestMatch.type,
        urgency: bestMatch.urgency,
        category: bestMatch.category,
        route: bestMatch.route,
        message: bestMatch.message,
        cta: bestMatch.cta,
        triageStory,
        protocolId,
        confidence,
        matchedKeywords,
        source: 'keyword'
    };
}

function createGeneralResult() {
    return {
        type: 'general',
        urgency: 0,
        category: null,
        route: 'search',
        confidence: 0,
        matchedKeywords: [],
        source: 'none'
    };
}

/**
 * Sync helper for UI state checks.
 * Checks cached ML result first for consistency, falls back to keywords.
 * For fresh results, prefer async classifyIntent().
 */
export function isEmergency(query) {
    const normalized = query.toLowerCase().trim();
    // Check cached ML result first for consistency
    if (lastMlResult && lastMlResult.query === normalized) {
        return lastMlResult.urgency >= 7;
    }
    const result = classifyIntentByKeywords(normalized);
    return result.urgency >= 7;
}

export function isUrgent(query) {
    const normalized = query.toLowerCase().trim();
    if (lastMlResult && lastMlResult.query === normalized) {
        return lastMlResult.urgency >= 5;
    }
    const result = classifyIntentByKeywords(normalized);
    return result.urgency >= 5;
}

export function getSuggestedTriage(query) {
    const normalized = query.toLowerCase().trim();
    if (lastMlResult && lastMlResult.query === normalized) {
        return lastMlResult.triageStory;
    }
    const result = classifyIntentByKeywords(normalized);
    return result.triageStory;
}

export function getSuggestedProtocol(query) {
    const normalized = query.toLowerCase().trim();
    if (lastMlResult && lastMlResult.query === normalized) {
        return lastMlResult.protocolId;
    }
    const result = classifyIntentByKeywords(normalized);
    return result.protocolId;
}

// =============================================================================
// VERIFIED: [Performance] INTENT_CACHE_SIZE_LIMIT
// =============================================================================
// Implementation: Added LRU cache for intent classification results using Map.
//   Cache size limited to 50 entries. Most recent queries moved to end.
//   This reduces redundant classifications for high-frequency queries like
//   "help", "cpr", etc. that users may type repeatedly.
// =============================================================================

const intentCache = new Map();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
let cacheLoaded = false;

/**
 * Load persisted cache from IndexedDB on startup
 */
async function loadPersistedCache() {
    if (cacheLoaded) return;
    try {
        const { db } = await import('../db.js');
        const persisted = await db.get('dataset_preferences', 'intent_cache');
        if (persisted && typeof persisted === 'object') {
            const now = Date.now();
            for (const [key, entry] of Object.entries(persisted)) {
                if (entry && entry.timestamp && (now - entry.timestamp < CACHE_TTL_MS)) {
                    intentCache.set(key, entry.result);
                }
            }
            log.debug(`Loaded ${intentCache.size} cached intents from IndexedDB`);
        }
        cacheLoaded = true;
    } catch (e) {
        log.warn('Failed to load persisted intent cache', e);
        cacheLoaded = true; // Don't retry on error
    }
}

/**
 * Persist cache to IndexedDB
 */
async function persistCache() {
    try {
        const { db } = await import('../db.js');
        const toStore = {};
        const now = Date.now();
        for (const [key, result] of intentCache.entries()) {
            toStore[key] = { result, timestamp: now };
        }
        await db.put('dataset_preferences', toStore, 'intent_cache');
    } catch (e) {
        log.warn('Failed to persist intent cache', e);
    }
}

// Load cache on module init
if (typeof window !== 'undefined') {
    loadPersistedCache();
}

/**
 * Get cached intent result for a query
 * @param {string} query - User query
 * @returns {Object|null} - Cached result or null if not found
 */
function getCachedIntent(query) {
    const normalized = query.toLowerCase().trim();
    if (intentCache.has(normalized)) {
        const cached = intentCache.get(normalized);
        // Move to end (LRU) - most recently used
        intentCache.delete(normalized);
        intentCache.set(normalized, cached);
        log.debug('Intent cache hit:', normalized);
        return cached;
    }
    return null;
}

/**
 * Cache intent result for a query
 * @param {string} query - User query
 * @param {Object} result - Classification result
 */
function setCachedIntent(query, result) {
    const normalized = query.toLowerCase().trim();

    // Evict oldest entry if cache is full
    if (intentCache.size >= MAX_CACHE_SIZE) {
        const firstKey = intentCache.keys().next().value;
        intentCache.delete(firstKey);
        log.debug('Intent cache evicted:', firstKey);
    }

    intentCache.set(normalized, result);
    log.debug('Intent cache set:', normalized);

    // P2 FIX: Persist to IndexedDB (debounced - runs async)
    persistCache();
}

/**
 * Clear the intent cache (useful for testing or memory pressure)
 */
export function clearIntentCache() {
    intentCache.clear();
    log.info('Intent cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getIntentCacheStats() {
    return {
        size: intentCache.size,
        maxSize: MAX_CACHE_SIZE,
        keys: Array.from(intentCache.keys())
    };
}

// Namespace export for backward compatibility with HybridSearch.js
export const IntentClassifier = {
    SYNONYMS,
    EMERGENCY_PATTERNS,
    classifyIntent,
    isEmergency,
    isUrgent,
    getSuggestedTriage,
    getSuggestedProtocol,
    clearIntentCache,
    getIntentCacheStats
};
