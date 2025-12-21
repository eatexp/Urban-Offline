import { getDBConnection } from '../storage/NativeStorage';
import { createLogger } from '../../utils/logger';

const logger = createLogger('NativeSearch');

export const NativeSearch = {
    async init() {
        // Init happens in storage init, but ensure connection
        await getDBConnection();
    },

    async addDocument(doc) {
        const db = await getDBConnection();
        const { id, title, content, description } = doc;

        // FTS INSERT
        const deleteQuery = `DELETE FROM articles_fts WHERE rowid = ?`;
        await db.run(deleteQuery, [id]);

        const query = `
            INSERT INTO articles_fts (rowid, title, body_plain) 
            VALUES (?, ?, ?)
        `;
        // Combining desc into content for search
        const fullContent = (content || '') + ' ' + (description || '');
        await db.run(query, [id, title, fullContent]);
    },

    async search(queryText) {
        const db = await getDBConnection();
        // FTS Match Query - using snippet for description
        const sql = `
            SELECT 
                articles.id,
                articles.slug, 
                articles.title,
                snippet(articles_fts, 2, '<mark>', '</mark>', '...', 32) as description
            FROM articles_fts 
            JOIN articles ON articles_fts.rowid = articles.id
            WHERE articles_fts MATCH ? 
            ORDER BY rank 
            LIMIT 20
        `;
        // FTS5 simple query syntax: "term*" for prefix matching
        const formattedQuery = `"${queryText}"*`;

        try {
            const res = await db.query(sql, [formattedQuery]);
            return (res.values || []).map(row => ({
                id: row.id,
                slug: row.slug,
                title: row.title,
                description: row.description || row.title,
                category: 'health'
            }));
        } catch (e) {
            logger.error("Native Search Error", e);
            return [];
        }
    }
};
