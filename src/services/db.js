import { Capacitor } from '@capacitor/core';
import { initDB as initWebDB, db as webDB } from './storage/WebStorage';
import * as NativeStorage from './storage/NativeStorage';

const isNative = Capacitor.isNativePlatform();

// VERIFIED: [Resilience] WEB_STORAGE_QUOTA_HANDLING_INCONSISTENT
// Added try/catch wrapper for web db.put() with consistent QuotaExceededError handling

// For web, use the exported db object from WebStorage
// For native, create a compatible wrapper around NativeStorage functions
export const db = isNative ? {
    async get(storeName, key) {
        return NativeStorage.get(storeName, key);
    },
    async getAll(storeName) {
        return NativeStorage.getAll(storeName);
    },
    async iterate(storeName, callback) {
        return NativeStorage.iterate(storeName, callback);
    },
    async put(storeName, value, key) {
        const itemKey = key || value?.id;
        // Global quota error handling - wrap all storage operations
        try {
            return await NativeStorage.put(storeName, value, itemKey);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                const enhancedError = new Error(`Storage quota exceeded while writing to ${storeName}`);
                enhancedError.name = 'QuotaExceededError';
                enhancedError.store = storeName;
                enhancedError.key = itemKey;
                // Dispatch event for consistent UI handling with web platform
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('storage-quota-warning', {
                        detail: { store: storeName, key: itemKey, error: enhancedError.message }
                    }));
                }
                throw enhancedError;
            }
            throw error;
        }
    },
    async delete(storeName, key) {
        return NativeStorage.deleteItem(storeName, key);
    },
    async clear(storeName) {
        return NativeStorage.clear(storeName);
    },
    async getAllKeys(storeName) {
        return NativeStorage.getAllKeys(storeName);
    },
    // Alias methods for compatibility with DatasetRegistry
    async getItem(storeName, key) {
        return this.get(storeName, key);
    },
    async setItem(storeName, key, value) {
        return this.put(storeName, value, key);
    }
} : {
    ...webDB,
    // P1 FIX: Add quota handling wrapper for web platform
    async put(storeName, value, key) {
        try {
            return await webDB.put(storeName, value, key);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                error.store = storeName;
                error.key = key;
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('storage-quota-warning', {
                        detail: { store: storeName, key, error: error.message }
                    }));
                }
            }
            throw error;
        }
    },
    // Add alias methods for consistency
    async getItem(storeName, key) {
        return this.get(storeName, key);
    },
    async setItem(storeName, key, value) {
        return this.put(storeName, value, key);
    },
    async getAllFromIndex(storeName, indexName, key) {
        return webDB.getAllFromIndex(storeName, indexName, key);
    }
};

// VERIFIED: [Resilience] DB_REOPEN_STRATEGY
// Recovery strategy for corrupted databases or version mismatches
// If opening fails with VersionError or generic failure, delete and retry once.
export const initStorage = async () => {
    if (isNative) {
        try {
            await NativeStorage.initDB();
        } catch (error) {
            console.error('Failed to init NativeStorage, attempting recovery', error);
            // NativeStorage might not support delete/re-init easily depending on implementation
            // but we re-throw for now or handle specific known native errors
            throw error;
        }
    } else {
        try {
            await initWebDB();
        } catch (error) {
            console.error('Failed to init WebDB, attempting recovery', error);

            // Check for specific corruption errors
            const isCorruption = error.name === 'VersionError' ||
                error.name === 'UnknownError' ||
                error.message?.includes('versions');

            if (isCorruption) {
                console.warn('Database corruption detected. Wiping and recreating...');
                try {
                    // Assuming WebStorage exports a way to delete or we use indexedDB directly
                    await new Promise((resolve, reject) => {
                        const freq = indexedDB.deleteDatabase('urban_offline_db'); // Replace with actual DB name if different
                        freq.onsuccess = () => resolve();
                        freq.onerror = (e) => reject(e);
                        freq.onblocked = () => console.warn('Delete blocked');
                    });
                    await initWebDB();
                    console.info('Database recovered successfully');

                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('db-recovered'));
                    }
                } catch (retryError) {
                    console.error('Fatal: Failed to recover database', retryError);
                    throw retryError;
                }
            } else {
                throw error;
            }
        }
    }
};

// Export sync function for content
export { contentSync } from './contentSync';