import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { SCHEMA_SQL } from './schema';

const mSQLite = new SQLiteConnection(CapacitorSQLite);
let db = null; // SQLite DB Connection

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
        console.log("Native SQLite Storage Initialized with Schema");
    } catch (e) {
        console.error("Failed to init SQLite", e);
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
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
            return JSON.parse(file.data);
        } catch (e) {
            // console.warn("FS Read Fail", storeName, key, e);
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
        console.error("SQLite Get Error", e);
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
            console.error("FS Write Error", e);
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
        console.error("SQLite Put Error", e);
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
        console.error("SQLite getAll Error", e);
        return [];
    }
};

export const deleteItem = async (storeName, key) => {
    if (DATA_STORES.includes(storeName)) {
        try {
            await Filesystem.deleteFile({
                path: `${storeName}/${key}`,
                directory: Directory.Documents
            });
        } catch (e) { }
    }

    if (!db) await initDB();
    await db.run(`DELETE FROM kv_store WHERE store_name = ? AND key = ?`, [storeName, key]);
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
        console.error("SQLite getArticleBySlug Error", e);
    }
    return null;
};
