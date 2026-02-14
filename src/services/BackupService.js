/**
 * BackupService.js — "Ark Snapshot" backup/restore
 *
 * Exports the "Soul" of the app (settings, chat history, user context,
 * cartridge registry) as a .ark file (ZIP). Never touches heavy assets
 * (ZIM files, model weights, vector indices).
 *
 * Export: read stores → JSON → JSZip bundle → Blob
 * Import: Blob → JSZip → validate manifest → restore stores → warn on missing cartridges
 *
 * SQLite non-locking strategy: all reads go through the existing storage
 * abstraction (db.get / db.getAll) which serializes without file-level locks.
 */

import JSZip from 'jszip';
import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('BackupService');

// ── App metadata ─────────────────────────────────────────────────
const APP_VERSION = '1.0.0'; // TODO: pull from package.json or env
const ARK_FORMAT_VERSION = 1;
const ARK_MIME = 'application/zip';
const ARK_EXTENSION = '.ark';

// ── "Soul" stores — everything we back up ────────────────────────
// explicitKeys: use specific keys. If null, fetch ALL keys (e.g. chat history).
const SOUL_STORES = [
    { store: 'user_context', filename: 'user_context.json', explicitKeys: ['inventory', 'medical', 'location', 'resources'] },
    { store: 'dataset_preferences', filename: 'dataset_preferences.json', explicitKeys: ['current', 'regions_manifest'] },
    { store: 'clawdBot_memory', filename: 'chat_history.json', explicitKeys: null }, // Dynamic keys (conversations + messages:*)
];

// localStorage keys that belong to the "Soul"
const LOCALSTORAGE_KEYS = [
    'native_index_complete',
    'smart_download_dismissed',
];

// Fields to exclude from backup (heavy assets or device-specific paths)
const EXCLUDED_FIELDS = ['zim_file_paths', 'vector_indices'];

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Recursively remove excluded fields from an object/array.
 */
function cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    }

    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (EXCLUDED_FIELDS.includes(key)) continue;
        newObj[key] = cleanObject(value);
    }
    return newObj;
}

// ═══════════════════════════════════════════════════════════════════
// CREATE SNAPSHOT — Export
// ═══════════════════════════════════════════════════════════════════

/**
 * Bundle the app's "Soul" into an .ark ZIP blob.
 * @returns {Promise<{blob: Blob, filename: string}>}
 */
