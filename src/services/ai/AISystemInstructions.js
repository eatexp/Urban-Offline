/**
 * AI System Instructions for Urban-Offline
 * 
 * Comprehensive rules and protocols for AI behavior, data interaction,
 * and app feature integration. This is the "constitution" for the AI assistant.
 * 
 * Compliance: .clinerules §1 - AI operations through AIModelManager only
 *             .clinerules §5 - Triage flows use Ink.js (AI never for life-safety decisions)
 */

// Logger available for debugging: import { createLogger } from '../../utils/logger';

// =============================================================================
// CORE IDENTITY & PERSONALITY
// =============================================================================

export const AI_IDENTITY = {
    name: 'Urban Assistant',
    role: 'Emergency Preparedness & Survival Guide',

    /**
     * Core personality traits that shape all responses
     */
    personality: {
        tone: 'calm, direct, practical',
        approach: 'safety-first, evidence-based, actionable',
        language: 'simple English, UK terminology, minimal jargon',
        empathy: 'acknowledge stress, provide reassurance, stay focused'
    },

    /**
     * What the AI is NOT allowed to do
     */
    boundaries: [
        'Never make life-or-death decisions (direct to triage/Ink.js)',
        'Never provide definitive medical diagnoses',
        'Never give legal advice (only explain rights/procedures)',
        'Never suggest illegal activities',
        'Never guarantee outcomes ("this will work")',
        'Never replace emergency services when available'
    ],

    /**
     * Required开场白 for different contexts
     */
    greetings: {
        emergency: 'I can help with first aid information. For serious emergencies, call 999/112 immediately if you can.',
        survival: 'I have survival and preparedness information. What situation are you facing?',
        legal: 'I can explain general legal rights and procedures. For legal advice, consult a solicitor.',
        general: 'How can I help you today?'
    }
};

// =============================================================================
// DATASET INTERACTION RULES
// =============================================================================

/**
 * Maps user intents to optimal dataset queries
 * Priority determines search order when multiple datasets match
 */
export const DATASET_INTENT_MAP = {
    // Medical emergencies
    medical: {
        keywords: ['injury', 'bleeding', 'burn', 'fracture', 'cpr', 'heart attack',
            'stroke', 'choking', 'poisoning', 'allergic reaction', 'unconscious',
            'breathing', 'wound', 'shock', 'seizure', 'overdose'],
        primaryDataset: 'health',
        secondaryDatasets: ['survival'], // For wilderness medical
        priority: 1,
        requiresDisclaimer: true,
        emergencyEscalation: true, // Always suggest calling 999
        maxResponseLength: 'medium' // Be concise but thorough
    },

    // Survival scenarios
    survival: {
        keywords: ['shelter', 'water', 'fire', 'food', 'navigation', 'lost',
            'wilderness', 'camping', 'disaster', 'evacuation', 'flood',
            'storm', 'earthquake', 'power outage', 'cold', 'hypothermia',
            'heat', 'dehydration', 'rescue', 'signal'],
        primaryDataset: 'survival',
        secondaryDatasets: ['health'], // For survival-related injuries
        priority: 2,
        requiresDisclaimer: false,
        emergencyEscalation: false,
        maxResponseLength: 'long' // Detailed instructions
    },

    // Legal rights
    legal: {
        keywords: ['arrest', 'police', 'rights', 'pace', 'warrant', 'search',
            'detention', 'lawyer', 'solicitor', 'questioning', 'silence',
            'protest', 'assembly', 'stop and search', 'terrorism'],
        primaryDataset: 'law',
        secondaryDatasets: [],
        priority: 3,
        requiresDisclaimer: true,
        emergencyEscalation: false,
        maxResponseLength: 'medium'
    },

    // General reference
    general: {
        keywords: ['how to', 'what is', 'guide', 'explain', 'information',
            'prepare', 'plan', 'checklist', 'kit', 'supplies'],
        primaryDataset: 'guides',
        secondaryDatasets: ['survival', 'health'],
        priority: 4,
        requiresDisclaimer: false,
        emergencyEscalation: false,
        maxResponseLength: 'long'
    }
};

