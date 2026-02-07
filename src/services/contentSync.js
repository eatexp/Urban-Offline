import { db } from './db';
import { SearchService } from './SearchService';
import { createLogger } from '../utils/logger';

const log = createLogger('ContentSync');

const SENTINEL_KEY = '_bundled_sync_v1';
const PACKS_STORE = 'content_packs';

/**
 * Store mapping for each pack category
 */
const PACK_STORE_MAP = {
    'medical-core': 'health_content',
    'legal-uk': 'law_content',
    'survival-core': 'survival_content'
};

/**
 * Syncs bundled content packs (built from content.db at build time)
 * into IndexedDB for runtime use by the app.
 *
 * Runs once on first launch. Subsequent launches skip instantly
 * by checking a sentinel key in the content_packs store.
 */
export const contentSync = {
    /**
     * Sync all bundled content packs into IndexedDB.
     * Safe to call on every app start — skips if already synced.
     */
    async syncBundledContent() {
        try {
            // Check sentinel — already synced?
            const sentinel = await db.get(PACKS_STORE, SENTINEL_KEY).catch(() => null);
            if (sentinel) {
                log.debug('Bundled content already synced, skipping');
                return { synced: false, reason: 'already_synced' };
            }

            // Fetch the manifest generated at build time
            let manifest;
            try {
                const resp = await fetch('/assets/content-manifest.json');
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                manifest = await resp.json();
            } catch (err) {
                log.warn('No bundled manifest found, skipping sync:', err.message);
                return { synced: false, reason: 'no_manifest' };
            }

            if (!manifest.packs || manifest.packs.length === 0) {
                log.warn('Manifest has no packs');
                return { synced: false, reason: 'empty_manifest' };
            }

            log.info(`Syncing ${manifest.packs.length} bundled packs (${manifest.totalArticles} articles)...`);

            let totalSynced = 0;
            let totalFailed = 0;

            for (const packDef of manifest.packs) {
                try {
                    const result = await this._syncPack(packDef);
                    totalSynced += result.synced;
                    totalFailed += result.failed;
                } catch (err) {
                    log.error(`Failed to sync pack ${packDef.id}:`, err);
                    totalFailed++;
                }
            }

            // Write sentinel so we don't re-sync
            await db.put(PACKS_STORE, {
                id: SENTINEL_KEY,
                syncedAt: new Date().toISOString(),
                totalSynced,
                totalFailed
            });

            log.info(`Bundled content sync complete: ${totalSynced} articles synced, ${totalFailed} failed`);

            // Notify UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('content-synced', {
                    detail: { totalSynced, totalFailed }
                }));
            }

            return { synced: true, count: totalSynced, failed: totalFailed };
        } catch (error) {
            log.error('Bundled content sync failed:', error);
            return { synced: false, reason: 'error', error: error.message };
        }
    },

    /**
     * Sync a single pack: fetch its JSON, store articles in IndexedDB, index for search.
     */
    async _syncPack(packDef) {
        const store = packDef.store || PACK_STORE_MAP[packDef.id];
        if (!store) {
            log.warn(`No store mapping for pack ${packDef.id}, skipping`);
            return { synced: 0, failed: 0 };
        }

        // Fetch the pack JSON
        const resp = await fetch(packDef.dataUrl);
        if (!resp.ok) throw new Error(`Failed to fetch ${packDef.dataUrl}: HTTP ${resp.status}`);
        const packData = await resp.json();

        const articles = packData.articles || [];
        log.info(`  Syncing ${packDef.id}: ${articles.length} articles → ${store}`);

        let synced = 0;
        let failed = 0;
        const searchDocs = [];

        for (const article of articles) {
            try {
                // Build the record for IndexedDB
                const record = {
                    id: article.id || article.slug,
                    slug: article.slug,
                    title: article.title,
                    content: article.content || '',
                    summary: article.description || '',
                    source: article.source || 'wikipedia',
                    source_url: article.sourceUrl || '',
                    importedAt: new Date().toISOString(),
                    packId: packDef.id
                };

                // Law content uses fullText field, survival uses searchableText
                if (store === 'law_content') {
                    record.fullText = article.plainText || '';
                } else if (store === 'survival_content') {
                    record.searchableText = article.plainText || '';
                    record.description = article.description || '';
                }

                await db.put(store, record);

                // Collect for batch search indexing
                searchDocs.push({
                    id: article.slug,
                    slug: article.slug,
                    title: article.title,
                    content: article.plainText || article.description || '',
                    description: article.description || '',
                    category: article.category || packDef.category
                });

                synced++;
            } catch (err) {
                log.warn(`Failed to sync article "${article.title}":`, err.message);
                failed++;
            }
        }

        // Batch index for search
        if (searchDocs.length > 0) {
            try {
                await SearchService.addDocuments(searchDocs);
            } catch (err) {
                log.warn(`Search indexing failed for ${packDef.id}:`, err.message);
            }
        }

        // Write pack metadata to content_packs store
        await db.put(PACKS_STORE, {
            id: packDef.id,
            name: packDef.name,
            version: packDef.version || '1.0.0',
            category: packDef.category,
            size: packDef.size,
            sizeDisplay: packDef.sizeDisplay,
            articleCount: synced,
            store: store,
            installedAt: new Date().toISOString(),
            bundled: true,
            metadata: packDef.metadata || {}
        });

        return { synced, failed };
    },

    /**
     * Clean up (no-op for bundled sync, kept for interface compatibility)
     */
    cleanup() {}
};
