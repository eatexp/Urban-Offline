import { Capacitor } from '@capacitor/core';
import * as WebStorage from './storage/WebStorage';
import * as NativeStorage from './storage/NativeStorage';

const isNative = Capacitor.isNativePlatform();

// Export the db interface (get, put, getAll, getAllKeys, delete)
export const db = isNative ? NativeStorage.db : WebStorage.db;

// Export quota error for handling
export const StorageQuotaError = isNative
    ? NativeStorage.StorageQuotaError
    : WebStorage.StorageQuotaError;

// Helper to init storage
export const initStorage = async () => {
    if (isNative) {
        await NativeStorage.initDB();
    } else {
        await WebStorage.initDB();
    }
};

// Platform-specific helpers (for article fetching that requires DB-specific queries)
export const getArticleBySlug = async (slug) => {
    if (isNative) {
        return await NativeStorage.getArticleBySlug(slug);
    }

    // Web: search across all content stores for matching slug
    const contentStores = ['health_content', 'survival_content', 'law_content', 'guide_content'];

    for (const storeName of contentStores) {
        try {
            const allItems = await WebStorage.db.getAll(storeName);
            const article = allItems.find(item => item.slug === slug || item.id === slug);
            if (article) {
                return article;
            }
        } catch (error) {
            console.warn(`Error searching ${storeName} for slug:`, error);
        }
    }

    return null;
};

// Ink state persistence helpers (cross-platform)
export const saveInkState = async (storyId, stateJson) => {
    if (isNative) {
        await NativeStorage.saveInkState(storyId, stateJson);
    } else {
        await WebStorage.db.put('ink_state', { storyId, stateJson }, storyId);
    }
};

export const getInkState = async (storyId) => {
    if (isNative) {
        return await NativeStorage.getInkState(storyId);
    }
    const result = await WebStorage.db.get('ink_state', storyId);
    return result?.stateJson || null;
};

export const clearInkState = async (storyId) => {
    if (isNative) {
        await NativeStorage.clearInkState(storyId);
    } else {
        await WebStorage.db.delete('ink_state', storyId);
    }
};
