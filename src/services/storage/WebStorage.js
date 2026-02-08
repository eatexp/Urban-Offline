import { openDB, deleteDB } from 'idb';

const DB_NAME = 'urban-offline-db';
const DB_VERSION = 5; // Bumped for ink_stories store

// Stores that use out-of-line keys (no keyPath)
const OUT_OF_LINE_STORES = ['map_tiles', 'search_index', 'dataset_preferences', 'user_context', 'ink_stories'];

/**
 * Complete schema definition - single source of truth for all object stores.
 * Used by both the primary upgrade path and the corruption recovery path.
 */
const DB_SCHEMA = [
    { name: 'datasets', options: { keyPath: 'id' } },
    { name: 'data_content', options: { keyPath: 'id' } },
    { name: 'guides', options: { keyPath: 'id' } },
    { name: 'guide_content', options: { keyPath: 'id' } },
    { name: 'map_tiles', options: undefined },
    { name: 'health_content', options: { keyPath: 'id' } },
    { name: 'survival_content', options: { keyPath: 'id' } },
    { name: 'law_content', options: { keyPath: 'id' } },
    { name: 'search_index', options: undefined },
    { name: 'ai_models', options: { keyPath: 'id' } },
    { name: 'content_packs', options: { keyPath: 'id' } },
    { name: 'dataset_preferences', options: undefined },
    { name: 'user_context', options: undefined },
    { name: 'ink_stories', options: undefined },
    { name: 'clawdBot_memory', options: undefined },
];

/**
 * Apply the database schema - creates any missing object stores.
 * @param {IDBDatabase} db - The database instance from the upgrade callback
 */
const applySchema = (db) => {
    for (const store of DB_SCHEMA) {
        if (!db.objectStoreNames.contains(store.name)) {
            if (store.options) {
                db.createObjectStore(store.name, store.options);
            } else {
                db.createObjectStore(store.name);
            }
        }
    }
};

/**
 * Dispatch recovery event to UI
 * @param {boolean} recovered - Whether recovery was successful
 * @param {Error|null} error - Error if recovery failed
 */
const dispatchRecoveryEvent = (recovered, error = null) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('indexeddb-recovery', {
            detail: {
                recovered,
                error: error?.message,
                timestamp: new Date().toISOString()
            }
        }));
    }
};

export const initDB = async () => {
    try {
        return await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                applySchema(db);
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

                // Retry once with the same schema
                const db = await openDB(DB_NAME, DB_VERSION, {
                    upgrade(db) {
                        applySchema(db);
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
};
