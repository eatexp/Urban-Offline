/**
 * OnlineContentService - Browse and fetch content when online
 * 
 * Provides:
 * - Browse Wikipedia medical articles
 * - Search online content
 * - Preview before download
 * - Queue for offline download
 */

import { createLogger } from '../utils/logger';

const log = createLogger('OnlineContent');

// Wikipedia REST API base
const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_SEARCH_API = 'https://en.wikipedia.org/w/api.php';

// Medical article categories for browsing
const MEDICAL_CATEGORIES = [
    { id: 'emergency', name: 'Emergency Medicine', query: 'Category:Emergency medicine' },
    { id: 'first-aid', name: 'First Aid', query: 'Category:First aid' },
    { id: 'trauma', name: 'Trauma', query: 'Category:Traumatology' },
    { id: 'poisons', name: 'Toxicology', query: 'Category:Toxicology' },
    { id: 'cardiology', name: 'Heart & Circulation', query: 'Category:Cardiology' },
    { id: 'respiratory', name: 'Respiratory', query: 'Category:Respiratory system' }
];

export const OnlineContentService = {
    /**
     * Check if currently online
     */
    isOnline() {
        return typeof navigator !== 'undefined' && navigator.onLine;
    },

    /**
     * Get available content categories
     */
    getCategories() {
        return MEDICAL_CATEGORIES;
    },

    /**
     * Search Wikipedia for articles
     * @param {string} query - Search query
     * @param {number} limit - Max results (default 20)
     * @returns {Promise<Array>} Search results
     */
    async search(query, limit = 20) {
        if (!this.isOnline()) {
            return { error: 'offline', results: [] };
        }

        try {
            const params = new URLSearchParams({
                action: 'query',
                list: 'search',
                srsearch: query,
                srlimit: limit.toString(),
                format: 'json',
                origin: '*'
            });

            const response = await fetch(`${WIKI_SEARCH_API}?${params}`);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            const results = (data.query?.search || []).map(item => ({
                id: item.pageid,
                title: item.title,
                snippet: item.snippet.replace(/<[^>]*>/g, ''), // Strip HTML
                wordcount: item.wordcount,
                timestamp: item.timestamp
            }));

            return { error: null, results };

        } catch (error) {
            log.error('Search failed', error);
            return { error: error.message, results: [] };
        }
    },

    /**
     * Get articles from a category
     * @param {string} categoryQuery - Category query
     * @param {number} limit - Max results
     */
    async getCategory(categoryQuery, limit = 50) {
        if (!this.isOnline()) {
            return { error: 'offline', results: [] };
        }

        try {
            const params = new URLSearchParams({
                action: 'query',
                list: 'categorymembers',
                cmtitle: categoryQuery,
                cmlimit: limit.toString(),
                cmtype: 'page',
                format: 'json',
                origin: '*'
            });

            const response = await fetch(`${WIKI_SEARCH_API}?${params}`);
            
            if (!response.ok) {
                throw new Error(`Category fetch failed: ${response.status}`);
            }

            const data = await response.json();
            const results = (data.query?.categorymembers || []).map(item => ({
                id: item.pageid,
                title: item.title
            }));

            return { error: null, results };

        } catch (error) {
            log.error('Category fetch failed', error);
            return { error: error.message, results: [] };
        }
    },

    /**
     * Get article summary (for preview)
     * @param {string} title - Article title
     */
    async getSummary(title) {
        if (!this.isOnline()) {
            return { error: 'offline', summary: null };
        }

        try {
            const encodedTitle = encodeURIComponent(title);
            const response = await fetch(`${WIKI_API}/page/summary/${encodedTitle}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Summary fetch failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                error: null,
                summary: {
                    title: data.title,
                    extract: data.extract,
                    thumbnail: data.thumbnail?.source,
                    pageUrl: data.content_urls?.desktop?.page,
                    description: data.description
                }
            };

        } catch (error) {
            log.error('Summary fetch failed', error);
            return { error: error.message, summary: null };
        }
    },

    /**
     * Get full article HTML for download
     * @param {string} title - Article title
     */
    async getFullArticle(title) {
        if (!this.isOnline()) {
            return { error: 'offline', article: null };
        }

        try {
            const encodedTitle = encodeURIComponent(title);
            const response = await fetch(`${WIKI_API}/page/html/${encodedTitle}`, {
                headers: { 
                    'Accept': 'text/html',
                    'User-Agent': 'Urban-Offline/1.0 (Emergency Preparedness App)'
                }
            });

            if (!response.ok) {
                throw new Error(`Article fetch failed: ${response.status}`);
            }

            const html = await response.text();
            
            // Clean and extract plain text
            const plainText = this._extractPlainText(html);
            
            return {
                error: null,
                article: {
                    title: title,
                    html: this._cleanHtml(html),
                    plainText: plainText,
                    wordCount: plainText.split(/\s+/).length,
                    fetchedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            log.error('Article fetch failed', error);
            return { error: error.message, article: null };
        }
    },

    /**
     * Get trending/featured medical articles
     */
    async getFeatured() {
        // Pre-curated list of essential medical articles
        const featured = [
            { title: 'Cardiopulmonary resuscitation', category: 'emergency' },
            { title: 'First aid', category: 'emergency' },
            { title: 'Stroke', category: 'emergency' },
            { title: 'Anaphylaxis', category: 'emergency' },
            { title: 'Choking', category: 'emergency' },
            { title: 'Burn', category: 'trauma' },
            { title: 'Fracture', category: 'trauma' },
            { title: 'Hypothermia', category: 'environmental' },
            { title: 'Heat stroke', category: 'environmental' },
            { title: 'Poisoning', category: 'toxicology' }
        ];

        // If online, enrich with summaries
        if (this.isOnline()) {
            const enriched = await Promise.all(
                featured.slice(0, 5).map(async (item) => {
                    const { summary } = await this.getSummary(item.title);
                    return { ...item, summary };
                })
            );
            return enriched;
        }

        return featured;
    },

    /**
     * Estimate download size for an article
     * @param {number} wordCount 
     * @returns {string} Human-readable size estimate
     */
    estimateSize(wordCount) {
        // Rough estimate: ~7 bytes per word for HTML, ~1.5 bytes for plain text
        const bytes = wordCount * 8;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },

    /**
     * Clean HTML for storage
     */
    _cleanHtml(html) {
        // Create a simple DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove unwanted elements
        const removeSelectors = [
            'script', 'style', '[data-mw]', '.mw-editsection',
            '.reference', '.navbox', '.sidebar', '.hatnote', '.metadata'
        ];
        
        removeSelectors.forEach(selector => {
            try {
                doc.querySelectorAll(selector).forEach(el => el.remove());
            } catch (_e) {
                // Selector may be invalid
            }
        });
        
        return doc.body?.innerHTML || html;
    },

    /**
     * Extract plain text from HTML
     */
    _extractPlainText(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove script, style
        doc.querySelectorAll('script, style').forEach(el => el.remove());
        
        return doc.body?.textContent?.trim() || '';
    }
};

export default OnlineContentService;

