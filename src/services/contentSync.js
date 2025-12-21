import { db } from './db';
import { SearchService } from './SearchService';
import { createLogger } from '../utils/logger';

const log = createLogger('ContentSync');

/**
 * Syncs articles from content.db (SQLite) to IndexedDB stores
 * This bridges the build-time content pipeline with runtime storage
 */
export const contentSync = {
    /**
     * Sync articles from bundled content.db to IndexedDB
     * For web: reads from public/assets/content.db via fetch
     * For native: reads from SQLite directly
     */
    async syncContentToIndexedDB() {
        try {
            // Check if already synced
            const healthContent = await db.getAll('health_content');
            if (healthContent && healthContent.length > 0) {
                // Already synced
                return { synced: false, reason: 'already_synced', count: healthContent.length };
            }

            // For web platform, we need to fetch content.db and parse it
            // Since we can't directly read SQLite in browser, we'll create a JSON export
            // For now, we'll check if there's a content manifest JSON file
            try {
                const response = await fetch('/assets/content-manifest.json');
                if (response.ok) {
                    const manifest = await response.json();
                    return await this.syncFromManifest(manifest);
                }
            } catch (_fetchError) {
                // Manifest doesn't exist, try alternative approach
            }

            // Alternative: Try to read from content.db using SQL.js or similar
            // For MVP, we'll populate from the existing content.db if available
            // This requires SQL.js or a similar library
            
            return { synced: false, reason: 'no_content_source' };
        } catch (error) {
            log.error('Content sync failed', error);
            return { synced: false, reason: 'error', error: error.message };
        }
    },

    /**
     * Sync from a content manifest JSON file
     */
    async syncFromManifest(manifest) {
        let syncedCount = 0;

        if (manifest.articles) {
            for (const article of manifest.articles) {
                // Determine category based on article metadata
                let category = 'health';
                if (article.categories) {
                    if (article.categories.some(c => c.includes('Legal') || c.includes('Rights'))) {
                        category = 'law';
                    } else if (article.categories.some(c => c.includes('Survival') || c.includes('Flood'))) {
                        category = 'survival';
                    }
                }

                // Store in appropriate IndexedDB store
                const contentData = {
                    id: article.slug,
                    title: article.title,
                    summary: article.body_plain?.substring(0, 200) || '',
                    content: article.body_html || '',
                    source: article.source || 'wikipedia',
                    source_url: article.source_url || '',
                    importedAt: new Date().toISOString()
                };

                if (category === 'health') {
                    await db.put('health_content', contentData);
                } else if (category === 'law') {
                    await db.put('law_content', {
                        ...contentData,
                        fullText: article.body_plain || ''
                    });
                } else if (category === 'survival') {
                    await db.put('survival_content', {
                        ...contentData,
                        searchableText: article.body_plain || '',
                        description: contentData.summary
                    });
                }

                // Index for search
                await SearchService.addDocument({
                    id: article.slug,
                    slug: article.slug,
                    title: article.title,
                    content: article.body_plain || '',
                    description: contentData.summary,
                    category: category
                });

                syncedCount++;
            }
        }

        return { synced: true, count: syncedCount };
    },

    /**
     * Create a content manifest from content.db (build-time script)
     * This should be called during build to generate content-manifest.json
     */
    async createManifestFromDB() {
        // This would be used in a build script, not runtime
        // Placeholder for build-time content export
    }
};


