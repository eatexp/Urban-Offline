/**
 * RAG Pipeline - Retrieval Augmented Generation
 *
 * Connects local LLM to downloaded content for accurate, cited responses.
 *
 * Pipeline:
 * 1. Query understanding & intent detection
 * 2. Retrieve relevant content chunks
 * 3. Build context with retrieved documents
 * 4. Generate response with citations
 */

import { db } from '../db';
import { SearchService } from '../SearchService';
import { SYSTEM_PROMPTS, FALLBACK_TEMPLATES, AI_CONFIG } from './AIArchitecture';
import { AIModelManager } from './AIModelManager';
import { datasetRegistry } from './DatasetRegistry';
import EmbeddingEngine from './EmbeddingEngine';
import { refine } from '../refinery/Refinery';
import { createLogger } from '../../utils/logger';

const log = createLogger('RAGPipeline');

// Generation timeout (30 seconds max)
const GENERATION_TIMEOUT = 30000;

/**
 * RAG Pipeline Service
 */
export const RAGPipeline = {
    // Track if semantic search is available
    _semanticSearchReady: false,
    _embeddingEngine: null,
    _semanticSearchFailed: false,
    _semanticSearchFailureReason: null,

    /**
     * Initialize the RAG pipeline (including semantic search)
     */
    async init() {
        // If we've previously failed, try again
        if (this._semanticSearchFailed) {
            log.info('Retrying semantic search initialization');
            return this.retrySemanticSearch();
        }

        try {
            // Initialize embedding engine for semantic search
            this._embeddingEngine = EmbeddingEngine.getInstance();

            // Try to initialize (downloads model if needed)
            await this._embeddingEngine.initialize((progress, message) => {
                log.debug('Embedding model progress', { progress, message });
            });

            this._semanticSearchReady = this._embeddingEngine.isModelReady();
            this._semanticSearchFailed = false;
            this._semanticSearchFailureReason = null;
            log.info('RAG Pipeline initialized', { semanticSearch: this._semanticSearchReady });

        } catch (error) {
            log.warn('Semantic search unavailable, falling back to keyword search', error);
            this._semanticSearchReady = false;
            this._semanticSearchFailed = true;
            this._semanticSearchFailureReason = error.message;

            // Dispatch event for UI notification
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('semantic-search-failed', {
                    detail: { error: error.message, retryable: true }
                }));
            }

            // Store failure state in ContextManager for settings page
            try {
                const ContextManager = (await import('../context/ContextManager')).default;
                const contextManager = ContextManager.getInstance();
                contextManager.updateState({
                    ai: {
                        semanticSearchFailed: true,
                        semanticSearchError: error.message
                    }
                });
            } catch (contextError) {
                log.debug('Could not update ContextManager with semantic search failure', contextError);
            }
        }
    },

    /**
     * Retry semantic search initialization
     * @returns {Promise<boolean>} - True if retry succeeded
     */
    async retrySemanticSearch() {
        log.info('Attempting to retry semantic search initialization');
        
        try {
            if (!this._embeddingEngine) {
                this._embeddingEngine = EmbeddingEngine.getInstance();
            }

            await this._embeddingEngine.initialize((progress, message) => {
                log.debug('Embedding model retry progress', { progress, message });
            });

            this._semanticSearchReady = this._embeddingEngine.isModelReady();
            this._semanticSearchFailed = false;
            this._semanticSearchFailureReason = null;

            // Dispatch success event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('semantic-search-restored', {
                    detail: { success: true }
                }));
            }

            // Update ContextManager
            try {
                const ContextManager = (await import('../context/ContextManager')).default;
                const contextManager = ContextManager.getInstance();
                contextManager.updateState({
                    ai: {
                        semanticSearchFailed: false,
                        semanticSearchError: null
                    }
                });
            } catch (contextError) {
                log.debug('Could not update ContextManager with semantic search restore', contextError);
            }

            log.info('Semantic search retry succeeded');
            return true;

        } catch (error) {
            log.error('Semantic search retry failed', error);
            
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('semantic-search-failed', {
                    detail: { error: error.message, retryable: true, isRetry: true }
                }));
            }

            return false;
        }
    },

    /**
     * Process a user query and generate a response
     * @param {string} query - User's question
     * @param {Object} options - Generation options
     * @returns {Promise<{response: string, sources: Array, usedFallback: boolean}>}
     */
    async query(query, options = {}) {
        const {
            category = 'general',
            maxSources = AI_CONFIG.rag.maxContextChunks,
            useAI = true,
            datasets = null, // Optional: filter by specific datasets
            stream = false // Enable streaming (returns async generator)
        } = options;

        try {
            // Step 1: Check if this matches a fallback template (for critical emergencies)
            const fallbackResponse = this._checkFallback(query);
            if (fallbackResponse && !useAI) {
                return {
                    response: fallbackResponse.response,
                    sources: [],
                    usedFallback: true,
                    confidence: 0.9
                };
            }

            // Step 2: Retrieve relevant content (with dataset filtering)
            const { results: retrievedDocs, searchMethod } = await this._retrieveContext(query, maxSources, datasets);

            // Step 3: Check if AI model is available
            const modelLoaded = AIModelManager.isModelLoaded();

            if (!modelLoaded || !useAI) {
                // Use fallback: return search results with template
                if (fallbackResponse) {
                    return {
                        response: fallbackResponse.response,
                        sources: retrievedDocs.map(d => ({
                            title: d.title,
                            id: d.id,
                            snippet: d.content?.substring(0, 150) + '...'
                        })),
                        usedFallback: true,
                        confidence: 0.7,
                        searchMethod
                    };
                }

                // Return search-based response
                const searchResponse = this._buildSearchResponse(query, retrievedDocs);
                return { ...searchResponse, searchMethod };
            }

            // Step 4: Build prompt with context (include dataset scope)
            const prompt = this._buildPrompt(query, retrievedDocs, category, datasets);

            // Step 5: Generate response with LLM
            const llmResponse = await this._generateWithLLM(prompt, { stream });

            // Step 6: Parse and format response with citations
            const formattedResponse = this._formatResponse(llmResponse, retrievedDocs);
            return { ...formattedResponse, searchMethod };

        } catch (error) {
            log.error('Query failed', error);

            // Return fallback on error
            const fallback = this._checkFallback(query);
            if (fallback) {
                return {
                    response: fallback.response,
                    sources: [],
                    usedFallback: true,
                    error: error.message
                };
            }

            return {
                response: "I'm sorry, I couldn't process your question. Please try searching for specific topics using the search bar.",
                sources: [],
                usedFallback: true,
                error: error.message
            };
        }
    },

    /**
     * Retrieve relevant content chunks for the query
     * Uses semantic search if available, falls back to keyword search
     * @param {string} query - Search query
     * @param {number} maxResults - Maximum results to return
     * @param {Array} enabledDatasets - Optional array of enabled datasets (null = all)
     * @returns {Promise<{results: Array, searchMethod: string}>}
     */
    async _retrieveContext(query, maxResults = 5, enabledDatasets = null) {
        try {
            // Get enabled dataset stores (for filtering)
            let allowedStores;
            if (enabledDatasets && enabledDatasets.length > 0) {
                // Use provided datasets
                allowedStores = enabledDatasets.map(d => d.store).filter(Boolean);
                log.info('Using dataset filter', {
                    datasets: enabledDatasets.map(d => d.id),
                    stores: allowedStores
                });
            } else {
                // Get from registry (respects user's toggle settings)
                allowedStores = await datasetRegistry.getEnabledStores();
                log.info('Using enabled datasets from registry', { stores: allowedStores });
            }

            let searchResults;
            let searchMethod = 'keyword'; // Track which method was used

            // Try semantic search first if available
            if (this._semanticSearchReady && this._embeddingEngine?.isModelReady()) {
                try {
                    // Get all documents from allowed stores for semantic search
                    const allDocs = await this._getAllDocuments(allowedStores);

                    if (allDocs.length > 0) {
                        const semanticResults = await this._embeddingEngine.semanticSearch(
                            query,
                            allDocs,
                            { topK: maxResults, minScore: AI_CONFIG.rag.minRelevanceScore }
                        );

                        searchResults = semanticResults.map(r => ({
                            ...r.document,
                            score: r.score,
                            semantic: true
                        }));

                        searchMethod = 'semantic';
                        log.info('Semantic search results', { count: searchResults.length });
                    }
                } catch (error) {
                    log.warn('Semantic search failed, falling back to keyword', error);
                    searchMethod = 'keyword_fallback'; // Explicitly mark as fallback
                }
            }

            // Fall back to keyword search if semantic search failed or unavailable
            if (!searchResults || searchResults.length === 0) {
                searchResults = await SearchService.search(query);
                searchMethod = searchMethod === 'keyword_fallback' ? 'keyword_fallback' : 'keyword';
                log.info('Keyword search results', { count: searchResults.length, method: searchMethod });
            }

            // Limit to max results
            const topResults = searchResults.slice(0, maxResults);

            // Fetch full content for each result
            const enrichedResults = await Promise.all(
                topResults.map(async (result) => {
                    try {
                        // Try to get full content from appropriate store
                        const stores = allowedStores.length > 0
                            ? allowedStores
                            : ['health_content', 'survival_content', 'law_content'];

                        for (const store of stores) {
                            try {
                                const content = await db.get(store, result.id || result.slug);
                                if (content) {
                                    return {
                                        ...result,
                                        fullContent: content.content || content.fullText,
                                        store: store
                                    };
                                }
                            } catch (_e) {
                                // Try next store
                            }
                        }

                        return result;
                    } catch (_e) {
                        return result;
                    }
                })
            );

            // Filter out results from disabled stores
            const filteredResults = enrichedResults.filter(result => {
                if (!result.store) return true; // Keep if store not determined
                return allowedStores.length === 0 || allowedStores.includes(result.store);
            });

            log.info('Retrieved context', {
                total: searchResults.length,
                enriched: enrichedResults.length,
                filtered: filteredResults.length,
                searchMethod
            });

            return { results: filteredResults, searchMethod };

        } catch (error) {
            log.error('Retrieval failed', error);
            return { results: [], searchMethod: 'none' };
        }
    },

    /**
     * Get all documents from specified stores (for semantic search)
     */
    async _getAllDocuments(stores) {
        const docs = [];

        for (const store of stores) {
            try {
                const storeContents = await db.getAll(store);
                if (storeContents) {
                    docs.push(...storeContents.map(doc => ({
                        ...doc,
                        store,
                        text: doc.content || doc.fullText || doc.title || ''
                    })));
                }
            } catch (error) {
                log.debug(`Failed to get documents from ${store}`, error);
            }
        }

        return docs;
    },

    /**
     * Check if query matches a fallback template
     */
    _checkFallback(query) {
        const normalizedQuery = query.toLowerCase();

        for (const [_key, template] of Object.entries(FALLBACK_TEMPLATES)) {
            if (template.keywords.some(kw => normalizedQuery.includes(kw))) {
                return template;
            }
        }

        return null;
    },

    /**
     * Build prompt with retrieved context
     * @param {string} query - User query
     * @param {Array} docs - Retrieved documents
     * @param {string} category - Category for system prompt
     * @param {Array} datasets - Enabled datasets (for scope notification)
     */
    _buildPrompt(query, docs, category, datasets = null) {
        let systemPrompt = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.general;

        // Add dataset scope to prompt if filtering is active
        if (datasets && datasets.length > 0) {
            const datasetNames = datasets.map(d => d.name).join(', ');
            systemPrompt += `\n\n**IMPORTANT SCOPE LIMITATION:**
You are currently limited to information from these datasets: ${datasetNames}.
If the user's question requires knowledge outside these datasets, politely inform them and suggest enabling the relevant dataset.`;
        }

        // Build context from documents using The Refinery
        let context = '';
        if (docs.length > 0) {
            // Split token budget evenly across documents
            const perDocBudget = Math.floor(800 / Math.max(docs.length, 1));
            context = '\n\n--- REFERENCE DOCUMENTS ---\n';
            docs.forEach((doc, i) => {
                const content = doc.fullContent || doc.content || doc.description || '';
                // Refine HTML→Semantic Markdown (or pass through plain text)
                const isHTML = content.includes('<') && content.includes('>');
                const refined = isHTML
                    ? refine(content, { tokenBudget: perDocBudget }).markdown
                    : content.substring(0, perDocBudget * 4);
                context += `\n[${i + 1}] "${doc.title}" (Source: ${doc.store || 'unknown'})\n${refined}\n`;
            });
            context += '\n--- END DOCUMENTS ---\n';
        } else if (datasets && datasets.length > 0) {
            // If no docs found and filtering is active, mention it
            context = '\n\n**No relevant documents found in the currently enabled datasets.**\n';
        }




        return `${systemPrompt}

${context}

User Question: ${query}

Please provide a helpful, accurate response. If you use information from the reference documents, cite them using [1], [2], etc.

Response:`;
    },

    /**
     * Generate response using loaded LLM
     * @param {string} prompt - Full prompt with context
     * @param {Object} options - Generation options
     * @param {boolean} options.stream - Whether to return an async generator for streaming
     * @returns {Promise<string>|AsyncGenerator<string>} - Generated text or token stream
     */
    async _generateWithLLM(prompt, options = {}) {
        const engine = AIModelManager.getEngine();

        if (!engine || !engine.isModelLoaded()) {
            throw new Error('LLM not available');
        }

        const { stream = false, onToken = null } = options;

        // If streaming is requested, return async generator
        if (stream) {
            log.info('Starting streaming generation with true token-level streaming');
            return engine.generateStream(prompt, {
                maxTokens: AI_CONFIG.generation.maxTokens,
                temperature: AI_CONFIG.generation.temperature,
                topP: AI_CONFIG.generation.topP,
                stopSequences: AI_CONFIG.generation.stopSequences,
                onToken // Optional callback for immediate UI updates
            });
        }

        // Non-streaming: use timeout protection
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT);
        });

        try {
            // Race generation against timeout
            const response = await Promise.race([
                engine.generate(prompt, {
                    maxTokens: AI_CONFIG.generation.maxTokens,
                    temperature: AI_CONFIG.generation.temperature,
                    topP: AI_CONFIG.generation.topP,
                    stopSequences: AI_CONFIG.generation.stopSequences
                }),
                timeoutPromise
            ]);

            log.info('LLM generation complete', {
                promptLength: prompt.length,
                responseLength: response.length
            });

            return response;

        } catch (error) {
            if (error.message === 'Generation timeout') {
                log.warn('LLM generation timed out');
                throw new Error('Response generation took too long. Please try a simpler question.');
            }
            throw error;
        }
    },

    /**
     * Stream response generation with true token-level streaming
     * @param {string} prompt - Full prompt
     * @param {Object} options - Generation options
     * @param {Function} options.onToken - Callback for each token (for UI updates)
     * @yields {string} - Individual tokens as they're generated
     */
    async *_streamGenerate(prompt, options = {}) {
        const engine = AIModelManager.getEngine();

        if (!engine || !engine.isModelLoaded()) {
            throw new Error('LLM not available');
        }

        yield* engine.generateStream(prompt, {
            maxTokens: AI_CONFIG.generation.maxTokens,
            temperature: AI_CONFIG.generation.temperature,
            topP: AI_CONFIG.generation.topP,
            stopSequences: AI_CONFIG.generation.stopSequences,
            onToken: options.onToken
        });
    },

    /**
     * Build response from search results (fallback mode)
     */
    _buildSearchResponse(query, docs) {
        if (docs.length === 0) {
            return {
                response: `I couldn't find specific information about "${query}" in the downloaded content. Try browsing the Guides section or download more content when online.`,
                sources: [],
                usedFallback: true,
                confidence: 0.3
            };
        }

        let response = `Here's what I found about "${query}":\n\n`;

        docs.slice(0, 3).forEach((doc, i) => {
            const snippet = doc.description || doc.content?.substring(0, 200) || '';
            response += `**${i + 1}. ${doc.title}**\n${snippet}...\n\n`;
        });

        response += `\n*Tap on any article to read more details.*`;

        return {
            response,
            sources: docs.map(d => ({
                title: d.title,
                id: d.id || d.slug,
                category: d.category
            })),
            usedFallback: true,
            confidence: 0.6
        };
    },

    /**
     * Format LLM response with proper citations
     */
    _formatResponse(llmResponse, docs) {
        // Extract citation references from response
        const citations = [];
        const citationRegex = /\[(\d+)\]/g;
        let match;

        while ((match = citationRegex.exec(llmResponse)) !== null) {
            const index = parseInt(match[1]) - 1;
            if (docs[index] && !citations.find(c => c.index === index)) {
                citations.push({
                    index,
                    title: docs[index].title,
                    id: docs[index].id || docs[index].slug,
                    store: docs[index].store, // Important for SourceViewer
                    category: docs[index].category
                });
            }
        }

        return {
            response: llmResponse,
            sources: citations.length > 0
                ? citations
                : docs.slice(0, 3).map((d, i) => ({
                    index: i,
                    title: d.title,
                    id: d.id || d.slug,
                    store: d.store,
                    category: d.category
                })),
            usedFallback: false,
            confidence: 0.8
        };
    },

    /**
     * Get suggested follow-up questions
     */
    getSuggestedQuestions(topic) {
        const suggestions = {
            medical: [
                "How do I perform CPR?",
                "What are the signs of a stroke?",
                "How do I treat a burn?",
                "What should I do if someone is choking?"
            ],
            survival: [
                "How do I purify water?",
                "How do I build an emergency shelter?",
                "What are the signs of hypothermia?",
                "How do I signal for rescue?"
            ],
            legal: [
                "What are my rights if arrested?",
                "Can police search my phone?",
                "What is PACE Code C?",
                "Do I have to give my name to police?"
            ]
        };

        return suggestions[topic] || suggestions.medical;
    },

    /**
     * Process a query with stage-by-stage event callbacks for visualization.
     * Does NOT change existing query() behavior — this is an additive method.
     *
     * @param {string} query - User's question
     * @param {Object} options - Same options as query()
     * @param {Function} onStage - Callback: ({ stage, data, progress }) => void
     *   Stages: 'intent' | 'retrieval' | 'context' | 'generation'
     * @returns {Promise<{response: string, sources: Array, usedFallback: boolean}>}
     */
    async queryWithEvents(query, options = {}, onStage) {
        const {
            category = 'general',
            maxSources = AI_CONFIG.rag.maxContextChunks,
            useAI = true,
            datasets = null,
            stream = false
        } = options;

        const emit = (stage, data, progress) => {
            if (onStage) {
                try { onStage({ stage, data, progress }); } catch (_) { /* ignore */ }
            }
        };

        try {
            // Stage 1: Intent classification
            const fallbackResponse = this._checkFallback(query);
            const intentCategory = category;
            emit('intent', {
                classification: intentCategory,
                hasFallback: !!fallbackResponse,
                confidence: fallbackResponse ? 0.9 : 0.7
            }, 100);

            if (fallbackResponse && !useAI) {
                emit('generation', {
                    fullText: fallbackResponse.response,
                    citations: [],
                    usedFallback: true
                }, 100);
                return {
                    response: fallbackResponse.response,
                    sources: [],
                    usedFallback: true,
                    confidence: 0.9
                };
            }

            // Stage 2: Retrieval
            emit('retrieval', { query, sources: [] }, 0);
            const { results: retrievedDocs, searchMethod } = await this._retrieveContext(query, maxSources, datasets);

            const sourceSummaries = retrievedDocs.map((d, i) => ({
                index: i,
                title: d.title || 'Untitled',
                store: d.store || 'unknown',
                score: d.score || 0,
                snippet: (d.content || d.description || '').substring(0, 120)
            }));

            emit('retrieval', {
                query,
                sources: sourceSummaries,
                searchMethod,
                count: retrievedDocs.length
            }, 100);

            // Stage 2.5: Refinery — distill HTML→Semantic Markdown
            const perDocBudget = Math.floor(800 / Math.max(retrievedDocs.length, 1));
            const refineryResults = retrievedDocs.map(doc => {
                const content = doc.fullContent || doc.content || doc.description || '';
                const isHTML = content.includes('<') && content.includes('>');
                if (isHTML) {
                    return refine(content, { tokenBudget: perDocBudget });
                }
                return { markdown: content.substring(0, perDocBudget * 4), meta: { charsBefore: content.length, charsAfter: Math.min(content.length, perDocBudget * 4), compressionRatio: 1 } };
            });

            const avgRatio = refineryResults.reduce((sum, r) => sum + (r.meta?.compressionRatio || 1), 0) / Math.max(refineryResults.length, 1);
            const totalCharsBefore = refineryResults.reduce((sum, r) => sum + (r.meta?.charsBefore || 0), 0);
            const totalCharsAfter = refineryResults.reduce((sum, r) => sum + (r.meta?.charsAfter || 0), 0);

            emit('refinery', {
                documentsRefined: refineryResults.length,
                avgCompressionRatio: avgRatio.toFixed(3),
                totalCharsBefore,
                totalCharsAfter,
                tokensSaved: Math.floor((totalCharsBefore - totalCharsAfter) / 4)
            }, 100);

            // Stage 3: Context assembly
            const chunks = retrievedDocs.map((doc, i) => {
                const refined = refineryResults[i];
                return {
                    index: i,
                    title: doc.title || 'Untitled',
                    store: doc.store || 'unknown',
                    score: doc.score || 0,
                    length: refined.markdown.length,
                    preview: refined.markdown.substring(0, 200)
                };
            });

            emit('context', {
                chunks,
                scores: chunks.map(c => c.score),
                totalTokensEstimate: chunks.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0)
            }, 100);

            // Check if AI model is available
            const modelLoaded = AIModelManager.isModelLoaded();

            if (!modelLoaded || !useAI) {
                // Fallback: search-based response
                const searchResponse = fallbackResponse
                    ? {
                        response: fallbackResponse.response,
                        sources: retrievedDocs.map(d => ({
                            title: d.title,
                            id: d.id,
                            snippet: d.content?.substring(0, 150) + '...'
                        })),
                        usedFallback: true,
                        confidence: 0.7
                    }
                    : this._buildSearchResponse(query, retrievedDocs);

                emit('generation', {
                    fullText: searchResponse.response,
                    citations: searchResponse.sources || [],
                    usedFallback: true
                }, 100);

                return { ...searchResponse, searchMethod };
            }

            // Stage 4: Generation
            const prompt = this._buildPrompt(query, retrievedDocs, category, datasets);
            emit('generation', { fullText: '', citations: [], generating: true }, 0);

            const llmResponse = await this._generateWithLLM(prompt, { stream });

            // Parse citations
            const formattedResponse = this._formatResponse(llmResponse, retrievedDocs);

            emit('generation', {
                fullText: formattedResponse.response,
                citations: formattedResponse.sources,
                usedFallback: false
            }, 100);

            return { ...formattedResponse, searchMethod };

        } catch (error) {
            log.error('queryWithEvents failed', error);

            const fallback = this._checkFallback(query);
            const errorResponse = fallback
                ? { response: fallback.response, sources: [], usedFallback: true, error: error.message }
                : {
                    response: "I'm sorry, I couldn't process your question. Please try searching for specific topics using the search bar.",
                    sources: [],
                    usedFallback: true,
                    error: error.message
                };

            emit('generation', {
                fullText: errorResponse.response,
                citations: [],
                usedFallback: true,
                error: error.message
            }, 100);

            return errorResponse;
        }
    },

    /**
     * Check if semantic search is available
     */
    isSemanticSearchReady() {
        return this._semanticSearchReady;
    }
};

export default RAGPipeline;
