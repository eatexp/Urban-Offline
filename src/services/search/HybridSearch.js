/**
 * HybridSearch - Combines keyword search with intent routing
 * 
 * Features:
 * - Intent detection for emergency queries
 * - Category-aware search ranking
 * - Synonym expansion
 * - Emergency keyword prioritization
 */

import { SearchService } from '../SearchService';
import { createLogger } from '../../utils/logger';

const log = createLogger('HybridSearch');

// Intent patterns for routing queries
const INTENT_PATTERNS = {
    // Medical emergencies - highest priority
    'emergency.medical.cpr': {
        patterns: ['cpr', 'resuscitation', 'heart stopped', 'not breathing', 'cardiac arrest'],
        category: 'health',
        priority: 10,
        suggestedAction: 'triage',
        triageFlow: 'cpr-emergency.ink.json'
    },
    'emergency.medical.choking': {
        patterns: ['choking', 'cannot breathe', 'object stuck', 'heimlich', 'airway blocked'],
        category: 'health',
        priority: 10,
        suggestedAction: 'triage',
        triageFlow: 'choking-emergency.ink.json'
    },
    'emergency.medical.bleeding': {
        patterns: ['bleeding', 'blood loss', 'hemorrhage', 'tourniquet', 'wound', 'cut'],
        category: 'health',
        priority: 9,
        suggestedAction: 'search'
    },
    'emergency.medical.stroke': {
        patterns: ['stroke', 'face drooping', 'arm weakness', 'slurred speech', 'fast'],
        category: 'health',
        priority: 10,
        suggestedAction: 'triage',
        triageFlow: 'stroke-recognition.ink.json'
    },
    'emergency.medical.burn': {
        patterns: ['burn', 'burned', 'scalded', 'fire injury'],
        category: 'health',
        priority: 8,
        suggestedAction: 'search'
    },
    'emergency.medical.fracture': {
        patterns: ['broken bone', 'fracture', 'broke', 'splint'],
        category: 'health',
        priority: 7,
        suggestedAction: 'search'
    },
    
    // Environmental emergencies
    'emergency.environmental.hypothermia': {
        patterns: ['hypothermia', 'freezing', 'cold exposure', 'shivering', 'frostbite'],
        category: 'survival',
        priority: 8,
        suggestedAction: 'triage',
        triageFlow: 'hypothermia.ink.json'
    },
    'emergency.environmental.heat': {
        patterns: ['heat stroke', 'heat exhaustion', 'overheating', 'too hot'],
        category: 'survival',
        priority: 8,
        suggestedAction: 'search'
    },
    
    // Legal queries
    'legal.arrest': {
        patterns: ['arrested', 'arrest', 'police custody', 'detained'],
        category: 'law',
        priority: 7,
        suggestedAction: 'search'
    },
    'legal.rights': {
        patterns: ['rights', 'pace code', 'solicitor', 'lawyer', 'legal aid'],
        category: 'law',
        priority: 6,
        suggestedAction: 'search'
    },
    'legal.search': {
        patterns: ['search me', 'stop and search', 'police search'],
        category: 'law',
        priority: 6,
        suggestedAction: 'search'
    },
    
    // Survival queries
    'survival.water': {
        patterns: ['purify water', 'clean water', 'drinking water', 'water purification', 'safe water'],
        category: 'survival',
        priority: 5,
        suggestedAction: 'search'
    },
    'survival.shelter': {
        patterns: ['shelter', 'emergency shelter', 'build shelter', 'homeless'],
        category: 'survival',
        priority: 5,
        suggestedAction: 'search'
    },
    'survival.navigation': {
        patterns: ['lost', 'navigate', 'direction', 'compass', 'find way'],
        category: 'survival',
        priority: 4,
        suggestedAction: 'search'
    }
};

