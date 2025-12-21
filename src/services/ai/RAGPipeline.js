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
import { createLogger } from '../../utils/logger';

const log = createLogger('RAGPipeline');

/**
 * RAG Pipeline Service
 */
export const RAGPipeline = {
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
            useAI = true
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

            // Step 2: Retrieve relevant content
            const retrievedDocs = await this._retrieveContext(query, maxSources);

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
                        confidence: 0.7
                    };
                }

                // Return search-based response
                return this._buildSearchResponse(query, retrievedDocs);
            }

            // Step 4: Build prompt with context
            const prompt = this._buildPrompt(query, retrievedDocs, category);

            // Step 5: Generate response with LLM
            const llmResponse = await this._generateWithLLM(prompt);

            // Step 6: Parse and format response with citations
            return this._formatResponse(llmResponse, retrievedDocs);

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
     */
    async _retrieveContext(query, maxResults = 5) {
        try {
            // Use existing search service
            const searchResults = await SearchService.search(query);
            
            // Limit to max results
            const topResults = searchResults.slice(0, maxResults);

            // Fetch full content for each result
            const enrichedResults = await Promise.all(
                topResults.map(async (result) => {
                    try {
                        // Try to get full content from appropriate store
                        const stores = ['health_content', 'survival_content', 'law_content'];
                        
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

            return enrichedResults;

        } catch (error) {
            log.error('Retrieval failed', error);
            return [];
        }
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
     */
    _buildPrompt(query, docs, category) {
        const systemPrompt = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.general;

        // Build context from documents
        let context = '';
        if (docs.length > 0) {
            context = '\n\n--- REFERENCE DOCUMENTS ---\n';
            docs.forEach((doc, i) => {
                const content = doc.fullContent || doc.content || doc.description || '';
                // Truncate long content
                const truncated = content.length > 1000 
                    ? content.substring(0, 1000) + '...' 
                    : content;
                context += `\n[${i + 1}] "${doc.title}"\n${truncated}\n`;
            });
            context += '\n--- END DOCUMENTS ---\n';
        }

        return `${systemPrompt}

${context}

User Question: ${query}

Please provide a helpful, accurate response. If you use information from the reference documents, cite them using [1], [2], etc.

Response:`;
    },

    /**
     * Generate response using loaded LLM
     */
    async _generateWithLLM(_prompt) {
        // In production, this would call the actual LLM engine:
        // const engine = AIModelManager._engine;
        // const response = await engine.chat.completions.create({
        //     messages: [{ role: "user", content: prompt }],
        //     temperature: AI_CONFIG.generation.temperature,
        //     max_tokens: AI_CONFIG.generation.maxTokens
        // });
        // return response.choices[0].message.content;

        // Placeholder: return structured response
        return `Based on the available information, here's what I can tell you:

This is a placeholder response. In the full implementation, this would be generated by the local LLM using the provided context.

The response would include:
- Relevant information from the retrieved documents
- Clear, actionable guidance
- Source citations [1][2] linking to the original articles

⚠️ **Important:** For medical emergencies, always call emergency services (999/911) first.`;
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
                    id: docs[index].id || docs[index].slug
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
                    id: d.id || d.slug
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
    }
};

export default RAGPipeline;

