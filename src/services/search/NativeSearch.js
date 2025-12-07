import { getDBConnection } from '../storage/NativeStorage';

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
        // FTS Match Query
        const sql = `
            SELECT articles.slug, articles_fts.title, articles_fts.snip as description 
            FROM articles_fts 
            JOIN articles ON articles_fts.rowid = articles.id
            WHERE articles_fts MATCH ? 
            ORDER BY rank 
            LIMIT 20
        `;
        // FTS5 simple query syntax: "term*"
        const formattedQuery = `"${queryText}"*`;

        try {
            const res = await db.query(sql, [formattedQuery]);
            return res.values || [];
        } catch (e) {
            console.error("Native Search Error", e);
            return [];
        }
    }
};
