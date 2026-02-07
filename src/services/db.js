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
    }
};

// Helper to init
export const initStorage = async () => {
    if (isNative) {
        await NativeStorage.initDB();
    } else {
        await initWebDB();
    }
};

// Export sync function for content
export { contentSync } from './contentSync';