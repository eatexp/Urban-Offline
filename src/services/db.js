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
        // For web compatibility, extract id from value if key not provided
        const itemKey = key || value?.id;
        return NativeStorage.put(storeName, value, itemKey);
    },
    async delete(storeName, key) {
        return NativeStorage.deleteItem(storeName, key);
    }
} : webDB;

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