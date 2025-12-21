import { openDB } from 'idb';

const DB_NAME = 'urban-offline-db';
const DB_VERSION = 2; // Bumped for new stores

// Stores that use out-of-line keys (no keyPath)
const OUT_OF_LINE_STORES = ['map_tiles', 'search_index'];

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, _oldVersion) {
            // Store for dataset metadata (id, name, description, size, installed)
            if (!db.objectStoreNames.contains('datasets')) {
                db.createObjectStore('datasets', { keyPath: 'id' });
            }
            // Store for actual data content (id, geojson/json data)
            if (!db.objectStoreNames.contains('data_content')) {
                db.createObjectStore('data_content', { keyPath: 'id' });
            }

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
        },
    });
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
    /**
     * Put a value in the store
     * @param {string} storeName - Store name
     * @param {any} value - Value to store
     * @param {string} [key] - Optional key for out-of-line stores (required for stores without keyPath)
     */
    async put(storeName, value, key) {
        const database = await initDB();
        // For out-of-line stores, use the provided key
        // For stores with keyPath (id), the key is extracted from value automatically
        if (OUT_OF_LINE_STORES.includes(storeName)) {
            // For out-of-line stores, key is required
            const storeKey = key || value?.id;
            if (!storeKey) {
                throw new Error(`Key is required for store '${storeName}' which uses out-of-line keys`);
            }
            return database.put(storeName, value, storeKey);
        }
        return database.put(storeName, value);
    },
    async delete(storeName, key) {
        const database = await initDB();
        return database.delete(storeName, key);
    },
};
