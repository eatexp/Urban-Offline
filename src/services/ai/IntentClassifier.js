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

// --- CONSTANTS & PATTERNS (LEGACY FALLBACK) ---
// NOTE: Architecture - Consider decoupling these patterns into a shared config if lists grow large.
// TODO: Refactor - Move EMERGENCY_PATTERNS to a separate config file (e.g., config/intentPatterns.js) to improve maintainability.

// Emergency patterns with associated triage stories
const EMERGENCY_PATTERNS = {
    // Medical - Life Threatening (Highest Priority)
    'medical_critical': {
        keywords: [
            'not breathing', 'stopped breathing', 'no pulse', 'heart stopped',
            'unconscious', 'unresponsive', 'passed out', 'collapsed',
            'choking', 'cannot breathe', 'can\'t breathe', 'airway blocked',
            'heart attack', 'cardiac arrest', 'chest pain',
            'overdose', 'poisoning', 'poisoned',
            'drowning', 'drowned'
        ],
        urgency: 10,
        category: 'medical',
        route: 'triage',
        triageStory: null, // Will be determined by TriageRouter
        message: '🚨 EMERGENCY DETECTED',
        cta: 'Start Emergency Guide Now'
    },

    // Medical - Severe (High Priority)
    'medical_severe': {
        keywords: [
            'bleeding heavily', 'severe bleeding', 'blood everywhere', 'arterial bleeding',
            'deep cut', 'deep wound', 'stab wound', 'gunshot',
            'broken bone', 'fracture', 'bone sticking out',
            'severe burn', 'burned badly', 'chemical burn',
            'head injury', 'concussion', 'skull',
            'seizure', 'convulsion', 'fitting',
            'anaphylaxis', 'severe allergic', 'throat swelling',
            'hypothermia', 'freezing', 'very cold', 'blue lips',
            'heat stroke', 'heat exhaustion', 'overheating'
        ],
        urgency: 8,
        category: 'medical',
        route: 'triage',
        triageStory: null,
        message: '⚠️ Urgent Medical Situation',
        cta: 'Get First Aid Guide'
    },

    // Medical - General Query
    'medical_query': {
        keywords: [
            'first aid', 'how to treat', 'what to do if',
            'symptoms of', 'signs of', 'is it serious',
            'when to call', 'emergency', 'ambulance',
            'cpr', 'resuscitation', 'recovery position',
            'bandage', 'dressing', 'wound care',
            'pain relief', 'medication'
        ],
        urgency: 5,
        category: 'medical',
        route: 'search',
        message: null,
        cta: null
    },

    // Survival - Immediate Danger
    'survival_critical': {
        keywords: [
            'riot nearby', 'riot outside', 'civil unrest',
            'evacuate now', 'need to evacuate', 'evacuation',
            'active shooter', 'gunfire', 'shooting',
            'building on fire', 'fire spreading', 'trapped',
            'flood water', 'flooding', 'water rising',
            'tornado', 'hurricane', 'earthquake'
        ],
        urgency: 10,
        category: 'survival',
        route: 'protocol',
        protocolId: null, // Will be determined dynamically
        message: '🚨 EMERGENCY SITUATION',
        cta: 'Get Emergency Protocol'
    },

    // Survival - Preparedness
    'survival_prep': {
        keywords: [
            'power out', 'power outage', 'no electricity', 'blackout',
            'no water', 'water supply', 'water purification',
            'shelter', 'find shelter', 'build shelter',
            'start fire', 'make fire', 'fire starting',
            'signal for help', 'signaling', 'rescue',
            'food storage', 'preserve food', 'foraging',
            'navigation', 'lost', 'find direction'
        ],
        urgency: 6,
        category: 'survival',
        route: 'triage',
        message: '🏕️ Survival Situation',
        cta: 'Open Survival Guide'
    },

    // Legal - Immediate
    'legal_immediate': {
        keywords: [
            'being arrested', 'police arresting', 'under arrest',
            'police stop', 'stopped by police', 'pulled over',
            'search me', 'searching my', 'can they search',
            'my rights', 'what are my rights', 'legal rights',
            'detained', 'custody', 'being held'
        ],
        urgency: 7,
        category: 'legal',
        route: 'triage',
        message: '⚖️ Know Your Rights',
        cta: 'Open Legal Guide'
    },

    // Legal - General Query
    'legal_query': {
        keywords: [
            'is it legal', 'can police', 'law about',
            'pace code', 'legislation', 'legal',
            'solicitor', 'lawyer', 'legal aid',
            'court', 'magistrate', 'tribunal'
        ],
        urgency: 3,
        category: 'legal',
        route: 'search',
        message: null,
        cta: null
    }
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

const initWorker = () => {
    if (typeof window === 'undefined') return; // Server-side guard

    try {
        worker = new ClassifierWorker();

        worker.onmessage = (event) => {
            const { type, payload, id, error } = event.data;

            if (type === 'ready') {
                isWorkerReady = true;
                log.info('ML Intent Classifier Worker Ready');
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

        worker.postMessage({ type: 'init' });
    } catch (e) {
        log.error('Failed to init ML worker', e);
        // TODO: Resilience - Implement retry logic for worker initialization (e.g. exponential backoff)
        // If worker fails to load (network error), we should try again or ensure fallback is fully active.
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
    if (!query || typeof query !== 'string') {
        return createGeneralResult();
    }

    const normalized = query.toLowerCase().trim();

    // 1. FAST PATH: Check Keywords first (Instant & Cheap)
    // If we find a specific keyword match (especially critical ones), we might trust it immediately.
    // However, ML is better for vague queries.
    // Strategy: Use Keyword if confidence is high (exact or multiple matches), else try ML.

    // Legacy keyword check
    const keywordResult = classifyIntentByKeywords(normalized);

    // If high urgency detected by keywords, return immediately (Speed is safety)
    if (keywordResult.urgency >= 8) {
        log.debug('Keyword matched high urgency, skipping ML', keywordResult);
        return keywordResult;
    }

    // 2. SMART PATH: ML Classification (if ready and query is ambiguous)
    if (isWorkerReady) {
        try {
            const result = await new Promise((resolve, reject) => {
                const id = ++requestIdCounter;
                // Add potential timeout
                const timeout = setTimeout(() => {
                    delete pendingResolvers[id];
                    reject(new Error('ML Timeout'));
                }, 1000); // 1s timeout for ML

                pendingResolvers[id] = {
                    resolve: (val) => { clearTimeout(timeout); resolve(val); },
                    reject: (err) => { clearTimeout(timeout); reject(err); }
                };
                // Worker echoes back ID for proper request/response matching
                worker.postMessage({ type: 'classify', payload: { query }, id });
            });

            // Merge ML result with definitions
            const pattern = EMERGENCY_PATTERNS[result.type];
            if (pattern && result.confidence > 0.4) {
                return {
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

// Support Sync checks for UI state (isRed, isUrgent) - relying on Keyword only for instant UI
export function isEmergency(query) {
    const result = classifyIntentByKeywords(query.toLowerCase());
    return result.urgency >= 8;
}

export function isUrgent(query) {
    const result = classifyIntentByKeywords(query.toLowerCase());
    return result.urgency >= 5;
}

export function getSuggestedTriage(query) {
    const result = classifyIntentByKeywords(query.toLowerCase());
    return result.triageStory;
}

export function getSuggestedProtocol(query) {
    const result = classifyIntentByKeywords(query.toLowerCase());
    return result.protocolId;
}

export async function getEmergencyAlert(query) {
    // This one can be async!
    const result = await classifyIntent(query);

    if (result.urgency < 7) {
        return null;
    }

    return {
        type: result.type,
        category: result.category,
        message: result.message,
        cta: result.cta,
        route: result.route,
        triageStory: result.triageStory,
        protocolId: result.protocolId,
        urgency: result.urgency
    };
}

export const IntentClassifier = {
    classifyIntent,
    isEmergency,
    isUrgent,
    getSuggestedTriage,
    getSuggestedProtocol,
    getEmergencyAlert,
    EMERGENCY_PATTERNS,
    KEYWORD_TO_TRIAGE,
    KEYWORD_TO_PROTOCOL
};

export default IntentClassifier;
