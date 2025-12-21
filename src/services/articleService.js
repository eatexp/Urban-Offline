import { Capacitor } from '@capacitor/core';
import { getDBConnection } from './storage/NativeStorage';
import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('ArticleService');

/**
 * Platform-agnostic article accessor
 */
export const articleService = {
    async getArticleBySlug(slug) {
        if (Capacitor.isNativePlatform()) {
            // Native: Query SQLite articles table
            try {
                const dbConn = await getDBConnection();
                const res = await dbConn.query('SELECT * FROM articles WHERE slug = ? LIMIT 1', [slug]);
                if (res.values && res.values.length > 0) {
                    return res.values[0];
                }
            } catch (e) {
                log.error('Failed to get article from SQLite', e);
            }
        } else {
            // Web: Search across health_content, survival_content, law_content
            try {
                // Try health_content first
                let article = await db.get('health_content', slug);
                if (article) {
                    return {
                        slug: article.id,
                        title: article.title,
                        body_html: article.content || '',
                        body_plain: article.summary || '',
                        source: 'health_content',
                        last_updated: article.importedAt || new Date().toISOString()
                    };
                }

                // Try survival_content
                article = await db.get('survival_content', slug);
                if (article) {
                    return {
                        slug: article.id,
                        title: article.title || article.name,
                        body_html: article.description || '',
                        body_plain: article.searchableText || '',
                        source: 'survival_content',
                        last_updated: article.importedAt || new Date().toISOString()
                    };
                }

                // Try law_content
                article = await db.get('law_content', slug);
                if (article) {
                    return {
                        slug: article.id,
                        title: article.title,
                        body_html: article.fullText || '',
                        body_plain: article.summary || '',
                        source: 'law_content',
                        last_updated: article.importedAt || new Date().toISOString()
                    };
                }
            } catch (e) {
                log.error('Failed to get article from IndexedDB', e);
            }
        }

        return null;
    }
};




