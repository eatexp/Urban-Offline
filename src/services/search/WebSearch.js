import { Document } from 'flexsearch';
import { db } from '../db';

let index = null;

export const SearchService = {
    async init() {
        if (index) return;

        // Initialize FlexSearch Document Index
        index = new Document({
            document: {
                id: 'id',
                index: ['title', 'content', 'description'],
                store: ['title', 'description', 'category']
            },
            tokenize: 'forward'
        });

        // Load persisted index if exists
        try {
            const savedIndex = await db.get('search_index', 'main_index');
            if (savedIndex) {
                // Import logic for FlexSearch is complex with multiple fields
                // For now, simpler to re-index or implement robust export/import later if needed for Web
                // But since we are leveraging Native mostly, we just keep this as is.
                // Actually, re-hydration code was missing in original View.
            }
        } catch (e) {
            console.error('Failed to load search index', e);
        }
    },

    async addDocument(doc) {
        if (!index) await this.init();
        await index.add(doc);
        // Persist? (Debounced persist would be better)
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
    }
};
