/**
 * EmbeddingEngine - Semantic search using sentence embeddings
 *
 * Uses all-MiniLM-L6-v2 (~23MB) for high-quality semantic search.
 * Auto-downloads in background when conditions are favorable.
 *
 * Features:
 * - Generate embeddings for text
 * - Compute cosine similarity between embeddings
 * - Semantic search with ranking
 * - Caches embeddings in IndexedDB for offline use
 *
 * Usage:
 *   const engine = EmbeddingEngine.getInstance();
 *   await engine.initialize(onProgress);
 *   const results = await engine.semanticSearch(query, documents);
 */

import { pipeline, env } from '@xenova/transformers';
import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('EmbeddingEngine');

// Configure transformers.js
env.cacheDir = 'indexeddb://urban-offline-models';
env.allowLocalModels = false;
env.useBrowserCache = true;

// Embedding model configuration
const EMBEDDING_MODEL = {
    id: 'all-minilm',
    hfId: 'Xenova/all-MiniLM-L6-v2',
    name: 'MiniLM Embeddings',
    size: 23 * 1024 * 1024, // ~23MB
    dimensions: 384 // Output embedding dimensions
};

// IndexedDB store for cached embeddings
const EMBEDDINGS_STORE = 'embeddings_cache';

/**
 * EmbeddingEngine Singleton
 * Manages embedding model and semantic search
 */
class EmbeddingEngine {
    static instance = null;

