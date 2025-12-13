import { Document } from 'flexsearch';
import { db } from '../db';

let index = null;
let persistTimeout = null;

// Create a fresh index instance
const createIndex = () => {
    return new Document({
        document: {
            id: 'id',
            index: ['title', 'content', 'description'],
            store: ['title', 'description', 'category', 'slug']
        },
        tokenize: 'forward'
    });
};

export const SearchService = {
    async init() {
        if (index) return;

        index = createIndex();

        // Load persisted index if exists
        try {
            const savedData = await db.get('search_index', 'main_index');
            if (savedData && savedData.documents) {
                // Re-index saved documents
                for (const doc of savedData.documents) {
                    await index.add(doc);
                }
                console.log(`Search index restored: ${savedData.documents.length} documents`);
            }
        } catch (e) {
            console.error('Failed to load search index:', e);
        }
    },

    // Debounced persistence to avoid excessive writes
    async persistIndex() {
        if (persistTimeout) {
            clearTimeout(persistTimeout);
        }

        persistTimeout = setTimeout(async () => {
            try {
                // Export all indexed documents for re-import
                const documents = [];
                const allDocs = await this.getAllDocuments();
                documents.push(...allDocs);

                await db.put('search_index', { documents }, 'main_index');
            } catch (e) {
                console.error('Failed to persist search index:', e);
            }
        }, 1000);
    },

    // Get all documents from index (for persistence)
    async getAllDocuments() {
        if (!index) return [];

        // Search with empty to get all (FlexSearch workaround)
        const allResults = [];
        const stores = ['health_content', 'survival_content', 'law_content', 'guide_content'];

        for (const store of stores) {
            try {
                const items = await db.getAll(store);
                allResults.push(...items.filter(item => item.title || item.content));
            } catch {
                // Store may not exist or be empty
            }
        }

        return allResults;
    },

    async addDocument(doc) {
        if (!index) await this.init();
        await index.add(doc);
        // Debounced persist
        this.persistIndex();
    },

    async addDocuments(docs) {
        if (!index) await this.init();
        for (const doc of docs) {
            await index.add(doc);
        }
        this.persistIndex();
    },

    async removeDocument(id) {
        if (!index) await this.init();
        await index.remove(id);
        this.persistIndex();
    },

    async search(query) {
        if (!index) await this.init();

        const results = await index.search(query, {
            limit: 10,
            enrich: true
        });

        // Flatten results from FlexSearch format
        const flatResults = [];
        results.forEach(fieldResult => {
            fieldResult.result.forEach(item => {
                if (!flatResults.find(r => r.id === item.id)) {
                    flatResults.push(item.doc);
                }
            });
        });

        return flatResults;
    },

    async clearIndex() {
        index = createIndex();
        await db.delete('search_index', 'main_index');
    }
};
