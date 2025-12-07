import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { SCHEMA_SQL } from './schema';

const mSQLite = new SQLiteConnection(CapacitorSQLite);
let sqliteConn = null; // SQLite DB Connection
let dbInitPromise = null; // Mutex for initialization

// Custom error for storage quota exceeded
export class StorageQuotaError extends Error {
    constructor(message = 'Storage quota exceeded') {
        super(message);
        this.name = 'StorageQuotaError';
    }
}

// Helper to detect disk space errors
const isDiskSpaceError = (error) => {
    const msg = error?.message?.toLowerCase() || '';
    return (
        msg.includes('no space') ||
        msg.includes('disk full') ||
        msg.includes('quota') ||
        msg.includes('enospc') ||
        error?.code === 'ENOSPC'
    );
};

export const initDB = async () => {
    // Return existing connection
    if (sqliteConn) {
        return sqliteConn;
    }

    // Prevent concurrent initialization (mutex pattern)
    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = (async () => {
        try {
            const ret = await mSQLite.checkConnectionsConsistency();
            const isConn = (await mSQLite.isConnection("urban_offline", false)).result;

            if (ret.result && isConn) {
                sqliteConn = await mSQLite.retrieveConnection("urban_offline", false);
            } else {
                sqliteConn = await mSQLite.createConnection("urban_offline", false, "no-encryption", 1);
            }

            await sqliteConn.open();

            // Execute Schema
            await sqliteConn.execute(SCHEMA_SQL);

            // Create Generic Key-Value Table for Metadata
            await sqliteConn.execute(`
                CREATE TABLE IF NOT EXISTS kv_store (
                    store_name TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT,
                    PRIMARY KEY (store_name, key)
                );
            `);

            // Create ink_state table for triage persistence
            await sqliteConn.execute(`
                CREATE TABLE IF NOT EXISTS ink_state (
                    story_id TEXT PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            `);

            console.log("Native SQLite Storage Initialized with Schema");
            return sqliteConn;
        } catch (e) {
            console.error("Failed to init SQLite", e);
            dbInitPromise = null; // Reset to allow retry
            throw e;
        }
    })();

    return dbInitPromise;
};

export const getDBConnection = async () => {
    if (sqliteConn) return sqliteConn;
    return await initDB();
};

const DATA_STORES = ['data_content', 'map_tiles', 'guide_content', 'health_content', 'survival_content', 'law_content', 'ink_state'];

export const get = async (storeName, key) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            const file = await Filesystem.readFile({
                path: `${storeName}/${key}`,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
            return JSON.parse(file.data);
        } catch {
            // File not found is expected, don't log
            return null;
        }
    }

    // 2. Metadata -> SQLite
    const database = await getDBConnection();
    try {
        const res = await database.query(
            `SELECT value FROM kv_store WHERE store_name = ? AND key = ?`,
            [storeName, key]
        );
        if (res.values && res.values.length > 0) {
            return JSON.parse(res.values[0].value);
        }
    } catch (e) {
        console.error(`NativeStorage get error [${storeName}/${key}]:`, e);
        throw e;
    }
    return null;
};

