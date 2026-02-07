// Shared configuration for intent classification
// Used by IntentClassifier.js, TriageRouter.js, and classifier.worker.js

// ============================================================================
// TRIAGE STORY DEFINITIONS
// Each story is a separate entry so getStoriesByCategory() can find them
// ============================================================================

export const TRIAGE_STORIES = {
    // ─────────────────────────────────────────────────────────────────────────
    // HEALTH / MEDICAL STORIES
    // ─────────────────────────────────────────────────────────────────────────
    'health_cpr': {
        keywords: ['cpr', 'not breathing', 'heart stopped', 'cardiac arrest', 'no pulse', 'resuscitation'],
        urgency: 10,
        category: 'health',
        route: 'triage',
        triageStory: 'health/cpr.ink.json',
        title: 'CPR & Cardiac Arrest',
        description: 'Cardiopulmonary resuscitation for unresponsive victims.',
        icon: 'HeartPulse'
    },
    'health_choking': {
        keywords: ['choking', 'cannot breathe', 'can\'t breathe', 'airway blocked', 'heimlich'],
        urgency: 10,
        category: 'health',
        route: 'triage',
        triageStory: 'health/choking.ink.json',
        title: 'Choking Emergency',
        description: 'Heimlich maneuver and airway obstruction.',
        icon: 'AlertCircle'
    },
    'health_severe_bleeding': {
        keywords: ['bleeding heavily', 'severe bleeding', 'arterial bleeding', 'blood everywhere', 'deep cut', 'stab wound'],
        urgency: 9,
        category: 'health',
        route: 'triage',
        triageStory: 'health/severe-bleeding.ink.json',
        title: 'Severe Bleeding Control',
        description: 'Control severe bleeding and apply pressure.',
        icon: 'Droplets'
    },
    'health_burns': {
        keywords: ['burn', 'burned', 'scalded', 'chemical burn', 'thermal burn'],
        urgency: 8,
        category: 'health',
        route: 'triage',
        triageStory: 'medical/burns-assessment.ink.json',
        title: 'Burns Assessment',
        description: 'Assess burn severity and treat appropriately.',
        icon: 'Flame'
    },
    'health_heat_illness': {
        keywords: ['heat stroke', 'heat exhaustion', 'overheating', 'hyperthermia', 'too hot'],
        urgency: 8,
        category: 'health',
        route: 'triage',
        triageStory: 'medical/heat-illness.ink.json',
        title: 'Heat Illness',
        description: 'Heat stroke and heat exhaustion treatment.',
        icon: 'Thermometer'
    },
    'health_stroke': {
        keywords: ['stroke', 'face drooping', 'slurred speech', 'arm weakness', 'fast'],
        urgency: 10,
        category: 'health',
        route: 'triage',
        triageStory: 'medical/stroke-recognition.ink.json',
        title: 'Stroke Recognition',
        description: 'FAST stroke recognition and response.',
        icon: 'Brain'
    },
    'health_hypothermia': {
        keywords: ['hypothermia', 'freezing', 'very cold', 'blue lips', 'shivering', 'cold exposure'],
        urgency: 8,
        category: 'health',
        route: 'triage',
        triageStory: 'hypothermia.ink.json',
        title: 'Hypothermia Triage',
        description: 'Assess and treat cold exposure.',
        icon: 'Thermometer'
    },

    // ─────────────────────────────────────────────────────────────────────────
    // LEGAL STORIES
    // ─────────────────────────────────────────────────────────────────────────
    'legal_arrest': {
        keywords: ['arrested', 'under arrest', 'being arrested', 'police arresting', 'taken into custody'],
        urgency: 7,
        category: 'legal',
        route: 'triage',
        triageStory: 'legal/arrest-rights.ink.json',
        title: 'Arrest Rights',
        description: 'Your rights upon arrest and during custody.',
        icon: 'Shield'
    },
    'legal_stop_search': {
        keywords: ['stop and search', 'stopped by police', 'police stop', 'search me', 'can they search', 'gowisely'],
        urgency: 7,
        category: 'legal',
        route: 'triage',
        triageStory: 'legal/stop-and-search.ink.json',
        title: 'Stop & Search (GOWISELY)',
        description: 'Know your rights during police stop and search.',
        icon: 'Search'
    },
    'legal_custody': {
        keywords: ['custody', 'detained', 'being held', 'police station', 'custody rights'],
        urgency: 7,
        category: 'legal',
        route: 'triage',
        triageStory: 'legal/custody-rights.ink.json',
        title: 'Custody Welfare',
        description: 'Welfare rights and procedures in custody.',
        icon: 'Gavel'
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SURVIVAL STORIES
    // ─────────────────────────────────────────────────────────────────────────
    'survival_fire': {
        keywords: ['start fire', 'make fire', 'fire starting', 'fire making', 'campfire', 'no heat'],
        urgency: 6,
        category: 'survival',
        route: 'triage',
        triageStory: 'survival/fire-making.ink.json',
        title: 'Fire Making',
        description: 'Start a fire for warmth and signaling.',
        icon: 'Flame'
    },
    'survival_shelter': {
        keywords: ['shelter', 'build shelter', 'find shelter', 'emergency shelter', 'sleep outside'],
        urgency: 6,
        category: 'survival',
        route: 'triage',
        triageStory: 'survival/shelter-building.ink.json',
        title: 'Shelter Building',
        description: 'Build emergency shelter for protection.',
        icon: 'Tent'
    },
    'survival_water': {
        keywords: ['water purification', 'purify water', 'clean water', 'safe water', 'no water', 'dehydration'],
        urgency: 7,
        category: 'survival',
        route: 'triage',
        triageStory: 'survival/water-purification.ink.json',
        title: 'Water Purification',
        description: 'Find, purify, and store safe drinking water.',
        icon: 'Droplets'
    },
    'survival_signaling': {
        keywords: ['signal for help', 'signaling', 'rescue signal', 'sos', 'attract attention'],
        urgency: 6,
        category: 'survival',
        route: 'triage',
        triageStory: 'survival/signaling.ink.json',
        title: 'Emergency Signaling',
        description: 'Signal for rescue and attract attention.',
        icon: 'Radio'
    }
};

// ============================================================================
// EMERGENCY PATTERNS (for intent classification)
// These are broader patterns for the AI classifier
// ============================================================================

export const EMERGENCY_PATTERNS = {
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
        triageStory: 'health/cpr.ink.json', // Default for critical
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
        triageStory: 'health/severe-bleeding.ink.json', // Default for severe
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
        triageStory: 'survival/water-purification.ink.json', // Default
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
        triageStory: 'legal/arrest-rights.ink.json', // Default
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

export const LABEL_TO_TYPE_MAP = {
    'immediate medical emergency': 'medical_critical',
    'severe injury': 'medical_severe',
    'medical question': 'medical_query',
    'immediate danger': 'survival_critical',
    'survival preparation': 'survival_prep',
    'legal emergency': 'legal_immediate',
    'legal question': 'legal_query'
};

export const CANDIDATE_LABELS_TEXT = Object.keys(LABEL_TO_TYPE_MAP);