export async function createSnapshot() {
    const zip = new JSZip();
    const timestamp = new Date().toISOString();
    const storesIncluded = [];

    // ── 1. Soul stores (IndexedDB / SQLite) ──────────────────────
    for (const { store, filename, explicitKeys } of SOUL_STORES) {
        try {
            const data = {};
            let keysToFetch = explicitKeys;

            // If no explicit keys, fetch ALL keys from the store
            if (!keysToFetch) {
                keysToFetch = await db.getAllKeys(store);
            }

            for (const key of keysToFetch) {
                const value = await db.get(store, key);
                if (value !== null && value !== undefined) {
                    // Cleanse value of heavy assets
                    data[key] = cleanObject(value);
                }
            }

            if (Object.keys(data).length > 0) {
                zip.file(filename, JSON.stringify(data, null, 2));
                storesIncluded.push(store);
                log.debug(`Exported ${store} (${Object.keys(data).length} keys)`);
            }
        } catch (e) {
            log.warn(`Failed to export ${store}`, e);
        }
    }

    // ── 2. localStorage settings ─────────────────────────────────
    const settings = {};
    for (const key of LOCALSTORAGE_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
            settings[key] = val;
        }
    }
    zip.file('settings.json', JSON.stringify(settings, null, 2));

    // ── 3. Manifest ──────────────────────────────────────────────
    const manifest = {
        formatVersion: ARK_FORMAT_VERSION,
        appVersion: APP_VERSION,
        timestamp,
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        storesIncluded,
        fileCount: Object.keys(zip.files).length + 1, // +1 for manifest itself
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // ── 4. Generate blob ─────────────────────────────────────────
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        mimeType: ARK_MIME,
    });

    const dateStr = timestamp.slice(0, 10).replace(/-/g, '');
    const filename = `urban-offline-${dateStr}${ARK_EXTENSION}`;

    log.info(`Snapshot created: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
    return { blob, filename };
}


// ═══════════════════════════════════════════════════════════════════
// RESTORE SNAPSHOT — Import
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate an .ark manifest.
 * @param {object} manifest
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateManifest(manifest) {
    if (!manifest) return { valid: false, error: 'No manifest found' };
    if (manifest.formatVersion !== ARK_FORMAT_VERSION) {
        return { valid: false, error: `Unsupported format version: ${manifest.formatVersion} (expected ${ARK_FORMAT_VERSION})` };
    }
    if (!manifest.timestamp) {
        return { valid: false, error: 'Manifest missing timestamp' };
    }
    return { valid: true };
}

/**
 * Restore an .ark snapshot.
 *
 * @param {File|Blob} file — the .ark file
 * @param {'merge'|'overwrite'} mode — how to handle existing data
 * @returns {Promise<{success: boolean, missingCartridges: string[], warnings: string[], stats: { conversations: number, preferences: number } }>}
 */
export async function restoreSnapshot(file, mode = 'overwrite') {
    const warnings = [];
    const missingCartridges = [];
    const stats = { conversations: 0, preferences: 0 };

    try {
        // ── 1. Open ZIP ──────────────────────────────────────────
        const zip = await JSZip.loadAsync(file);

        // ── 2. Validate manifest ─────────────────────────────────
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
            return { success: false, missingCartridges: [], warnings: ['Invalid .ark file: no manifest.json'], stats };
        }
        const manifest = JSON.parse(await manifestFile.async('text'));
        const validation = validateManifest(manifest);
        if (!validation.valid) {
            return { success: false, missingCartridges: [], warnings: [validation.error], stats };
        }

        log.info(`Restoring snapshot from ${manifest.timestamp} (v${manifest.appVersion})`);

        // ── 3. Restore soul stores ───────────────────────────────
        for (const { store, filename, explicitKeys } of SOUL_STORES) {
            const entry = zip.file(filename);
            if (!entry) {
                if (explicitKeys) log.debug(`Store "${store}" not found in snapshot`);
                continue;
            }

            try {
                const data = JSON.parse(await entry.async('text'));

                // Track stats
                if (store === 'clawdBot_memory') {
                    if (data.conversations && Array.isArray(data.conversations)) {
                        stats.conversations += data.conversations.length;
                    }
                } else {
                    stats.preferences += Object.keys(data).length;
                }

                if (mode === 'overwrite') {
                    // ── OVERWRITE MODE ───────────────────────────────
                    if (explicitKeys) {
                        for (const key of explicitKeys) {
                            try { await db.delete(store, key); } catch (_) { /* ignore */ }
                        }
                    } else {
                        // For dynamic store (chat history), overwrite means wipe it first
                        await db.clear(store);
                    }

                    // Write new data
                    for (const [key, value] of Object.entries(data)) {
                        await db.put(store, value, key);
                    }
                } else {
                    // ── MERGE MODE ───────────────────────────────────
                    if (store === 'clawdBot_memory') {
                        // Smart merge for Chat History

                        // 1. Merge Conversations Index
                        if (data.conversations && Array.isArray(data.conversations)) {
                            const existingConvs = (await db.get(store, 'conversations')) || [];

                            // Map by ID
                            const convMap = new Map(existingConvs.map(c => [c.id, c]));

                            for (const bConv of data.conversations) {
                                if (convMap.has(bConv.id)) {
                                    // Conflict: use the one with newer updatedAt
                                    const eConv = convMap.get(bConv.id);
                                    if (new Date(bConv.updatedAt) > new Date(eConv.updatedAt)) {
                                        convMap.set(bConv.id, bConv);
                                    }
                                } else {
                                    convMap.set(bConv.id, bConv);
                                }
                            }

                            const mergedConvs = Array.from(convMap.values())
                                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                            await db.put(store, mergedConvs, 'conversations');
                        }

                        // 2. Merge Messages
                        const messageKeys = Object.keys(data).filter(k => k.startsWith('messages:'));
                        for (const key of messageKeys) {
                            const backupMsgs = data[key];
                            const existingMsgs = (await db.get(store, key)) || [];

                            // Deduplicate by ID
                            const msgMap = new Map(existingMsgs.map(m => [m.id, m]));
                            for (const bMsg of backupMsgs) {
                                msgMap.set(bMsg.id, bMsg); // Overwrite with backup version (assumed newer/better)
                            }

                            // Sort by timestamp
                            const mergedMsgs = Array.from(msgMap.values())
                                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                            await db.put(store, mergedMsgs, key);
                        }

                    } else {
                        // Simple key-based merge for other stores
                        for (const [key, value] of Object.entries(data)) {
                            await db.put(store, value, key);
                        }
                    }
                }

                log.debug(`Restored ${store} (${Object.keys(data).length} keys)`);
            } catch (e) {
                warnings.push(`Failed to restore "${store}": ${e.message}`);
                log.error(`Failed to restore ${store}`, e);
            }
        }

        // ── 4. Restore localStorage settings ─────────────────────
        const settingsFile = zip.file('settings.json');
        if (settingsFile) {
            try {
                const settings = JSON.parse(await settingsFile.async('text'));
                for (const [key, value] of Object.entries(settings)) {
                    if (LOCALSTORAGE_KEYS.includes(key)) {
                        localStorage.setItem(key, value);
                        stats.preferences++;
                    }
                }
            } catch (e) {
                warnings.push(`Failed to restore settings: ${e.message}`);
            }
        }

        // ── 5. Check for missing cartridges ──────────────────────
        const prefsFile = zip.file('dataset_preferences.json');
        if (prefsFile) {
            try {
                const prefs = JSON.parse(await prefsFile.async('text'));
                const current = prefs.current;

                if (current && current.enabledDatasets) {
                    // Get currently installed datasets
                    const installedDatasets = await db.getAll('datasets');
                    const installedIds = new Set(
                        (installedDatasets || [])
                            .filter(d => d.installed)
                            .map(d => d.id)
                    );

                    for (const ds of current.enabledDatasets) {
                        const dsId = typeof ds === 'string' ? ds : ds.id;
                        const dsName = typeof ds === 'string' ? ds : (ds.name || ds.id);
                        if (dsId && !installedIds.has(dsId)) {
                            missingCartridges.push(dsName);
                        }
                    }
                }
            } catch (e) {
                log.warn('Could not check cartridge registry', e);
            }
        }

        log.info(`Restore complete. ${missingCartridges.length} missing cartridges, ${warnings.length} warnings`);
        return { success: true, missingCartridges, warnings, stats };

    } catch (e) {
        log.error('Snapshot restore failed', e);
        return { success: false, missingCartridges: [], warnings: [e.message], stats };
    }
}
