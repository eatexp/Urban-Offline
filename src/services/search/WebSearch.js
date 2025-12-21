import { Document } from 'flexsearch';
import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('WebSearch');

let index = null;
let isIndexing = false;

export const SearchService = {
    async init() {
        if (index) return;
        if (isIndexing) {
            // Wait for indexing to complete
            while (isIndexing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        isIndexing = true;

        // Initialize FlexSearch Document Index
        index = new Document({
            document: {
                id: 'id',
                index: ['title', 'content', 'description'],
                store: ['title', 'description', 'category', 'slug']
            },
            tokenize: 'forward'
        });

        // Try to load persisted index
        try {
            const savedIndex = await db.get('search_index', 'main_index');
            if (savedIndex && savedIndex.data) {
                try {
                    // FlexSearch export/import
                    const exported = JSON.parse(savedIndex.data);
                    index.import(exported);
                    log.info('Loaded persisted search index');
                    isIndexing = false;
                    return;
                } catch (error) {
                    log.warn('Failed to import saved index, rebuilding...', error);
                }
            }
        } catch (_error) {
            log.debug('No saved search index found, building new one...');
        }

        // Index articles from health_content, survival_content, law_content stores
        try {
            const [healthContent, survivalContent, lawContent] = await Promise.all([
                db.getAll('health_content').catch(() => []),
                db.getAll('survival_content').catch(() => []),
                db.getAll('law_content').catch(() => [])
            ]);

            // Index health content
            healthContent.forEach(item => {
                index.add({
                    id: item.id,
                    slug: item.id,
                    title: item.title || '',
                    content: (item.summary || '') + ' ' + (item.content || ''),
                    description: item.summary || '',
                    category: 'health'
                });
            });

            // Index survival content
            survivalContent.forEach(item => {
                index.add({
                    id: item.id,
                    slug: item.id,
                    title: item.title || item.name || '',
                    content: item.searchableText || item.description || '',
                    description: item.description || '',
                    category: 'survival'
                });
            });

            // Index law content
            lawContent.forEach(item => {
                index.add({
                    id: item.id,
                    slug: item.id,
                    title: item.title || '',
                    content: item.fullText || item.summary || '',
                    description: item.summary || '',
                    category: 'law'
                });
            });

            log.info(`Indexed ${healthContent.length + survivalContent.length + lawContent.length} items`);

            // Persist index - search_index uses out-of-line keys, so pass key separately
            try {
                const exported = index.export();
                await db.put('search_index', {
                    data: JSON.stringify(exported),
                    updatedAt: new Date().toISOString()
                }, 'main_index');
            } catch (e) {
                log.warn('Failed to persist search index', e);
            }
        } catch (e) {
            log.error('Failed to index content', e);
        }

        isIndexing = false;
    },

    async addDocument(doc) {
        if (!index) await this.init();
        await index.add({
            ...doc,
            slug: doc.slug || doc.id
        });
        
        // Persist updated index (debounced in production)
        try {
            const exported = index.export();
            await db.put('search_index', {
                data: JSON.stringify(exported),
                updatedAt: new Date().toISOString()
            }, 'main_index');
        } catch (e) {
            log.warn('Failed to persist search index update', e);
        }
    },

    async search(query) {
        if (!index) await this.init();

        const results = await index.search(query, {
            limit: 20,
            enrich: true
        });

        // Flatten results from FlexSearch format
        const flatResults = [];
        results.forEach(fieldResult => {
            fieldResult.result.forEach(item => {
                if (!flatResults.find(r => r.id === item.id)) {
                    flatResults.push({
                        ...item.doc,
                        slug: item.doc.slug || item.doc.id
                    });
                }
            });
        });

        return flatResults;
    },

    /**
     * Rebuild the search index from scratch
     */
    async rebuildIndex() {
        index = null;
        isIndexing = false;
        await this.init();
    }
};
