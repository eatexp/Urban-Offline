import { db } from './db';
import { SearchService } from './SearchService';

export const ContentImporter = {
    /**
     * Import a Health Article (e.g. from WikiMed processed JSON).
     * @param {Object} article - { id, title, summary, content, tags } 
     */
    async importHealthContent(article) {
        if (!article.id) throw new Error("Missing ID");

        await db.put('health_content', {
            id: article.id,
            ...article,
            importedAt: new Date().toISOString()
        });

        // Index for search
        await SearchService.addDocument({
            id: article.id,
            title: article.title,
            content: article.summary + " " + (article.content || ""), // Index full text
            category: 'health',
            description: article.summary
        });
    },

    /**
     * Import Survival Data (e.g. Flood Zone GeoJSON feature or Guide).
     * @param {Object} item 
     */
    async importSurvivalContent(item) {
        await db.put('survival_content', {
            id: item.id,
            ...item,
            importedAt: new Date().toISOString()
        });

        if (item.searchableText) {
            await SearchService.addDocument({
                id: item.id,
                title: item.title || item.name,
                content: item.searchableText,
                category: 'survival',
                description: item.description || ''
            });
        }
    },

    /**
     * Import Legal Content (e.g. PACE Codes text).
     * @param {Object} doc 
     */
    async importLawContent(doc) {
        await db.put('law_content', {
            id: doc.id,
            ...doc,
            importedAt: new Date().toISOString()
        });

        await SearchService.addDocument({
            id: doc.id,
            title: doc.title,
            content: doc.fullText,
            category: 'law',
            description: doc.summary
        });
    }
};
