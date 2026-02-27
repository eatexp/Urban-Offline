/**
 * useChatSession.js — "The Mission Control"
 * 
 * Manages the active chat session, including:
 * 1. Persistence (Mission Logs) via ChatStorage
 * 2. Safety Lock (AbortController) to prevent crosstalk during session switches
 * 3. State Management (Messages, Loading, Streaming)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as ChatStorage from '../services/storage/ChatStorage';
import { createLogger } from '../utils/logger';

const log = createLogger('useChatSession');

export const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I'm your offline emergency assistant. I can help you find information about:

• **Medical emergencies** - First aid, CPR, symptoms
• **Survival skills** - Water, shelter, navigation
• **Legal rights** - Police encounters, arrest procedures

Ask me anything, and I'll search through your downloaded content to find answers.

*Note: For life-threatening emergencies, always call 999/911 first.*`,
    timestamp: new Date(),
};

export function useChatSession() {
    // ── State ───────────────────────────────────────────────────────────
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]); // List for Sidebar
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Safety Lock: One abort controller per active generation
    const abortControllerRef = useRef(null);

    // ── Initialization ──────────────────────────────────────────────────

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await ChatStorage.getSessions();
            setSessions(list);

            if (list.length > 0) {
                // Auto-load most recent
                await switchSession(list[0].id);
            } else {
                await createNewSession();
            }
        } catch (error) {
            log.error('Failed to init history', error);
            setMessages([WELCOME_MESSAGE]);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- createNewSession/switchSession are defined below; circular dep if included
    }, []);

    useEffect(() => {
        loadHistory();
        return () => {
            // Unmount Safety Lock using abort()
            if (abortControllerRef.current) {
                log.info('Unmounting: Aborting active generation');
                abortControllerRef.current.abort();
            }
        };
    }, [loadHistory]);

    // ── Actions ─────────────────────────────────────────────────────────

    /**
     * Create a fresh session and switch to it.
     */
    const createNewSession = async () => {
        // Safety Lock: Abort previous stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        const newSession = {
            id: newId,
            title: 'New Mission',
            createdAt: now,
            updatedAt: now
        };

        await ChatStorage.saveSession(newSession);

        // Update State
        setSessions(prev => [newSession, ...prev]);
        setSessionId(newId);
        setMessages([WELCOME_MESSAGE]);
        setIsGenerating(false);

        return newId;
    };

    /**
     * Switch to a specific session ID.
     */
    const switchSession = async (id) => {
        if (id === sessionId) return;

        // Safety Lock: Critical for preventing crosstalk
        if (abortControllerRef.current) {
            log.info('Switching Session: Aborting active generation');
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setIsLoading(true);
        setIsGenerating(false);

        try {
            const storedMessages = await ChatStorage.getMessages(id);
            setMessages(storedMessages.length > 0 ? storedMessages : [WELCOME_MESSAGE]);
            setSessionId(id);
        } catch (error) {
            log.error(`Failed to switch to session ${id}`, error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Add a message to state and persistence.
     */
    const addMessage = async (message) => {
        // Optimistic UI update
        setMessages(prev => [...prev, message]);

        if (sessionId) {
            // Persist message
            await ChatStorage.saveMessage(sessionId, message);

            // Update session timestamp & title (if first user message)
            const session = sessions.find(s => s.id === sessionId) || await ChatStorage.getSession(sessionId);

            if (session) {
                let updates = { updatedAt: new Date().toISOString() };

                // Auto-title
                if ((!session.title || session.title === 'New Mission') && message.role === 'user') {
                    updates.title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
                }

                const updatedSession = { ...session, ...updates };
                await ChatStorage.saveSession(updatedSession);

                // Update list state
                setSessions(prev => {
                    const filtered = prev.filter(s => s.id !== sessionId);
                    return [updatedSession, ...filtered];
                });
            }
        }
    };

    /**
     * Validates and cleans up the message streaming
     */
    const endGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current = null;
        }
        setIsGenerating(false);
    };

    /**
     * Delete a session
     */
    const removeSession = async (idToDelete) => {
        if (!window.confirm('Delete this mission log? This cannot be undone.')) return;

        await ChatStorage.deleteSession(idToDelete);

        setSessions(prev => prev.filter(s => s.id !== idToDelete));

        // If retrieving current, load another or create new
        if (idToDelete === sessionId) {
            const remaining = sessions.filter(s => s.id !== idToDelete);
            if (remaining.length > 0) {
                switchSession(remaining[0].id);
            } else {
                createNewSession();
            }
        }
    };

    return {
        sessionId,
        sessions,
        messages,
        setMessages, // For streaming updates (imperative)
        isLoading,
        isGenerating,
        setIsGenerating,
        abortControllerRef,

        createNewSession,
        switchSession,
        removeSession,
        addMessage,
        endGeneration
    };
}
