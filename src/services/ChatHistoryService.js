/**
 * ChatHistoryService.js — Conversation-based chat persistence
 *
 * Structure:
 *   conversations → [{ id, title, createdAt, updatedAt }]
 *   messages:{conversationId} → [{ id, role, content, ... }]
 *
 * Uses the existing `db` abstraction (IndexedDB on web, SQLite on native).
 * Store: `clawdBot_memory` — already exists in both backends.
 */

import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('ChatHistory');

const STORE = 'clawdBot_memory';
const CONVERSATIONS_KEY = 'conversations';
const MESSAGES_PREFIX = 'messages:';

// ── Welcome message (always shown, never persisted) ──────────────
export const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I'm your offline emergency assistant. I can help you find information about:

• **Medical emergencies** - First aid, CPR, symptoms
• **Survival skills** - Water, shelter, navigation
• **Legal rights** - Police encounters, arrest procedures

Ask me anything, and I'll search through your downloaded content to find answers.

*Note: For life-threatening emergencies, always call 999/911 first.*`,
};

// ═══════════════════════════════════════════════════════════════════
// CONVERSATIONS — list / create / get
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all conversation metadata, sorted newest first.
 * @returns {Promise<Array<{id, title, createdAt, updatedAt}>>}
 */
export async function getConversations() {
    try {
        const list = await db.get(STORE, CONVERSATIONS_KEY);
        if (!list || !Array.isArray(list)) return [];
        return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (e) {
        log.error('Failed to load conversations', e);
        return [];
    }
}

/**
 * Create a new conversation and return its metadata.
 * @param {string} [title] — auto-generated from first message if omitted
 * @returns {Promise<{id, title, createdAt, updatedAt}>}
 */
export async function createConversation(title = 'New Chat') {
    const now = new Date().toISOString();
    const conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        createdAt: now,
        updatedAt: now,
    };

    const list = await getConversations();
    list.unshift(conv);
    await db.put(STORE, list, CONVERSATIONS_KEY);

    log.debug(`Created conversation: ${conv.id}`);
    return conv;
}

/**
 * Update a conversation's metadata (e.g. title, updatedAt).
 */
async function updateConversation(convId, updates) {
    const list = await getConversations();
    const idx = list.findIndex(c => c.id === convId);
    if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
        await db.put(STORE, list, CONVERSATIONS_KEY);
    }
}

/**
 * Delete a specific conversation and its messages.
 */
export async function deleteConversation(convId) {
    try {
        const list = await getConversations();
        const newList = list.filter(c => c.id !== convId);
        await db.put(STORE, newList, CONVERSATIONS_KEY);

        await db.delete(STORE, MESSAGES_PREFIX + convId);
        log.info(`Deleted conversation: ${convId}`);
    } catch (e) {
        log.error(`Failed to delete conversation ${convId}`, e);
    }
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGES — load / save / append
// ═══════════════════════════════════════════════════════════════════

/**
 * Serialize a message for storage (strip non-serializable fields).
 */
function serializeMessage(m) {
    return {
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources || null,
        context: m.context || null,
        usedFallback: m.usedFallback || false,
        confidence: m.confidence || null,
        error: m.error || false,
        timestamp: m.timestamp instanceof Date
            ? m.timestamp.toISOString()
            : (m.timestamp || new Date().toISOString()),
    };
}

/**
 * Rehydrate a stored message (ISO strings → Dates).
 */
function rehydrateMessage(m) {
    return {
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    };
}

/**
 * Load all messages for a conversation.
 * @returns {Promise<Array>}  messages with welcome prepended
 */
export async function loadMessages(conversationId) {
    try {
        const key = MESSAGES_PREFIX + conversationId;
        const stored = await db.get(STORE, key);
        if (!stored || !Array.isArray(stored) || stored.length === 0) {
            return [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
        }
        const messages = stored.map(rehydrateMessage);
        return [{ ...WELCOME_MESSAGE, timestamp: new Date() }, ...messages];
    } catch (e) {
        log.error(`Failed to load messages for ${conversationId}`, e);
        return [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
    }
}

/**
 * Save the full messages array for a conversation.
 * Filters out the welcome message before persisting.
 */
export async function saveMessages(conversationId, messages) {
    try {
        const toSave = messages
            .filter(m => m.id !== 'welcome')
            .map(serializeMessage);

        const key = MESSAGES_PREFIX + conversationId;
        await db.put(STORE, toSave, key);

        // Auto-title from first user message if still "New Chat"
        if (toSave.length > 0) {
            const firstUser = toSave.find(m => m.role === 'user');
            if (firstUser) {
                const title = firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? '…' : '');
                await updateConversation(conversationId, { title });
            } else {
                await updateConversation(conversationId, {});
            }
        }

        log.debug(`Saved ${toSave.length} messages for ${conversationId}`);
    } catch (e) {
        log.error(`Failed to save messages for ${conversationId}`, e);
    }
}

// ═══════════════════════════════════════════════════════════════════
// CLEAR — wipe all history
// ═══════════════════════════════════════════════════════════════════

/**
 * Delete all conversations and their messages.
 */
export async function clearAllHistory() {
    try {
        const list = await getConversations();

        // Delete each conversation's messages
        for (const conv of list) {
            try {
                await db.delete(STORE, MESSAGES_PREFIX + conv.id);
            } catch (_) { /* ignore */ }
        }

        // Delete the conversations index
        await db.delete(STORE, CONVERSATIONS_KEY);

        log.info(`Cleared ${list.length} conversations`);
    } catch (e) {
        log.error('Failed to clear history', e);
    }
}

/**
 * Get the most recent conversation, or create one if none exist.
 * @returns {Promise<{id, title, createdAt, updatedAt}>}
 */
export async function getOrCreateLatestConversation() {
    const list = await getConversations();
    if (list.length > 0) {
        return list[0]; // already sorted newest-first
    }
    return createConversation();
}
