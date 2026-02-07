import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { SCHEMA_SQL } from './schema';
import { createLogger } from '../../utils/logger';

const log = createLogger('NativeStorage');
const mSQLite = new SQLiteConnection(CapacitorSQLite);
let db = null; // SQLite DB Connection

// VERIFIED: [Resilience] NATIVE_STORAGE_QUOTA_HANDLING
// Added detection for "no space" errors on Filesystem writes with event dispatch

/**
 * Get the appropriate storage directory for the current platform.
 * Windows native uses Directory.Data instead of Directory.Documents.
 * @returns {string} Directory constant from @capacitor/filesystem
 */
const getStorageDirectory = () => {
    const platform = Capacitor.getPlatform();
    // Windows native works better with Data directory
    if (platform === 'electron' || platform === 'windows') {
        return Directory.Data;
    }
    // iOS/Android use Documents
    return Directory.Documents;
};

// Cache the directory to avoid repeated platform checks
const STORAGE_DIR = getStorageDirectory();

export const initDB = async () => {
    try {
        const ret = await mSQLite.checkConnectionsConsistency();
        const isConn = (await mSQLite.isConnection("urban_offline", false)).result;

        if (ret.result && isConn) {
            db = await mSQLite.retrieveConnection("urban_offline", false);
        } else {
            db = await mSQLite.createConnection("urban_offline", false, "no-encryption", 1);
        }

        await db.open();

        // Execute Schema
        await db.execute(SCHEMA_SQL);
        // Create Generic Key-Value Table for Metadata (keeping this for legacy/compat if needed)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS kv_store (
                store_name TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT,
                PRIMARY KEY (store_name, key)
            );
        `);
        log.info('Native SQLite Storage initialized');
    } catch (e) {
        log.error('Failed to init SQLite', e);
    }
};

export const getDBConnection = async () => {
    if (!db) await initDB();
    return db;
};

const DATA_STORES = ['data_content', 'map_tiles', 'guide_content', 'health_content', 'survival_content', 'law_content'];

export const get = async (storeName, key) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            const file = await Filesystem.readFile({
                path: `${storeName}/${key}`,
                directory: STORAGE_DIR,
                encoding: Encoding.UTF8
            });
            return JSON.parse(file.data);
        } catch (_error) {
            // File doesn't exist or read failed - return null
            return null;
        }
    }

    // 2. Metadata -> SQLite
    if (!db) await initDB();
    try {
        const res = await db.query(`SELECT value FROM kv_store WHERE store_name = ? AND key = ?`, [storeName, key]);
        if (res.values && res.values.length > 0) {
            return JSON.parse(res.values[0].value);
        }
    } catch (e) {
        log.error('SQLite Get Error', e);
    }
    return null;
};

export const put = async (storeName, value, key) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            await Filesystem.mkdir({
                path: storeName,
                directory: STORAGE_DIR,
                recursive: true
            });
            await Filesystem.writeFile({
                path: `${storeName}/${key}`,
                data: JSON.stringify(value),
                directory: STORAGE_DIR,
                encoding: Encoding.UTF8
            });
            return key;
        } catch (e) {
            // P1 FIX: Detect "no space" errors and dispatch warning event
            const errorMsg = e.message?.toLowerCase() || '';
            if (errorMsg.includes('no space') ||
                errorMsg.includes('enospc') ||
                errorMsg.includes('disk is full') ||
                errorMsg.includes('not enough storage')) {
                log.error('Storage quota exceeded on device', e);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('storage-quota-warning', {
                        detail: { store: storeName, key, error: e.message }
                    }));
                }
                const quotaError = new Error('Storage quota exceeded on device');
                quotaError.name = 'QuotaExceededError';
                quotaError.store = storeName;
                quotaError.key = key;
                throw quotaError;
            }
            log.error('FS Write Error', e);
            throw e;
        }
    }

    // 2. Metadata -> SQLite
    if (!db) await initDB();
    try {
        const strVal = JSON.stringify(value);
        await db.run(`INSERT OR REPLACE INTO kv_store (store_name, key, value) VALUES (?, ?, ?)`, [storeName, key, strVal]);
        return key;
    } catch (e) {
        log.error('SQLite Put Error', e);
        throw e;
    }
};

export const getAll = async (storeName) => {
    if (!db) await initDB();
    try {
        const res = await db.query(`SELECT value FROM kv_store WHERE store_name = ?`, [storeName]);
        if (res.values) {
            return res.values.map(v => JSON.parse(v.value));
        }
        return [];
    } catch (e) {
        log.error('SQLite getAll Error', e);
        return [];
    }
};

export const iterate = async (storeName, callback) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            const result = await Filesystem.readdir({
                path: storeName,
                directory: STORAGE_DIR
            });

            for (const file of result.files) {
                const fileName = file.name || file; // Handle object or string

                try {
                    const fileContent = await Filesystem.readFile({
                        path: `${storeName}/${fileName}`,
                        directory: STORAGE_DIR,
                        encoding: Encoding.UTF8
                    });
                    await callback(JSON.parse(fileContent.data));
                } catch (readErr) {
                    log.warn(`Failed to read file ${fileName} in store ${storeName}`, readErr);
                }
            }
        } catch (_error) {
            // Directory doesn't exist or other error -> assume empty
            log.debug(`Store directory ${storeName} not found or empty`);
        }
        return;
    }

    // 2. Metadata -> SQLite
    if (!db) await initDB();
    try {
        const res = await db.query(`SELECT value FROM kv_store WHERE store_name = ?`, [storeName]);
        if (res.values) {
            for (const row of res.values) {
                await callback(JSON.parse(row.value));
            }
        }
    } catch (e) {
        log.error('SQLite Iterate Error', e);
    }
};

export const deleteItem = async (storeName, key) => {
    if (DATA_STORES.includes(storeName)) {
        try {
            await Filesystem.deleteFile({
                path: `${storeName}/${key}`,
                directory: STORAGE_DIR
            });
        } catch (_error) {
            // File doesn't exist - ignore
        }
    }

    if (!db) await initDB();
    await db.run(`DELETE FROM kv_store WHERE store_name = ? AND key = ?`, [storeName, key]);
};

/**
 * Clear all items from a store
 * @param {string} storeName - Store to clear
 */
export const clear = async (storeName) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            const result = await Filesystem.readdir({
                path: storeName,
                directory: STORAGE_DIR
            });
            await Promise.all(result.files.map(file =>
                Filesystem.deleteFile({
                    path: `${storeName}/${file.name || file}`,
                    directory: STORAGE_DIR
                }).catch(() => { }) // Ignore individual file delete failures
            ));
        } catch (_e) {
            // Directory doesn't exist - ignore
        }
    }

    // 2. Metadata -> SQLite
    if (!db) await initDB();
    await db.run(`DELETE FROM kv_store WHERE store_name = ?`, [storeName]);
};

/**
 * Get all keys from a store
 * @param {string} storeName - Store to enumerate
 * @returns {Promise<string[]>} Array of keys
 */
export const getAllKeys = async (storeName) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            const result = await Filesystem.readdir({
                path: storeName,
                directory: STORAGE_DIR
            });
            return result.files.map(f => f.name || f);
        } catch (_e) {
            return []; // Directory doesn't exist
        }
    }

    // 2. Metadata -> SQLite
    if (!db) await initDB();
    const res = await db.query(`SELECT key FROM kv_store WHERE store_name = ?`, [storeName]);
    return res.values ? res.values.map(r => r.key) : [];
};

export const getArticleBySlug = async (slug) => {
    if (!db) await initDB();
    try {
        // Query the 'articles' table
        const res = await db.query(`SELECT * FROM articles WHERE slug = ? LIMIT 1`, [slug]);
        if (res.values && res.values.length > 0) {
            return res.values[0];
        }
    } catch (e) {
        log.error('SQLite getArticleBySlug Error', e);
    }
    return null;
};

// VERIFIED: [Performance] NATIVE_STORAGE_BATCH_OPERATIONS
// Added batch operations using SQLite transactions for performance

/**
 * Batch put multiple items in a single transaction
 * @param {string} storeName - Store name
 * @param {Array<{key: string, value: any}>} items - Items to put
 */
export const batchPut = async (storeName, items) => {
    if (!db) await initDB();
    try {
        await db.execute('BEGIN TRANSACTION');
        for (const item of items) {
            await db.run(
                `INSERT OR REPLACE INTO kv_store (store_name, key, value) VALUES (?, ?, ?)`,
                [storeName, item.key, JSON.stringify(item.value)]
            );
        }
        await db.execute('COMMIT');
    } catch (e) {
        await db.execute('ROLLBACK');
        log.error('SQLite batchPut Error', e);
        throw e;
    }
};

/**
 * Batch delete multiple items in a single transaction
 * @param {string} storeName - Store name
 * @param {string[]} keys - Keys to delete
 */
export const batchDelete = async (storeName, keys) => {
    if (!db) await initDB();
    try {
        await db.execute('BEGIN TRANSACTION');
        for (const key of keys) {
            await db.run(
                `DELETE FROM kv_store WHERE store_name = ? AND key = ?`,
                [storeName, key]
            );
        }
        await db.execute('COMMIT');
    } catch (e) {
        await db.execute('ROLLBACK');
        log.error('SQLite batchDelete Error', e);
        throw e;
    }
};
