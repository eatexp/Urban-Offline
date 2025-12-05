import { getDBConnection } from '../storage/NativeStorage';

export const NativeSearch = {
    async init() {
        // Init happens in storage init, but ensure connection
        await getDBConnection();
    },

    async addDocument(doc) {
        const db = await getDBConnection();
        const { id, title, content, category, description } = doc;

        // FTS INSERT
        // Note: FTS tables don't support "INSERT OR REPLACE" cleanly on the rowid without more work, 
        // but for app purposes simple INSERT is often okay.
        // We delete first to avoid duplicates in FTS
        const deleteQuery = `DELETE FROM search_index_fts WHERE doc_id = ?`;
        await db.run(deleteQuery, [id]);

        const query = `
            INSERT INTO search_index_fts (doc_id, title, content, category) 
            VALUES (?, ?, ?, ?)
        `;
        // Combining desc into content for search
        const fullContent = (content || '') + ' ' + (description || '');
        await db.run(query, [id, title, fullContent, category]);
    },

    async search(queryText) {
        const db = await getDBConnection();
        // FTS Match Query
        const sql = `
            SELECT doc_id as id, title, category, content as description 
            FROM search_index_fts 
            WHERE search_index_fts MATCH ? 
            ORDER BY rank 
            LIMIT 10
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