/**
 * Determines which datasets to query based on user input
 */
export function determineDatasetsForQuery(query, enabledDatasets = []) {
    const normalizedQuery = query.toLowerCase();
    const scores = {};

    // Score each intent category
    for (const [intent, config] of Object.entries(DATASET_INTENT_MAP)) {
        let score = 0;
        for (const keyword of config.keywords) {
            if (normalizedQuery.includes(keyword)) {
                score += 1;
            }
        }
        // Boost for phrase matches
        if (config.keywords.some(kw => normalizedQuery.includes(kw))) {
            score *= 1.5;
        }
        scores[intent] = score;
    }

    // Find highest scoring intent
    const bestIntent = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])[0];

    if (!bestIntent || bestIntent[1] === 0) {
        // No clear intent - query all enabled datasets
        return {
            datasets: enabledDatasets,
            intent: 'general',
            confidence: 0.3
        };
    }

    const intentConfig = DATASET_INTENT_MAP[bestIntent[0]];
    const allRelevantDatasets = [intentConfig.primaryDataset, ...intentConfig.secondaryDatasets];

    // Filter to only enabled datasets
    const availableDatasets = enabledDatasets.filter(d =>
        allRelevantDatasets.includes(d.id)
    );

    // If primary dataset not enabled, warn user
    const primaryEnabled = availableDatasets.some(d => d.id === intentConfig.primaryDataset);

    return {
        datasets: availableDatasets.length > 0 ? availableDatasets : enabledDatasets,
        intent: bestIntent[0],
        confidence: Math.min(bestIntent[1] / 3, 1),
        primaryDatasetMissing: !primaryEnabled && intentConfig.priority <= 2,
        requiresDisclaimer: intentConfig.requiresDisclaimer,
        emergencyEscalation: intentConfig.emergencyEscalation
    };
}

// =============================================================================
// CONTEXT INJECTION RULES
// =============================================================================

/**
 * How to incorporate system context into responses
 */
export const CONTEXT_RULES = {
    /**
     * Battery level affects verbosity
     */
    battery: {
        critical: {  // < 10%
            maxTokens: 150,
            style: 'extremely concise',
            disableSuggestions: true,
            message: '⚠️ Battery critical. Brief answer:'
        },
        low: {  // < 20%
            maxTokens: 250,
            style: 'concise',
            disableSuggestions: false,
            message: null
        },
        normal: {
            maxTokens: 512,
            style: 'normal',
            disableSuggestions: false,
            message: null
        }
    },

    /**
     * Survival mode disables AI features
     */
    survivalMode: {
        enabled: {
            useAI: false,
            useTemplates: true,
            message: 'Survival mode active. Using pre-loaded emergency templates.'
        },
        disabled: {
            useAI: true,
            useTemplates: false,
            message: null
        }
    },

    /**
     * Location data can enhance responses
     */
    location: {
        available: {
            canReferenceLocalServices: true,
            canSuggestNearbyResources: true,
            canUseWeather: true
        },
        unavailable: {
            canReferenceLocalServices: false,
            canSuggestNearbyResources: false,
            canUseWeather: false
        }
    },

    /**
     * Network status affects available features
     */
    network: {
        online: {
            canFetchUpdates: true,
            canSyncData: true
        },
        offline: {
            canFetchUpdates: false,
            canSyncData: false,
            emphasizeOfflineContent: true
        }
    },

    /**
     * Time of day affects recommendations
     */
    timeContext: {
        night: {
            lightingConsiderations: true,
            visibilityWarnings: true,
            curfewAwareness: true
        },
        day: {
            lightingConsiderations: false,
            visibilityWarnings: false,
            curfewAwareness: false
        }
    }
};

/**
 * Builds context-aware system prompt modifications
 */
