/**
 * ChatStorage.js — "The Black Box"
 * 
 * Implements strict persistence for the "Text Intelligence" engine.
 * - Sessions: Metadata (Mission Logs)
 * - Messages: Exact transcript (Flight Recorder)
 * 
 * Uses the updated `db` abstraction with direct index querying.
 */

import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('ChatStorage');

const SESSIONS_STORE = 'sessions';
const MESSAGES_STORE = 'messages';

/**
 * Get all sessions, sorted by last update (newest first).
 * Used for the "Mission Logs" sidebar.
 * @returns {Promise<Array>} List of sessions
 */
export async function getSessions() {
    try {
        const sessions = await db.getAll(SESSIONS_STORE);
        return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
        log.error('Failed to load mission logs', error);
        return [];
    }
}

/**
 * Load a specific session's metadata.
 */
export async function getSession(sessionId) {
    try {
        return await db.get(SESSIONS_STORE, sessionId);
    } catch (error) {
        log.error(`Failed to load session ${sessionId}`, error);
        return null;
    }
}

/**
 * Create or Update a session.
 * @param {Object} session - { id, title, cartridgeId, ... }
 */
export async function saveSession(session) {
    try {
        const now = new Date().toISOString();
        const payload = {
            ...session,
            updatedAt: now,
            createdAt: session.createdAt || now,
        };
        await db.put(SESSIONS_STORE, payload);
        return payload;
    } catch (error) {
        log.error(`Failed to save session ${session.id}`, error);
        throw error;
    }
}

/**
 * Delete a session and all its messages.
 */
export async function deleteSession(sessionId) {
    try {
        // 1. Delete Session
        await db.delete(SESSIONS_STORE, sessionId);

        // 2. Delete Messages (This is expensive without a batch delete by index, 
        //    but we'll do query-then-delete for now as volume is low per user)
        const messages = await getMessages(sessionId);
        const batch = messages.map(m => m.id);

        // Use batch delete if available in db.js, else sequential
        if (db.batchDelete) {
            await db.batchDelete(MESSAGES_STORE, batch);
        } else {
            await Promise.all(batch.map(id => db.delete(MESSAGES_STORE, id)));
        }

        log.info(`Deleted session ${sessionId} and ${messages.length} messages`);
    } catch (error) {
        log.error(`Failed to delete session ${sessionId}`, error);
    }
}

/**
 * Load all messages for a specific session.
 * Used to rehydrate the "Reader" context.
 */
export async function getMessages(sessionId) {
    try {
        // Use the index to get only messages for this session
        const stored = await db.getAllFromIndex(MESSAGES_STORE, 'sessionId', sessionId);

        // Rehydrate Dates
        return stored
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map(m => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }));
    } catch (error) {
        log.error(`Failed to load messages for ${sessionId}`, error);
        return [];
    }
}

/**
 * Save a single message.
 * Strict Append-Only: We never update messages, only add new ones (mostly).
 * Exception: Streaming updates might overwrite the *same* ID during generation.
 */
export async function saveMessage(sessionId, message) {
    try {
        const payload = {
            id: message.id,
            sessionId: sessionId,
            role: message.role,
            content: message.content,
            type: message.type || 'text',

            // Intelligence Metadata
            sources: message.sources || [],
            context: message.context || null,
            confidence: message.confidence || null,

            error: message.error || false,
            timestamp: message.timestamp instanceof Date
                ? message.timestamp.toISOString()
                : (message.timestamp || new Date().toISOString())
        };

        await db.put(MESSAGES_STORE, payload);

        // Update session timestamp implicitly? 
        // Ideally the hook handles the session update to avoid dual-writes here.
    } catch (error) {
        log.error(`Failed to save message ${message.id}`, error);
    }
}

/**
 * Batch save messages (useful for migration or bulk updates).
 */
export async function saveMessagesBatch(sessionId, messages) {
    try {
        const items = messages.map(m => ({
            id: m.id,
            sessionId: sessionId,
            role: m.role,
            content: m.content,
            sources: m.sources || [],
            context: m.context || null,
            timestamp: m.timestamp instanceof Date
                ? m.timestamp.toISOString()
                : (m.timestamp || new Date().toISOString())
        }));

        // Use batchPut if available
        if (db.batchPut) {
            // batchPut expects items, but for 'messages' store the key is in-line 'id'
            // We need to match the signature of batchPut in WebStorage/NativeStorage
            // WebStorage batchPut: await Promise.all(items.map(item => tx.store.put(item)))
            // It seems batchPut implementation in WebStorage handles in-line keys fine if we pass the object.
            await db.batchPut(MESSAGES_STORE, items);
        } else {
            await Promise.all(items.map(item => db.put(MESSAGES_STORE, item)));
        }

    } catch (error) {
        log.error(`Failed to batch save for ${sessionId}`, error);
    }
}
