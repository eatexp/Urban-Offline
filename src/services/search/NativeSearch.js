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
        const { id, title, content, description, category } = doc;

        // =============================================================================
        // VERIFIED: [P4][Quality] NATIVE_SEARCH_CATEGORY_COLUMN
        // Implementation: Added category column support to document insertion.
        //   Category is now stored in articles table for consistent search results.
        //   Also inserts to articles table with category for proper indexing.
        // =============================================================================

        // First insert/update the main articles table with category
        const articleQuery = `
            INSERT INTO articles (id, slug, title, body_html, body_plain, source, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                body_plain = excluded.body_plain,
                category = excluded.category
        `;
        const fullContent = (content || '') + ' ' + (description || '');
        await db.run(articleQuery, [id, id, title, content || '', fullContent, doc.source || 'unknown', category || 'general']);

        // FTS INSERT
        const deleteQuery = `DELETE FROM articles_fts WHERE rowid = ?`;
        await db.run(deleteQuery, [id]);

        const query = `
            INSERT INTO articles_fts (rowid, title, body_plain)
            VALUES (?, ?, ?)
        `;
        await db.run(query, [id, title, fullContent]);
    },

    async addDocuments(docs) {
        const db = await getDBConnection();
        const set = [];

        for (const doc of docs) {
            const { id, title, content, description } = doc;

            // Validate ID for Native SQLite (must be integer rowid)
            if (!Number.isInteger(id)) {
                continue;
            }

            const fullContent = (content || '') + ' ' + (description || '');

            set.push({
                statement: `DELETE FROM articles_fts WHERE rowid = ?`,
                values: [id]
            });
            set.push({
                statement: `INSERT INTO articles_fts (rowid, title, body_plain) VALUES (?, ?, ?)`,
                values: [id, title, fullContent]
            });
        }

        if (set.length > 0) {
            try {
                await db.executeSet(set);
            } catch (e) {
                logger.error("Native Search Batch Error", e);
            }
        }
    },

    async search(queryText) {
        const db = await getDBConnection();
        // FTS Match Query - using snippet for description
        // =============================================================================
        // VERIFIED: [P4][Quality] NATIVE_SEARCH_CATEGORY_COLUMN
        // Implementation: Updated query to SELECT category column from articles table.
        //   Category is now properly returned for consistent UX across web and native.
        // =============================================================================
        const sql = `
            SELECT
                articles.id,
                articles.slug,
                articles.title,
                articles.category,
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
                category: row.category || 'general'
            }));
        } catch (e) {
            logger.error("Native Search Error", e);
            return [];
        }
    }
};