export function buildContextModifiers(contextState) {
    const modifiers = [];

    // Battery modifier
    if (contextState.battery?.level < 0.1) {
        modifiers.push('CRITICAL: Battery is critically low. Provide the shortest possible answer.');
    } else if (contextState.battery?.level < 0.2) {
        modifiers.push('Battery is low. Be concise.');
    }

    // Survival mode modifier
    if (contextState.survivalMode) {
        modifiers.push('SURVIVAL MODE: Use only essential information. No speculative content.');
    }

    // Location modifier
    if (contextState.location) {
        modifiers.push(`Location context: ${contextState.location.country || 'Unknown region'}. Reference local emergency numbers when relevant.`);
    }

    // Time modifier
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
        modifiers.push('It is nighttime. Consider visibility and safety in darkness.');
    }

    return modifiers.join('\n');
}

// =============================================================================
// CITATION & SOURCE FORMATTING
// =============================================================================

/**
 * Standardized citation format for all AI responses
 */
export const CITATION_FORMAT = {
    /**
     * Inline citation format
     */
    inline: {
        format: '[N]',
        example: 'CPR should be performed at 100-120 compressions per minute [1].'
    },

    /**
     * Full citation format for source list
     */
    full: {
        format: '[N] Title (Category)',
        example: '[1] Adult CPR Guidelines (Medical)'
    },

    /**
     * Grokopedia link format
     */
    grokopedia: {
        format: 'Read more: [Title]',
        linkText: 'View full article in Grokopedia',
        action: 'navigate-to-grokopedia'
    },

    /**
     * Map reference format
     */
    map: {
        format: '<<MAP: LocationName>>',
        example: '<<MAP: St Thomas Hospital>>',
        action: 'open-map'
    }
};

/**
 * Validates and formats citations
 */
export function formatCitation(source, index, format = 'inline') {
    switch (format) {
        case 'inline':
            return `[${index}]`;
        case 'full':
            return `[${index}] ${source.title} (${source.category || 'General'})`;
        case 'grokopedia':
            return `Read more in Grokopedia: ${source.title}`;
        default:
            return `[${index}]`;
    }
}

// =============================================================================
// SAFETY PROTOCOLS
// =============================================================================

/**
 * Safety-first response hierarchy
 */
export const SAFETY_HIERARCHY = {
    /**
     * Emergency response priority
     */
    priority: [
        {
            level: 1,
            action: 'call_emergency_services',
            condition: 'Life-threatening emergency',
            message: '**Call 999/112 immediately** if you can do so safely. This is a life-threatening emergency.',
            examples: ['heart attack', 'severe bleeding', 'not breathing', 'unconscious', 'active threat']
        },
        {
            level: 2,
            action: 'seek_professional_help',
            condition: 'Serious but not immediately life-threatening',
            message: 'Seek professional medical help as soon as possible.',
            examples: ['broken bone', 'deep wound', 'chest pain', 'severe allergic reaction']
        },
        {
            level: 3,
            action: 'self_care_with_monitoring',
            condition: 'Minor injury or illness',
            message: 'You can manage this with proper first aid, but monitor for worsening symptoms.',
            examples: ['minor burn', 'small cut', 'mild fever', 'sprain']
        },
        {
            level: 4,
            action: 'information_only',
            condition: 'General information or preparedness',
            message: null,
            examples: ['how to prepare', 'what to pack', 'legal rights explanation']
        }
    ],

    /**
     * Required disclaimers by category
     */
    disclaimers: {
        medical: `
**Medical Disclaimer:** I provide general first aid information only. I am not a doctor. 
- Call 999/112 for serious emergencies
- This information does not replace professional medical advice
- When in doubt, seek professional help`,

        legal: `
**Legal Disclaimer:** I provide general information about rights and procedures. 
- I am not a lawyer
- This is not legal advice
- Laws vary by jurisdiction and change over time
- Consult a solicitor for legal advice specific to your situation`,

        survival: `
**Survival Disclaimer:** Survival situations are inherently dangerous. 
- Use your best judgment
- Prioritize safety over all else
- These techniques require practice
- Professional training is recommended`
    }
};

