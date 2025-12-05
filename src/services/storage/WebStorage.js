import { openDB } from 'idb';

const DB_NAME = 'urban-offline-db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
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

            // *** NEW STORES FOR HEALTH, SURVIVAL, LAW ***

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
                db.createObjectStore('search_index'); // key: 'main_index', value: serialized data
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
    async put(storeName, value) {
        const database = await initDB();
        return database.put(storeName, value);
    },
    async delete(storeName, key) {
        const database = await initDB();
        return database.delete(storeName, key);
    },
};
