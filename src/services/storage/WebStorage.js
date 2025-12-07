import { openDB } from 'idb';

const DB_NAME = 'urban-offline-db';
const DB_VERSION = 2; // Bumped for new ink_state store

// Connection pooling: single cached instance
let dbInstance = null;
let dbInitPromise = null;

// Custom error for storage quota exceeded
export class StorageQuotaError extends Error {
    constructor(message = 'Storage quota exceeded') {
        super(message);
        this.name = 'StorageQuotaError';
    }
}

export const initDB = async () => {
    // Return cached instance if available
    if (dbInstance) {
        return dbInstance;
    }

    // Prevent concurrent initialization (mutex pattern)
    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = openDB(DB_NAME, DB_VERSION, {
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

            // Ink story state persistence (for triage crash recovery)
            if (!db.objectStoreNames.contains('ink_state')) {
                db.createObjectStore('ink_state');
            }
        },
    });

    try {
        dbInstance = await dbInitPromise;
        return dbInstance;
    } catch (error) {
        dbInitPromise = null; // Reset on failure to allow retry
        throw error;
    }
};

// Helper to detect quota exceeded errors
const isQuotaError = (error) => {
    return (
        error?.name === 'QuotaExceededError' ||
        error?.code === 22 || // Legacy Safari
        error?.code === 1014 || // Firefox
        (error?.name === 'NS_ERROR_DOM_QUOTA_REACHED') // Firefox
    );
};

export const db = {
    async get(storeName, key) {
        try {
            const database = await initDB();
            return await database.get(storeName, key);
        } catch (error) {
            console.error(`WebStorage get error [${storeName}/${key}]:`, error);
            throw error;
        }
    },

    async getAll(storeName) {
        try {
            const database = await initDB();
            return await database.getAll(storeName);
        } catch (error) {
            console.error(`WebStorage getAll error [${storeName}]:`, error);
            throw error;
        }
    },

    async getAllKeys(storeName) {
        try {
            const database = await initDB();
            return await database.getAllKeys(storeName);
        } catch (error) {
            console.error(`WebStorage getAllKeys error [${storeName}]:`, error);
            throw error;
        }
    },

    async put(storeName, value, key) {
        try {
            const database = await initDB();
            // For stores without keyPath, key must be provided as third arg
            if (key !== undefined) {
                return await database.put(storeName, value, key);
            }
            return await database.put(storeName, value);
        } catch (error) {
            if (isQuotaError(error)) {
                console.error('Storage quota exceeded');
                throw new StorageQuotaError('Device storage is full. Please free up space.');
            }
            console.error(`WebStorage put error [${storeName}]:`, error);
            throw error;
        }
    },

    async delete(storeName, key) {
        try {
            const database = await initDB();
            return await database.delete(storeName, key);
        } catch (error) {
            console.error(`WebStorage delete error [${storeName}/${key}]:`, error);
            throw error;
        }
    },
};
