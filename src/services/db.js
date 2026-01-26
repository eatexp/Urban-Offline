import { Capacitor } from '@capacitor/core';
import { initDB as initWebDB, db as webDB } from './storage/WebStorage';
import * as NativeStorage from './storage/NativeStorage';

const isNative = Capacitor.isNativePlatform();

// For web, use the exported db object from WebStorage
// For native, create a compatible wrapper around NativeStorage functions
export const db = isNative ? {
    async get(storeName, key) {
        return NativeStorage.get(storeName, key);
    },
    async getAll(storeName) {
        return NativeStorage.getAll(storeName);
    },
    async put(storeName, value, key) {
        const itemKey = key || value?.id;
        // TODO: Resilience - Handle QuotaExceededError globally if possible, or ensure callers handle it.
        // Consider catching QuotaExceededError here and returning a specific failure code or event.
        return NativeStorage.put(storeName, value, itemKey);
    },
    async delete(storeName, key) {
        return NativeStorage.deleteItem(storeName, key);
    },
    async putAll(storeName, items) {
        return NativeStorage.putAll(storeName, items);
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