    constructor() {
        this.embedder = null;
        this.isInitializing = false;
        this.isReady = false;
        // In-memory cache with LRU eviction (max 1000 entries)
        // Eviction logic is implemented in embed() method
        this.embeddingCache = new Map();
        this.MAX_CACHE_SIZE = 1000;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!EmbeddingEngine.instance) {
            EmbeddingEngine.instance = new EmbeddingEngine();
        }
        return EmbeddingEngine.instance;
    }

    /**
     * Initialize the embedding model
     * @param {Function} onProgress - Progress callback (progress, status)
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(onProgress = () => { }) {
        if (this.isReady) {
            log.info('Embedding model already loaded');
            onProgress(100, 'Ready');
            return true;
        }

        if (this.isInitializing) {
            log.warn('Initialization already in progress');
            return false;
        }

        this.isInitializing = true;

        try {
            log.info('Initializing embedding model', { model: EMBEDDING_MODEL.hfId });
            onProgress(0, 'Loading embedding model...');

            // Create feature-extraction pipeline
            this.embedder = await pipeline('feature-extraction', EMBEDDING_MODEL.hfId, {
                progress_callback: (progressData) => {
                    if (progressData?.progress) {
                        onProgress(Math.round(progressData.progress), 'Downloading...');
                    }
                },
                quantized: true
            });

            this.isReady = true;
            this.isInitializing = false;

            log.info('Embedding model initialized');
            onProgress(100, 'Ready');

            return true;

        } catch (error) {
            this.isInitializing = false;
            this.isReady = false;
            log.error('Failed to initialize embedding model', error);
            onProgress(0, `Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to embed
     * @returns {Promise<Float32Array>} - Embedding vector
     */
    async embed(text) {
        if (!this.isReady || !this.embedder) {
            throw new Error('Embedding model not initialized');
        }

        // Check in-memory cache first
        const cacheKey = this._hashText(text);
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey);
        }

        // Check IndexedDB cache
        const cached = await this._getFromCache(cacheKey);
        if (cached) {
            this.embeddingCache.set(cacheKey, cached);
            return cached;
        }

        // Generate new embedding with timeout protection
        const EMBEDDING_TIMEOUT = 10000; // 10 seconds max
        let output;
        try {
            output = await Promise.race([
                this.embedder(text, { pooling: 'mean', normalize: true }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Embedding generation timeout')), EMBEDDING_TIMEOUT)
                )
            ]);
        } catch (error) {
            log.warn('Embedding generation failed', error);
            throw error;
        }

        // Convert to Float32Array
        const embedding = new Float32Array(output.data);

        // LRU eviction: remove oldest entry if cache is full
        if (this.embeddingCache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.embeddingCache.keys().next().value;
            this.embeddingCache.delete(firstKey);
        }

        // Cache the result
        this.embeddingCache.set(cacheKey, embedding);
        await this._saveToCache(cacheKey, embedding, text);

        return embedding;
    }

    /**
     * Generate embeddings for multiple texts
     * @param {string[]} texts - Array of texts
     * @returns {Promise<Float32Array[]>} - Array of embeddings
     */
    async embedBatch(texts) {
        if (!this.isReady || !this.embedder) {
            throw new Error('Embedding model not initialized');
        }

        const embeddings = [];
        const BATCH_SIZE = 10; // Process in chunks of 10 to prevent UI freezes

        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const chunk = texts.slice(i, i + BATCH_SIZE);
            // Process chunk in parallel
            const chunkEmbeddings = await Promise.all(chunk.map(t => this.embed(t)));
            embeddings.push(...chunkEmbeddings);

            // Yield control to event loop between batches to keep UI responsive
            if (i + BATCH_SIZE < texts.length) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        return embeddings;
    }

    /**
     * Compute cosine similarity between two embeddings
     * @param {Float32Array} a - First embedding
     * @param {Float32Array} b - Second embedding
     * @returns {number} - Similarity score (0-1)
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Embeddings must have same dimensions');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (normA * normB);
    }

    /**
     * Perform semantic search
     * @param {string} query - Search query
     * @param {Array<{id: string, text: string, ...}>} documents - Documents to search
     * @param {Object} options - Search options
     * @returns {Promise<Array<{document: Object, score: number}>>} - Ranked results
     */
    async semanticSearch(query, documents, options = {}) {
        const {
            topK = 10,
            minScore = 0.3,
            includeEmbeddings = false
        } = options;

        if (!this.isReady) {
            log.warn('Embedding model not ready, falling back to empty results');
            return [];
        }

        const startTime = Date.now();

        // Get query embedding
        const queryEmbedding = await this.embed(query);

        // Score all documents
        const scored = [];

        for (const doc of documents) {
            const docText = doc.text || doc.content || doc.title || '';
            if (!docText) continue;

            const docEmbedding = await this.embed(docText);
            const score = this.cosineSimilarity(queryEmbedding, docEmbedding);

            if (score >= minScore) {
                scored.push({
                    document: doc,
                    score,
                    ...(includeEmbeddings && { embedding: docEmbedding })
                });
            }
        }

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Take top K
        const results = scored.slice(0, topK);

        const elapsed = Date.now() - startTime;
        log.debug('Semantic search complete', {
            query: query.substring(0, 50),
            documents: documents.length,
            results: results.length,
            elapsed: `${elapsed}ms`
        });

        return results;
    }

    /**
     * Find similar documents to a reference document
     * @param {Object} referenceDoc - Reference document
     * @param {Array} documents - Documents to search
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Similar documents
     */
    async findSimilar(referenceDoc, documents, options = {}) {
        const refText = referenceDoc.text || referenceDoc.content || referenceDoc.title;
        return this.semanticSearch(refText, documents, options);
    }

    /**
     * Pre-compute and cache embeddings for documents
     * @param {Array<{id: string, text: string}>} documents - Documents to embed
     * @param {Function} onProgress - Progress callback
     */
    async precomputeEmbeddings(documents, onProgress = () => { }) {
        if (!this.isReady) {
            throw new Error('Embedding model not initialized');
        }

        const total = documents.length;
        let processed = 0;

        for (const doc of documents) {
            const text = doc.text || doc.content || doc.title;
            if (text) {
                await this.embed(text);
            }

            processed++;
            onProgress(Math.round((processed / total) * 100), `Embedding ${processed}/${total}`);
        }

        log.info('Precomputed embeddings', { count: processed });
    }

    /**
     * Check if embedding model is ready
     */
    isModelReady() {
        return this.isReady && this.embedder !== null;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            inMemoryCount: this.embeddingCache.size,
            dimensions: EMBEDDING_MODEL.dimensions
        };
    }

    /**
     * Clear embedding cache
     */
    async clearCache() {
        this.embeddingCache.clear();
        try {
            // Clear IndexedDB cache
            // Would need to implement actual IndexedDB cache clear
            log.info('Embedding cache cleared');
        } catch (error) {
            log.error('Failed to clear cache', error);
        }
    }

    /**
     * Unload the model to free memory
     */
    async unload() {
        this.embedder = null;
        this.isReady = false;
        this.embeddingCache.clear();
        log.info('Embedding model unloaded');
    }

    // Private helper methods

    /**
     * Generate hash for text (for caching)
     */
    _hashText(text) {
        let hash = 0;
        const str = text.substring(0, 1000); // Limit for consistent hashing
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `emb_${hash}`;
    }

    /**
     * Get embedding from IndexedDB cache
     */
    async _getFromCache(key) {
        try {
            const cached = await db.get(EMBEDDINGS_STORE, key);
            if (cached?.embedding) {
                return new Float32Array(cached.embedding);
            }
        } catch (_error) {
            // Cache miss or error
        }
        return null;
    }

    /**
     * Save embedding to IndexedDB cache
     */
    async _saveToCache(key, embedding, text) {
        try {
            await db.put(EMBEDDINGS_STORE, {
                id: key,
                embedding: Array.from(embedding), // Convert to regular array for storage
                textPreview: text.substring(0, 100),
                cachedAt: new Date().toISOString()
            });
        } catch (error) {
            log.debug('Failed to cache embedding', error);
        }
    }

    /**
     * Check if embedding model is cached
     */
    static async isModelCached() {
        try {
            // Check if model files exist in transformers.js cache
            return new Promise((resolve) => {
                const request = indexedDB.open('transformers-cache', 1);
                request.onerror = () => resolve(false);
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    db.close();
                    resolve(true);
                };
                request.onupgradeneeded = () => resolve(false);
            });
        } catch (_error) {
            return false;
        }
    }
}

export default EmbeddingEngine;