// Synonym expansion for better search coverage
const SYNONYMS = {
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

/**
 * Hybrid Search Service
 */
export const HybridSearchService = {
    /**
     * Detect intent from query
     * @param {string} query 
     * @returns {Object|null} Detected intent or null
     */
    detectIntent(query) {
        const normalizedQuery = query.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [intentId, intent] of Object.entries(INTENT_PATTERNS)) {
            let matchScore = 0;
            
            for (const pattern of intent.patterns) {
                if (normalizedQuery.includes(pattern)) {
                    // Longer matches score higher
                    matchScore += pattern.length * intent.priority;
                }
            }

            if (matchScore > bestScore) {
                bestScore = matchScore;
                bestMatch = {
                    id: intentId,
                    ...intent,
                    score: matchScore
                };
            }
        }

        return bestMatch;
    },

    /**
     * Expand query with synonyms
     * @param {string} query 
     * @returns {string[]} Array of expanded queries
     */
    expandQuery(query) {
        const normalizedQuery = query.toLowerCase();
        const expandedQueries = [query];

        for (const [term, syns] of Object.entries(SYNONYMS)) {
            if (normalizedQuery.includes(term)) {
                for (const syn of syns) {
                    expandedQueries.push(query.replace(new RegExp(term, 'gi'), syn));
                }
            }
        }

        return expandedQueries;
    },

    /**
     * Perform hybrid search with intent routing
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results with metadata
     */
    async search(query, options = {}) {
        const {
            limit = 20,
            category = null,
            includeIntentRouting = true
        } = options;

        // Step 1: Detect intent
        let intent = null;
        if (includeIntentRouting) {
            intent = this.detectIntent(query);
        }

        // Step 2: Expand query with synonyms
        const expandedQueries = this.expandQuery(query);

        // Step 3: Perform keyword search
        const allResults = [];
        const seenIds = new Set();

        for (const expandedQuery of expandedQueries) {
            try {
                const results = await SearchService.search(expandedQuery);
                
                for (const result of results) {
                    if (!seenIds.has(result.id)) {
                        seenIds.add(result.id);
                        allResults.push({
                            ...result,
                            matchedQuery: expandedQuery
                        });
                    }
                }
            } catch (_e) {
                log.warn('Search query failed', expandedQuery);
            }
        }

        // Step 4: Score and rank results
        const scoredResults = allResults.map(result => {
            let score = 0;

            // Base relevance score
            score += 1;

            // Category match bonus
            if (intent && result.category === intent.category) {
                score += 3;
            }

            // Requested category filter
            if (category && result.category === category) {
                score += 2;
            }

            // Title match bonus
            if (result.title && query.toLowerCase().split(' ').some(word => 
                result.title.toLowerCase().includes(word)
            )) {
                score += 2;
            }

            return {
                ...result,
                relevanceScore: score
            };
        });

        // Sort by score
        scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Limit results
        const limitedResults = scoredResults.slice(0, limit);

        return {
            results: limitedResults,
            intent: intent,
            query: query,
            expandedQueries: expandedQueries,
            totalResults: allResults.length,
            suggestedAction: intent?.suggestedAction || 'search',
            triageFlow: intent?.triageFlow || null
        };
    },

    /**
     * Get search suggestions based on partial query
     * @param {string} partial 
     * @returns {string[]}
     */
    getSuggestions(partial) {
        const normalizedPartial = partial.toLowerCase();
        const suggestions = [];

        // Check intent patterns for matches
        for (const intent of Object.values(INTENT_PATTERNS)) {
            for (const pattern of intent.patterns) {
                if (pattern.startsWith(normalizedPartial) && 
                    !suggestions.includes(pattern)) {
                    suggestions.push(pattern);
                }
            }
        }

        // Add common emergency queries
        const commonQueries = [
            'how to do cpr',
            'what to do if someone is choking',
            'how to stop bleeding',
            'signs of a stroke',
            'how to treat a burn',
            'my rights if arrested',
            'how to purify water'
        ];

        for (const query of commonQueries) {
            if (query.includes(normalizedPartial) && !suggestions.includes(query)) {
                suggestions.push(query);
            }
        }

        return suggestions.slice(0, 5);
    },

    /**
     * Get related searches based on current query
     * @param {string} query 
     * @returns {string[]}
     */
    getRelatedSearches(query) {
        const intent = this.detectIntent(query);
        
        if (!intent) {
            return [
                'first aid basics',
                'emergency contacts',
                'survival guide'
            ];
        }

        const relatedByCategory = {
            'health': [
                'recovery position',
                'emergency phone numbers',
                'when to call 999',
                'basic first aid kit'
            ],
            'law': [
                'right to silence',
                'solicitor contact',
                'police complaints',
                'legal aid eligibility'
            ],
            'survival': [
                'emergency shelter types',
                'food safety',
                'signaling for help',
                'fire starting'
            ]
        };

        return relatedByCategory[intent.category] || [];
    }
};

export default HybridSearchService;

