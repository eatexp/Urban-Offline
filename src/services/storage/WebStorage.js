import { openDB, deleteDB } from 'idb';

const DB_NAME = 'urban-offline-db';
const DB_VERSION = 6; // Bumped for session/message stores

// Stores that use out-of-line keys (no keyPath)
const OUT_OF_LINE_STORES = ['map_tiles', 'search_index', 'dataset_preferences', 'user_context', 'ink_stories'];

// Helper to dispatch recovery events
const dispatchRecoveryEvent = (success, error) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db-recovery', {
            detail: { success, error: error?.message }
        }));
    }
};

// ... (existing code)

export const initDB = async () => {
    try {
        return await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, _oldVersion) {
                // Store for dataset metadata (id, name, description, size, installed)
                if (!db.objectStoreNames.contains('datasets')) {
                    db.createObjectStore('datasets', { keyPath: 'id' });
                }
                // Store for actual data content (id, geojson/json data)
                if (!db.objectStoreNames.contains('data_content')) {
                    db.createObjectStore('data_content', { keyPath: 'id' });
                }

                // ... (existing stores)

                // *** NEW STORES FOR MISSION LOGS (v6) ***

                // Sessions (Conversation Metadata)
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // Messages (Linked to Sessions)
                if (!db.objectStoreNames.contains('messages')) {
                    const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
                    msgStore.createIndex('sessionId', 'sessionId', { unique: false });
                    msgStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // ... (rest of existing stores)

                // Store for guide metadata
                if (!db.objectStoreNames.contains('guides')) {
                    db.createObjectStore('guides', { keyPath: 'id' });
                }
                // Store for guide content (markdown/html)
                if (!db.objectStoreNames.contains('guide_content')) {
                    db.createObjectStore('guide_content', { keyPath: 'id' });
                }
                // Store for map tiles (key: z-x-y, value: blob)
                if (!db.objectStoreNames.contains('map_tiles')) {
                    db.createObjectStore('map_tiles');
                }

                // *** STORES FOR HEALTH, SURVIVAL, LAW ***

                // Health Content (Medical articles, ICD-11, etc.)
                if (!db.objectStoreNames.contains('health_content')) {
                    db.createObjectStore('health_content', { keyPath: 'id' });
                }

                // Survival Content (Flood zones, practical guides not covered by basic guides)
                if (!db.objectStoreNames.contains('survival_content')) {
                    db.createObjectStore('survival_content', { keyPath: 'id' });
                }

                // Law Content (PACE codes, Legislation)
                if (!db.objectStoreNames.contains('law_content')) {
                    db.createObjectStore('law_content', { keyPath: 'id' });
                }

                // Search Index Storage (Serialized FlexSearch index)
                if (!db.objectStoreNames.contains('search_index')) {
                    db.createObjectStore('search_index');
                }

                // *** NEW STORES FOR AI & CONTENT PACKS (v2) ***

                // AI Models metadata
                if (!db.objectStoreNames.contains('ai_models')) {
                    db.createObjectStore('ai_models', { keyPath: 'id' });
                }

                // Content Packs metadata
                if (!db.objectStoreNames.contains('content_packs')) {
                    db.createObjectStore('content_packs', { keyPath: 'id' });
                }

                // Dataset Preferences (AI dataset toggle state)
                if (!db.objectStoreNames.contains('dataset_preferences')) {
                    db.createObjectStore('dataset_preferences');
                }

                // User Context (Personal context for protocol generation)
                if (!db.objectStoreNames.contains('user_context')) {
                    db.createObjectStore('user_context');
                }

                // Ink Stories (Triage flow JSON files cached for offline)
                if (!db.objectStoreNames.contains('ink_stories')) {
                    db.createObjectStore('ink_stories');
                }

                // clawdBot Memory (Session history and context)
                if (!db.objectStoreNames.contains('clawdBot_memory')) {
                    db.createObjectStore('clawdBot_memory');
                }
            },
        });
    } catch (error) {
        // Check for corruption errors
        if (error.name === 'DataError' || error.name === 'UnknownError' ||
            error.name === 'VersionError' || error.message?.includes('corrupt')) {
            console.warn('IndexedDB appears corrupted, attempting recovery...', error.message);

            try {
                // Delete the corrupted database
                await deleteDB(DB_NAME);
                console.info('Corrupted IndexedDB deleted, recreating...');

                // Retry once
                const db = await openDB(DB_NAME, DB_VERSION, {
                    upgrade(db, _oldVersion) {
                        // Store for dataset metadata
                        if (!db.objectStoreNames.contains('datasets')) {
                            db.createObjectStore('datasets', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('data_content')) {
                            db.createObjectStore('data_content', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('guides')) {
                            db.createObjectStore('guides', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('guide_content')) {
                            db.createObjectStore('guide_content', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('map_tiles')) {
                            db.createObjectStore('map_tiles');
                        }
                        if (!db.objectStoreNames.contains('health_content')) {
                            db.createObjectStore('health_content', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('survival_content')) {
                            db.createObjectStore('survival_content', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('law_content')) {
                            db.createObjectStore('law_content', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('search_index')) {
                            db.createObjectStore('search_index');
                        }
                        if (!db.objectStoreNames.contains('ai_models')) {
                            db.createObjectStore('ai_models', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('content_packs')) {
                            db.createObjectStore('content_packs', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('dataset_preferences')) {
                            db.createObjectStore('dataset_preferences');
                        }
                        if (!db.objectStoreNames.contains('user_context')) {
                            db.createObjectStore('user_context');
                        }
                        if (!db.objectStoreNames.contains('ink_stories')) {
                            db.createObjectStore('ink_stories');
                        }
                        if (!db.objectStoreNames.contains('clawdBot_memory')) {
                            db.createObjectStore('clawdBot_memory');
                        }
                    },
                });

                console.info('IndexedDB successfully recovered');
                dispatchRecoveryEvent(true);
                return db;
            } catch (recoveryError) {
                console.error('IndexedDB recovery failed', recoveryError);
                dispatchRecoveryEvent(false, recoveryError);
                throw new Error('Database recovery failed: ' + recoveryError.message);
            }
        }

        // Re-throw non-corruption errors
        throw error;
    }
};
// Batch operations for performance - use single transaction for multiple items
const batchPut = async (storeName, items) => {
    const database = await initDB();
    const tx = database.transaction(storeName, 'readwrite');
    const isOutOfLine = OUT_OF_LINE_STORES.includes(storeName);
    await Promise.all(items.map(item =>
        isOutOfLine ? tx.store.put(item.value, item.key) : tx.store.put(item)
    ));
    await tx.done;
};

const batchDelete = async (storeName, keys) => {
    const database = await initDB();
    const tx = database.transaction(storeName, 'readwrite');
    await Promise.all(keys.map(key => tx.store.delete(key)));
    await tx.done;
};

export const db = {
    async get(storeName, key) {
        const database = await initDB();
        return database.get(storeName, key);
    },
    async getAll(storeName) {
        const database = await initDB();
        return database.getAll(storeName);
    },
    async iterate(storeName, callback) {
        const database = await initDB();
        const BATCH_SIZE = 50;
        let lastKey = null;

        while (true) {
            const tx = database.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            let cursor;

            if (lastKey !== null) {
                cursor = await store.openCursor(IDBKeyRange.lowerBound(lastKey, true));
            } else {
                cursor = await store.openCursor();
            }

            const batch = [];

            while (cursor && batch.length < BATCH_SIZE) {
                batch.push(cursor.value);
                lastKey = cursor.key;
                cursor = await cursor.continue();
            }

            if (batch.length === 0) break;

            for (const item of batch) {
                await callback(item);
            }

            if (batch.length < BATCH_SIZE) break;
        }
    },
    async put(storeName, value, key) {
        const database = await initDB();

        try {
            // For out-of-line stores, use the provided key
            // For stores with keyPath (id), the key is extracted from value automatically
            if (OUT_OF_LINE_STORES.includes(storeName)) {
                // For out-of-line stores, key is required
                const storeKey = key || value?.id;
                if (!storeKey) {
                    throw new Error(`Key is required for store '${storeName}' which uses out-of-line keys`);
                }
                return await database.put(storeName, value, storeKey);
            }
            return await database.put(storeName, value);
        } catch (error) {
            // =============================================================================
            // NOTE: [Resilience][Implemented] QUOTA_ERROR_STANDARDIZATION
            // =============================================================================
            // This code correctly standardizes quota errors across browsers:
            // - Chrome/Safari: 'QuotaExceededError'
            // - Firefox: 'NS_ERROR_DOM_QUOTA_REACHED'
            // - Fallback: message.includes('quota')
            //
            // Enhanced error includes: storeName, key for debugging
            //
            // OPTIONAL ENHANCEMENT:
            // Dispatch UI notification for user awareness:
            // window.dispatchEvent(new CustomEvent('storage-quota-warning', {
            //     detail: { store: storeName, key, error: enhancedError }
            // }));
            //
            // Effort: S | Impact: Low (UX improvement, not critical)
            // =============================================================================
            // Standardize QuotaExceededError across browsers
            if (error.name === 'QuotaExceededError' ||
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                (error.message && error.message.includes('quota'))) {

                const enhancedError = new Error(`Storage quota exceeded while writing to ${storeName}`);
                enhancedError.name = 'QuotaExceededError';
                enhancedError.store = storeName;
                enhancedError.key = key;
                throw enhancedError;
            }
            throw error;
        }
    },
    async delete(storeName, key) {
        const database = await initDB();
        return database.delete(storeName, key);
    },
    // Clear entire store - much faster than sequential deletes
    async clear(storeName) {
        const database = await initDB();
        const tx = database.transaction(storeName, 'readwrite');
        await tx.objectStore(storeName).clear();
        await tx.done;
    },
    // Get all keys in a store
    async getAllKeys(storeName) {
        const database = await initDB();
        return database.getAllKeys(storeName);
    },
    // Batch operations for bulk performance
    batchPut,
    batchDelete,

    // Index querying
    async getAllFromIndex(storeName, indexName, key) {
        const database = await initDB();
        return database.getAllFromIndex(storeName, indexName, key);
    },
};
