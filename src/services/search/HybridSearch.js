/**
 * HybridSearch - Combines keyword search with intent routing
 * 
 * Features:
 * - Intent detection via Unified IntentClassifier (Keywords + ML)
 * - Category-aware search ranking
 * - Synonym expansion
 * - Emergency keyword prioritization
 * 
 * VERIFIED: [Consistency] UNIFIED_INTENT_CLASSIFIER
 * - Uses IntentClassifier.classifyIntent() for ML + keyword classification
 * - Shares EMERGENCY_PATTERNS from config/intentPatterns.js
 * - TriageRouter also uses same EMERGENCY_PATTERNS - unified system
 * - VERIFIED 2026-02-02
 */

import { SearchService } from '../SearchService';
import { createLogger } from '../../utils/logger';
import { IntentClassifier } from '../ai/IntentClassifier';

const log = createLogger('HybridSearch');

// Synonym expansion for better search coverage
const SYNONYMS = IntentClassifier.SYNONYMS;

// Search Cache Configuration
const SEARCH_CACHE = new Map();
const CACHE_MAX_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hybrid Search Service
 */
export const HybridSearchService = {
    /**
     * Detect intent from query (Async)
     * @param {string} query 
     * @returns {Promise<Object|null>} Detected intent or null
     */
    async detectIntent(query) {
        try {
            const result = await IntentClassifier.classifyIntent(query);

            // Filter out low confidence or general queries
            if (result.type === 'general' || result.confidence < 0.3) {
                return null;
            }

            return {
                id: result.type, // e.g. 'medical_critical'
                category: result.category,
                priority: result.urgency, // Kept for backward compatibility if needed
                urgency: result.urgency,  // Required by Search.jsx for styling
                suggestedAction: result.route, // 'triage', 'search', 'protocol'
                triageFlow: result.triageStory,
                protocolId: result.protocolId,
                // Mapped properties for Search.jsx alerts with null coalescing for safety
                message: result.message ?? 'Emergency detected',
                cta: result.cta ?? 'Get Help',
                score: result.confidence * 10
            };
        } catch (e) {
            log.warn('Intent detection failed', e);
            return null;
        }
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
        const cacheKey = `${query}|${JSON.stringify(options)}`;
        const cached = SEARCH_CACHE.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            log.debug(`Cache hit for query: "${query}"`);
            return cached.result;
        }

        const {
            limit = 20,
            category = null,
            includeIntentRouting = true
        } = options;

        // Step 1: Detect intent (Unified Classifier)
        let intent = null;
        if (includeIntentRouting) {
            intent = await this.detectIntent(query);
        }

        // Step 2: Expand query with synonyms
        const expandedQueries = this.expandQuery(query);

        // Step 3: Perform keyword search
        const allResults = [];
        const seenIds = new Set();

        // Parallelize search if possible, but sequential for now to preserve order preference
        const failedQueries = [];
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
            } catch (e) {
                log.warn('Search query failed', expandedQuery, e);
                failedQueries.push({ query: expandedQuery, error: e.message });
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

        const finalResult = {
            results: limitedResults,
            intent: intent,
            query: query,
            expandedQueries: expandedQueries,
            totalResults: allResults.length,
            suggestedAction: intent?.suggestedAction || 'search',
            triageFlow: intent?.triageFlow || null,
            protocolId: intent?.protocolId || null,
            failedQueries: failedQueries,
            hasPartialResults: failedQueries.length > 0
        };

        // Cache result
        if (SEARCH_CACHE.size >= CACHE_MAX_SIZE) {
            const oldestKey = SEARCH_CACHE.keys().next().value;
            SEARCH_CACHE.delete(oldestKey);
        }
        SEARCH_CACHE.set(cacheKey, { result: finalResult, timestamp: Date.now() });

        return finalResult;
    },

    /**
     * Get search suggestions based on partial query
     * Uses IntentClassifier's shared patterns.
     * @param {string} partial 
     * @returns {string[]}
     */
    getSuggestions(partial) {
        const normalizedPartial = partial.toLowerCase();
        const suggestions = [];

        // Check intent patterns for matches
        // Accessing the static EMERGENCY_PATTERNS from the unified classifier
        for (const pattern of Object.values(IntentClassifier.EMERGENCY_PATTERNS)) {
            for (const keyword of pattern.keywords) {
                if (keyword.startsWith(normalizedPartial) &&
                    !suggestions.includes(keyword)) {
                    suggestions.push(keyword);
                }
            }
        }

        // Add common emergency queries (supplementary)
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
        // Use IntentClassifier patterns for consistent related searches
        const related = [];
        const normalizedQuery = query.toLowerCase();

        // Check all emergency patterns for keyword matches
        for (const [_type, pattern] of Object.entries(IntentClassifier.EMERGENCY_PATTERNS)) {
            const matches = pattern.keywords.filter(kw =>
                normalizedQuery.includes(kw.toLowerCase()) ||
                kw.toLowerCase().includes(normalizedQuery)
            );

            if (matches.length > 0) {
                // Add related keywords from the same pattern
                pattern.keywords.forEach(kw => {
                    if (!related.includes(kw) && kw.length > 3) {
                        related.push(kw);
                    }
                });
            }
        }

        // Add common emergency queries if no specific matches
        if (related.length === 0) {
            const commonQueries = [
                'first aid basics',
                'emergency contacts',
                'survival guide',
                'cpr instructions',
                'how to stop bleeding',
                'legal rights'
            ];
            related.push(...commonQueries);
        }

        return related.slice(0, 5);
    }
};

export default HybridSearchService;