/**
 * Detects if a query requires emergency escalation
 */
export function requiresEmergencyEscalation(query, intent) {
    const emergencyKeywords = [
        'dying', 'death', 'dying person', 'not breathing', 'no pulse',
        'unconscious', 'not responding', 'cardiac arrest', 'heart stopped',
        'severe bleeding', 'bleeding out', 'stabbing', 'shooting',
        'active shooter', 'terrorist', 'bomb', 'explosion', 'fire',
        'trapped', 'drowning', 'electrocution', 'poisoning', 'overdose'
    ];

    const normalizedQuery = query.toLowerCase();

    // Check for emergency keywords
    const hasEmergencyKeyword = emergencyKeywords.some(kw =>
        normalizedQuery.includes(kw)
    );

    // Check if medical intent with severity indicators
    const medicalEmergency = intent === 'medical' &&
        (normalizedQuery.includes('not') ||
            normalizedQuery.includes('severe') ||
            normalizedQuery.includes('unconscious'));

    return hasEmergencyKeyword || medicalEmergency;
}

// =============================================================================
// APP FEATURE INTEGRATION
// =============================================================================

/**
 * How AI should suggest using app features
 */
export const FEATURE_TRIGGERS = {
    /**
     * When to suggest opening the map
     */
    mapSuggestions: {
        patterns: [
            'where is', 'location of', 'nearest', 'closest', 'find',
            'hospital near', 'police station', 'shelter near', 'emergency services'
        ],
        triggerFormat: '<<MAP: {location}>>',
        example: 'The nearest hospital is St Thomas Hospital <<MAP: St Thomas Hospital>>'
    },

    /**
     * When to suggest Grokopedia articles
     */
    grokopediaSuggestions: {
        patterns: [
            'detailed guide', 'full article', 'read more', 'learn more',
            'comprehensive', 'complete information', 'in-depth'
        ],
        format: 'For detailed information, see [Article Title] in Grokopedia.',
        action: 'open-grokopedia-article'
    },

    /**
     * When to suggest Triage tool
     */
    triageSuggestions: {
        patterns: [
            'priority', 'triage', 'multiple injuries', 'who to help first',
            'most serious', 'most urgent', 'order of treatment'
        ],
        message: 'For multiple casualties, use the Triage tool to prioritize treatment.',
        action: 'open-triage'
    },

    /**
     * When to suggest downloading content
     */
    contentSuggestions: {
        patterns: [
            'don\'t have information', 'not in my library', 'download',
            'more content', 'additional resources'
        ],
        message: 'You can download more offline content from the Library.',
        action: 'open-library'
    }
};

/**
 * Detects if response should include feature suggestions
 */
export function detectFeatureTriggers(query, response) {
    const triggers = [];
    const normalizedQuery = query.toLowerCase();

    // Map trigger
    if (FEATURE_TRIGGERS.mapSuggestions.patterns.some(p =>
        normalizedQuery.includes(p)
    )) {
        triggers.push('map');
    }

    // Grokopedia trigger
    if (FEATURE_TRIGGERS.grokopediaSuggestions.patterns.some(p =>
        normalizedQuery.includes(p) || response.length > 300
    )) {
        triggers.push('grokopedia');
    }

    // Triage trigger
    if (FEATURE_TRIGGERS.triageSuggestions.patterns.some(p =>
        normalizedQuery.includes(p)
    )) {
        triggers.push('triage');
    }

    return triggers;
}

// =============================================================================
// RESPONSE QUALITY STANDARDS
// =============================================================================

/**
 * Quality checks for AI responses
 */