export const put = async (storeName, value, key) => {
    // 1. Large Content -> Filesystem
    if (DATA_STORES.includes(storeName)) {
        try {
            await Filesystem.mkdir({
                path: storeName,
                directory: Directory.Documents,
                recursive: true
            });
            await Filesystem.writeFile({
                path: `${storeName}/${key}`,
                data: JSON.stringify(value),
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
            return key;
        } catch (e) {
            if (isDiskSpaceError(e)) {
                throw new StorageQuotaError('Device storage is full. Please free up space.');
            }
            console.error(`NativeStorage FS write error [${storeName}/${key}]:`, e);
            throw e;
        }
    }

    // 2. Metadata -> SQLite
    const database = await getDBConnection();
    try {
        const strVal = JSON.stringify(value);
        await database.run(
            `INSERT OR REPLACE INTO kv_store (store_name, key, value) VALUES (?, ?, ?)`,
            [storeName, key, strVal]
        );
        return key;
    } catch (e) {
        if (isDiskSpaceError(e)) {
            throw new StorageQuotaError('Device storage is full. Please free up space.');
        }
        console.error(`NativeStorage SQLite put error [${storeName}]:`, e);
        throw e;
    }
};

export const getAll = async (storeName) => {
    const database = await getDBConnection();
    try {
        const res = await database.query(
            `SELECT value FROM kv_store WHERE store_name = ?`,
            [storeName]
        );
        if (res.values) {
            return res.values.map(v => JSON.parse(v.value));
        }
        return [];
    } catch (e) {
        console.error(`NativeStorage getAll error [${storeName}]:`, e);
        return [];
    }
};

export const getAllKeys = async (storeName) => {
    // For filesystem-backed stores, list directory contents
    if (DATA_STORES.includes(storeName)) {
        try {
            const result = await Filesystem.readdir({
                path: storeName,
                directory: Directory.Documents
            });
            return result.files.map(f => f.name);
        } catch {
            // Directory doesn't exist yet
            return [];
        }
    }

    // For SQLite-backed stores
    const database = await getDBConnection();
    try {
        const res = await database.query(
            `SELECT key FROM kv_store WHERE store_name = ?`,
            [storeName]
        );
        if (res.values) {
            return res.values.map(v => v.key);
        }
        return [];
    } catch (e) {
        console.error(`NativeStorage getAllKeys error [${storeName}]:`, e);
        return [];
    }
};

export const deleteItem = async (storeName, key) => {
    // 1. Delete from filesystem if applicable
    if (DATA_STORES.includes(storeName)) {
        try {
            await Filesystem.deleteFile({
                path: `${storeName}/${key}`,
                directory: Directory.Documents
            });
        } catch (e) {
            // File may not exist, which is fine
            console.warn(`NativeStorage delete file warning [${storeName}/${key}]:`, e.message);
        }
    }

    // 2. Delete from SQLite
    const database = await getDBConnection();
    try {
        await database.run(
            `DELETE FROM kv_store WHERE store_name = ? AND key = ?`,
            [storeName, key]
        );
    } catch (e) {
        console.error(`NativeStorage SQLite delete error [${storeName}/${key}]:`, e);
        throw e;
    }
};

// Renamed export for compatibility with db.js adapter pattern
export const db = {
    get,
    put,
    getAll,
    getAllKeys,
    delete: deleteItem
};

export const getArticleBySlug = async (slug) => {
    const database = await getDBConnection();
    try {
        const res = await database.query(
            `SELECT * FROM articles WHERE slug = ? LIMIT 1`,
            [slug]
        );
        if (res.values && res.values.length > 0) {
            return res.values[0];
        }
    } catch (e) {
        console.error(`NativeStorage getArticleBySlug error [${slug}]:`, e);
    }
    return null;
};

// Ink state persistence helpers
export const saveInkState = async (storyId, stateJson) => {
    const database = await getDBConnection();
    try {
        await database.run(
            `INSERT OR REPLACE INTO ink_state (story_id, state_json, updated_at) VALUES (?, ?, ?)`,
            [storyId, stateJson, new Date().toISOString()]
        );
    } catch (e) {
        console.error(`NativeStorage saveInkState error [${storyId}]:`, e);
        throw e;
    }
};

export const getInkState = async (storyId) => {
    const database = await getDBConnection();
    try {
        const res = await database.query(
            `SELECT state_json FROM ink_state WHERE story_id = ? LIMIT 1`,
            [storyId]
        );
        if (res.values && res.values.length > 0) {
            return res.values[0].state_json;
        }
    } catch (e) {
        console.error(`NativeStorage getInkState error [${storyId}]:`, e);
    }
    return null;
};

export const clearInkState = async (storyId) => {
    const database = await getDBConnection();
    try {
        await database.run(`DELETE FROM ink_state WHERE story_id = ?`, [storyId]);
    } catch (e) {
        console.error(`NativeStorage clearInkState error [${storyId}]:`, e);
    }
};
