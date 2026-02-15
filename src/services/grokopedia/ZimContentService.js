/**
 * ZimContentService - Grokopedia content management
 * 
 * Manages ZIM file parsing, article extraction, and content delivery
 * for the Grokopedia knowledge base feature.
 * 
 * Features:
 * - ZIM file metadata extraction
 * - Article search (title + content)
 * - Image blob extraction
 * - Internal link resolution
 * - Reading progress tracking
 * 
 * Compliance: .clinerules §4 - Content Pack integration
 */

import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('ZimContentService');

// Storage keys
const ZIM_METADATA_STORE = 'zim_metadata';
const ZIM_ARTICLES_STORE = 'zim_articles';
const READING_PROGRESS_STORE = 'reading_progress';

/**
 * ZIM Content Service for Grokopedia
 */
export const ZimContentService = {
    _zimCache: new Map(),
    _articleCache: new Map(),
    
    /**
     * Initialize service and load metadata
     */
    async init() {
        log.info('Initializing ZimContentService');
        await this._loadAllMetadata();
    },
    
    /**
     * Load metadata for all installed ZIM files
     * @private
     */
    async _loadAllMetadata() {
        try {
            const allMetadata = await db.getAll(ZIM_METADATA_STORE);
            for (const metadata of allMetadata) {
                this._zimCache.set(metadata.id, metadata);
            }
            log.info('Loaded ZIM metadata', { count: allMetadata.length });
        } catch (error) {
            log.error('Failed to load ZIM metadata', error);
        }
    },
    
    /**
     * Get all installed content packs (ZIM files)
     * @returns {Promise<Array<ContentPack>>}
     */
    async getInstalledPacks() {
        const packs = [];
        
        for (const [id, metadata] of this._zimCache) {
            packs.push({
                id,
                name: metadata.name,
                description: metadata.description,
                size: metadata.size,
                sizeDisplay: this._formatSize(metadata.size),
                articleCount: metadata.articleCount || 0,
                category: metadata.category || 'general',
                language: metadata.language || 'en',
                date: metadata.date,
                version: metadata.version,
                publisher: metadata.publisher,
                tags: metadata.tags || [],
                status: metadata.status || 'ready',
                coverImage: metadata.coverImage,
                lastAccessed: metadata.lastAccessed
            });
        }
        
        // Sort by last accessed (most recent first), then by name
        return packs.sort((a, b) => {
            if (a.lastAccessed && b.lastAccessed) {
                return new Date(b.lastAccessed) - new Date(a.lastAccessed);
            }
            if (a.lastAccessed) return -1;
            if (b.lastAccessed) return 1;
            return a.name.localeCompare(b.name);
        });
    },
    
    /**
     * Get detailed information about a specific pack
     * @param {string} packId
     * @returns {Promise<ContentPack|null>}
     */
    async getPackDetails(packId) {
        const metadata = this._zimCache.get(packId);
        if (!metadata) return null;
        
        // Get article statistics
        const articles = await this._getArticlesForPack(packId);
        
        return {
            ...metadata,
            sizeDisplay: this._formatSize(metadata.size),
            articles: articles.slice(0, 50), // Preview first 50
            totalArticles: articles.length,
            categories: this._extractCategories(articles),
            popularArticles: this._getPopularArticles(articles)
        };
    },
    
    /**
     * Search across all ZIM content
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {string} options.packId - Limit to specific pack
     * @param {number} options.limit - Max results
     * @param {boolean} options.includeContent - Search in article content
     * @returns {Promise<Array<SearchResult>>}
     */
    async search(query, options = {}) {
        const { packId, limit = 20, includeContent = true } = options;
        
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        log.info('Searching ZIM content', { query, packId, includeContent });
        
        const normalizedQuery = query.toLowerCase().trim();
        const results = [];
        
        // Get articles to search
        let articles;
        if (packId) {
            articles = await this._getArticlesForPack(packId);
        } else {
            articles = await this._getAllArticles();
        }
        
        for (const article of articles) {
            let score = 0;
            
            // Title match (highest weight)
            const titleLower = article.title.toLowerCase();
            if (titleLower === normalizedQuery) {
                score += 100; // Exact match
            } else if (titleLower.startsWith(normalizedQuery)) {
                score += 80; // Starts with query
            } else if (titleLower.includes(normalizedQuery)) {
                score += 60; // Contains query
            }
            
            // Content match (if enabled)
            if (includeContent && article.content) {
                const contentLower = article.content.toLowerCase();
                const occurrences = (contentLower.match(new RegExp(normalizedQuery, 'g')) || []).length;
                score += Math.min(occurrences * 5, 40); // Cap content score
            }
            
            if (score > 0) {
                results.push({
                    ...article,
                    score,
                    snippet: this._generateSnippet(article, normalizedQuery)
                });
            }
        }
        
        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, limit);
    },
    
    /**
     * Get a specific article by ID
     * @param {string} articleId
     * @returns {Promise<Article|null>}
     */
    async getArticle(articleId) {
        // Check cache first
        if (this._articleCache.has(articleId)) {
            return this._articleCache.get(articleId);
        }
        
        try {
            const article = await db.get(ZIM_ARTICLES_STORE, articleId);
            if (article) {
                this._articleCache.set(articleId, article);
                
                // Update last accessed
                await this._updatePackAccessTime(article.packId);
                
                // Track reading start
                await this._trackReadingProgress(articleId, 0);
            }
            return article;
        } catch (error) {
            log.error('Failed to get article', { articleId, error });
            return null;
        }
    },
    /**
     * Get article by URL/title (for internal link resolution)
     * @param {string} url - Article URL or title
     * @param {string} packId - Pack to search in
     * @returns {Promise<Article|null>}
     */
    async getArticleByUrl(url, packId) {
        // Normalize URL
        const normalizedUrl = url.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Try to find by normalized URL
        const articles = await this._getArticlesForPack(packId);
        const article = articles.find(a => {
            const articleUrl = (a.url || a.title).toLowerCase().replace(/[^a-z0-9]/g, '_');
            return articleUrl === normalizedUrl;
        });
        
        if (article) {
            return this.getArticle(article.id);
        }
        
        return null;
    },
    
    /**
     * Get related articles based on categories/tags
     * @param {string} articleId
     * @param {number} limit
     * @returns {Promise<Array<Article>>}
     */
    async getRelatedArticles(articleId, limit = 5) {
        const article = await this.getArticle(articleId);
        if (!article) return [];
        
        const articles = await this._getArticlesForPack(article.packId);
        
        // Score articles by category/tag overlap
        const scored = articles
            .filter(a => a.id !== articleId)
            .map(a => {
                let score = 0;
                
                // Category match
                if (a.category && article.category && a.category === article.category) {
                    score += 10;
                }
                
                // Tag overlap
                const articleTags = new Set(article.tags || []);
                const overlap = (a.tags || []).filter(tag => articleTags.has(tag)).length;
                score += overlap * 5;
                
                return { ...a, score };
            })
            .filter(a => a.score > 0)
            .sort((a, b) => b.score - a.score);
        
        return scored.slice(0, limit);
    },
    
    /**
     * Get alphabetical index of articles
     * @param {string} packId
     * @returns {Promise<Object>} - { A: [...], B: [...], ... }
     */
    async getAlphabeticalIndex(packId) {
        const articles = await this._getArticlesForPack(packId);
        const index = {};
        
        for (const article of articles) {
            const firstChar = (article.title[0] || '#').toUpperCase();
            if (!index[firstChar]) {
                index[firstChar] = [];
            }
            index[firstChar].push(article);
        }
        
        // Sort each section
        for (const char in index) {
            index[char].sort((a, b) => a.title.localeCompare(b.title));
        }
        
        return index;
    },
    
    /**
     * Get recently viewed articles
     * @param {number} limit
     * @returns {Promise<Array<Article>>}
     */
    async getRecentlyViewed(limit = 10) {
        try {
            const progress = await db.getAll(READING_PROGRESS_STORE);
            
            // Sort by last viewed
            const sorted = progress
                .filter(p => p.lastViewed)
                .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
                .slice(0, limit);
            
            // Get full article data
            const articles = await Promise.all(
                sorted.map(p => this.getArticle(p.articleId))
            );
            
            return articles.filter(Boolean);
        } catch (error) {
            log.error('Failed to get recently viewed', error);
            return [];
        }
    },
    
    /**
     * Update reading progress
     * @param {string} articleId
     * @param {number} progress - 0-100 percentage
     */
    async updateReadingProgress(articleId, progress) {
        await this._trackReadingProgress(articleId, progress);
    },
    
    /**
     * Get reading progress for an article
     * @param {string} articleId
     * @returns {Promise<number>} - 0-100 percentage
     */
    async getReadingProgress(articleId) {
        try {
            const record = await db.get(READING_PROGRESS_STORE, articleId);
            return record?.progress || 0;
        } catch {
            return 0;
        }
    },
    
    /**
     * Import a new ZIM file (called after download)
     * @param {Object} zimData - ZIM file data
     * @returns {Promise<boolean>}
     */
    async importZimFile(zimData) {
        try {
            const { id, name, size, articles, metadata } = zimData;
            
            // Store metadata
            const packMetadata = {
                id,
                name: name || 'Unknown Pack',
                description: metadata?.description || '',
                size,
                articleCount: articles?.length || 0,
                category: metadata?.category || 'general',
                language: metadata?.language || 'en',
                date: metadata?.date || new Date().toISOString(),
                version: metadata?.version || '1.0',
                publisher: metadata?.publisher || '',
                tags: metadata?.tags || [],
                status: 'ready',
                coverImage: metadata?.coverImage,
                importedAt: new Date().toISOString()
            };
            
            await db.put(ZIM_METADATA_STORE, packMetadata);
            this._zimCache.set(id, packMetadata);
            
            // Store articles
            if (articles && articles.length > 0) {
                for (const article of articles) {
                    article.packId = id;
                    await db.put(ZIM_ARTICLES_STORE, article);
                }
            }
            
            log.info('ZIM file imported', { 
                id, 
                name, 
                articleCount: articles?.length 
            });
            
            return true;
        } catch (error) {
            log.error('Failed to import ZIM file', error);
            return false;
        }
    },
    
    /**
     * Delete a ZIM pack and all its articles
     * @param {string} packId
     * @returns {Promise<boolean>}
     */
    async deletePack(packId) {
        try {
            // Delete metadata
            await db.delete(ZIM_METADATA_STORE, packId);
            this._zimCache.delete(packId);
            
            // Delete articles
            const articles = await this._getArticlesForPack(packId);
            for (const article of articles) {
                await db.delete(ZIM_ARTICLES_STORE, article.id);
                this._articleCache.delete(article.id);
                
                // Delete reading progress
                await db.delete(READING_PROGRESS_STORE, article.id);
            }
            
            log.info('ZIM pack deleted', { packId, articlesDeleted: articles.length });
            return true;
        } catch (error) {
            log.error('Failed to delete ZIM pack', error);
            return false;
        }
    },
    
    /**
     * Get total storage used by ZIM content
     * @returns {Promise<{bytes: number, display: string}>}
     */
    async getStorageUsage() {
        let totalBytes = 0;
        
        for (const metadata of this._zimCache.values()) {
            totalBytes += metadata.size || 0;
        }
        
        return {
            bytes: totalBytes,
            display: this._formatSize(totalBytes)
        };
    },
    
    /**
     * Get articles for a specific pack
     * @private
     */
    async _getArticlesForPack(packId) {
        try {
            // This is a simplified implementation
            // In production, you'd want indexed queries
            const allArticles = await db.getAll(ZIM_ARTICLES_STORE);
            return allArticles.filter(a => a.packId === packId);
        } catch (error) {
            log.error('Failed to get articles for pack', { packId, error });
            return [];
        }
    },
    
    /**
     * Get all articles (use sparingly)
     * @private
     */
    async _getAllArticles() {
        try {
            return await db.getAll(ZIM_ARTICLES_STORE);
        } catch (error) {
            log.error('Failed to get all articles', error);
            return [];
        }
    },
    
    /**
     * Extract categories from articles
     * @private
     */
    _extractCategories(articles) {
        const categories = new Map();
        
        for (const article of articles) {
            const cat = article.category || 'Uncategorized';
            categories.set(cat, (categories.get(cat) || 0) + 1);
        }
        
        return Array.from(categories.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    },
    
    /**
     * Get popular articles (mock - would use real analytics)
     * @private
     */
    _getPopularArticles(articles) {
        // In production, this would use view counts
        // For now, return first 10 alphabetically
        return articles
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .slice(0, 10);
    },
    
    /**
     * Generate search snippet with query highlighting
     * @private
     */
    _generateSnippet(article, query) {
        const content = article.content || article.description || '';
        const index = content.toLowerCase().indexOf(query);
        
        if (index === -1) {
            return content.slice(0, 150) + (content.length > 150 ? '...' : '');
        }
        
        const start = Math.max(0, index - 60);
        const end = Math.min(content.length, index + query.length + 60);
        
        let snippet = content.slice(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        return snippet;
    },
    
    /**
     * Update pack access time
     * @private
     */
    async _updatePackAccessTime(packId) {
        try {
            const metadata = this._zimCache.get(packId);
            if (metadata) {
                metadata.lastAccessed = new Date().toISOString();
                await db.put(ZIM_METADATA_STORE, metadata);
            }
        } catch (error) {
            log.debug('Failed to update access time', error);
        }
    },
    
    /**
     * Track reading progress
     * @private
     */
    async _trackReadingProgress(articleId, progress) {
        try {
            const record = {
                articleId,
                progress,
                lastViewed: new Date().toISOString()
            };
            await db.put(READING_PROGRESS_STORE, record);
        } catch (error) {
            log.debug('Failed to track progress', error);
        }
    },
    
    /**
     * Format bytes to human readable
     * @private
     */
    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
};

export default ZimContentService;

/**
 * @typedef {Object} ContentPack
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} size
 * @property {string} sizeDisplay
 * @property {number} articleCount
 * @property {string} category
 * @property {string} language
 * @property {string} date
 * @property {string} version
 * @property {string} publisher
 * @property {string[]} tags
 * @property {string} status
 */

/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} packId
 * @property {string} category
 * @property {string[]} tags
 * @property {string} url
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {string} title
 * @property {string} snippet
 * @property {number} score
 * @property {string} packId
 */