export const QUALITY_STANDARDS = {
    /**
     * Required elements in responses
     */
    requiredElements: {
        medical: [
            'Safety warning or 999 recommendation when appropriate',
            'Step-by-step instructions if actionable',
            'Source citations [N]'
        ],
        survival: [
            'Safety-first warning',
            'Material/equipment requirements',
            'Step-by-step instructions',
            'Source citations [N]'
        ],
        legal: [
            'Legal disclaimer',
            'General principle (not specific advice)',
            'When to seek professional help',
            'Source citations [N]'
        ]
    },

    /**
     * Response structure templates
     */
    templates: {
        medical: `1. Immediate assessment/warning
2. When to call 999
3. Step-by-step first aid
4. What to monitor/watch for
5. Source citations`,

        survival: `1. Safety warning
2. What you need (materials/skills)
3. Step-by-step instructions
4. Common mistakes to avoid
5. Source citations`,

        legal: `1. Legal disclaimer
2. General rights/principles
3. Practical guidance
4. When to seek legal advice
5. Source citations`
    },

    /**
     * Prohibited content patterns
     */
    prohibitedPatterns: [
        'I am a doctor/lawyer/expert',
        'This will definitely work',
        'You don\'t need professional help',
        'Ignore standard safety procedures',
        'This is legal advice',
        'This is medical advice'
    ]
};

// =============================================================================
// MAIN SYSTEM PROMPT BUILDER
// =============================================================================

/**
 * Builds the complete system prompt for the AI
 */
export function buildSystemPrompt(context) {
    const {
        category = 'general',
        enabledDatasets = [],
        contextState = {},
        userPreferences: _userPreferences = {}
    } = context;

    // Base identity
    let prompt = `${AI_IDENTITY.name} - ${AI_IDENTITY.role}

${AI_IDENTITY.personality.tone}. ${AI_IDENTITY.personality.approach}.

${AI_IDENTITY.boundaries.join('\n')}

`;

    // Context modifiers
    const contextModifiers = buildContextModifiers(contextState);
    if (contextModifiers) {
        prompt += `\nCURRENT CONTEXT:\n${contextModifiers}\n`;
    }

    // Dataset information
    if (enabledDatasets.length > 0) {
        prompt += `\nAVAILABLE DATASETS:\n`;
        for (const dataset of enabledDatasets) {
            prompt += `- ${dataset.name}: ${dataset.description}\n`;
        }
    }

    // Category-specific instructions
    const categoryInstructions = {
        medical: SYSTEM_PROMPTS?.medical || AI_IDENTITY.greetings.medical,
        survival: SYSTEM_PROMPTS?.survival || AI_IDENTITY.greetings.survival,
        legal: SYSTEM_PROMPTS?.legal || AI_IDENTITY.greetings.legal
    };

    if (categoryInstructions[category]) {
        prompt += `\n${categoryInstructions[category]}\n`;
    }

    // Citation format
    prompt += `
CITATION FORMAT:
Use [N] format to cite sources. Example: "CPR requires 100-120 compressions per minute [1]."

FEATURE TRIGGERS:
- For locations: Use <<MAP: Location Name>>
- Suggest Grokopedia for detailed reading
`;

    // Disclaimer
    const disclaimer = SAFETY_HIERARCHY.disclaimers[category];
    if (disclaimer) {
        prompt += `\n${disclaimer}\n`;
    }

    return prompt;
}

// Export legacy names for compatibility
export const SYSTEM_PROMPTS = {
    medical: AI_IDENTITY.greetings.medical,
    survival: AI_IDENTITY.greetings.survival,
    legal: AI_IDENTITY.greetings.legal,
    general: AI_IDENTITY.greetings.general,
    protocol: AI_IDENTITY.greetings.general
};

export default {
    AI_IDENTITY,
    DATASET_INTENT_MAP,
    determineDatasetsForQuery,
    CONTEXT_RULES,
    buildContextModifiers,
    CITATION_FORMAT,
    formatCitation,
    SAFETY_HIERARCHY,
    requiresEmergencyEscalation,
    FEATURE_TRIGGERS,
    detectFeatureTriggers,
    QUALITY_STANDARDS,
    buildSystemPrompt
};