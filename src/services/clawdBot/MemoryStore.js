/**
 * MemoryStore - clawdBot Session Memory
 *
 * Maintains conversation context and short-term memory.
 * Persists to IndexedDB for cross-session continuity.
 */

import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('clawdBot:MemoryStore');

const MEMORY_STORE = 'clawdBot_memory';
const MAX_SESSION_HISTORY = 20;
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class MemoryStore {
  constructor() {
    // In-memory session state (lost on refresh)
    this.session = {
      id: this.generateSessionId(),
      startedAt: Date.now(),
      lastActivity: Date.now(),
      interactions: [],
      currentTriage: null,
      currentProtocol: null,
      pendingAction: null,
      userLocation: null,
      lastQuery: null,
      context: {} // Arbitrary context data
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record an interaction
   */
  recordInteraction(query, action, result) {
    const interaction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      query,
      action: action?.tool,
      params: action?.params,
      success: result?.success,
      resultType: result?.result ? typeof result.result : null,
      confidence: action?.confidence
    };

    this.session.interactions.push(interaction);
    this.session.lastActivity = Date.now();
    this.session.lastQuery = query;

    // Trim old interactions
    if (this.session.interactions.length > MAX_SESSION_HISTORY) {
      this.session.interactions = this.session.interactions.slice(-MAX_SESSION_HISTORY);
    }

    // Persist async (don't block)
    this.persistInteraction(interaction).catch(err => 
      log.warn('Failed to persist interaction', err)
    );

    log.debug('Recorded interaction', { query: query.substring(0, 30), action: action?.tool });
  }

  /**
   * Persist interaction to IndexedDB
   */
  async persistInteraction(interaction) {
    try {
      const key = `${this.session.id}_${interaction.id}`;
      await db.put(MEMORY_STORE, interaction, key);
    } catch (error) {
      log.warn('Persistence failed', error);
    }
  }

  /**
   * Set current context value
   */
  setContext(key, value) {
    this.session.context[key] = value;
    this.session.lastActivity = Date.now();
  }

  /**
   * Get context value
   */
  getContext(key, defaultValue = null) {
    return this.session.context[key] ?? defaultValue;
  }

  /**
   * Set current triage flow
   */
  setCurrentTriage(triageId, storyFile) {
    this.session.currentTriage = {
      id: triageId,
      storyFile,
      startedAt: Date.now()
    };
    this.session.lastActivity = Date.now();
  }

  /**
   * Clear current triage
   */
  clearCurrentTriage() {
    this.session.currentTriage = null;
  }

  /**
   * Set current protocol
   */
  setCurrentProtocol(protocol) {
    this.session.currentProtocol = {
      id: protocol.scenarioId,
      name: protocol.scenarioName,
      steps: protocol.steps?.length,
      generatedAt: Date.now()
    };
    this.session.lastActivity = Date.now();
  }

  /**
   * Clear current protocol
   */
  clearCurrentProtocol() {
    this.session.currentProtocol = null;
  }

  /**
   * Set pending action (waiting for confirmation)
   */
  setPendingAction(action, description) {
    this.session.pendingAction = {
      action,
      description,
      setAt: Date.now()
    };
  }

  /**
   * Clear pending action
   */
  clearPendingAction() {
    this.session.pendingAction = null;
  }

  /**
   * Get pending action
   */
  getPendingAction() {
    // Expire pending actions after 5 minutes
    if (this.session.pendingAction) {
      const age = Date.now() - this.session.pendingAction.setAt;
      if (age > 5 * 60 * 1000) {
        this.clearPendingAction();
        return null;
      }
    }
    return this.session.pendingAction;
  }

  /**
   * Get recent interaction history for context
   */
  getRecentHistory(count = 5) {
    return this.session.interactions.slice(-count);
  }

  /**
   * Check if query is a follow-up to previous interaction
   */
  isFollowUpQuery(query) {
    const lastInteraction = this.session.interactions[this.session.interactions.length - 1];
    if (!lastInteraction) return false;

    // Check temporal proximity (within 2 minutes)
    const timeSinceLast = Date.now() - new Date(lastInteraction.timestamp).getTime();
    if (timeSinceLast > 2 * 60 * 1000) return false;

    // Check for follow-up indicators
    const followUpPatterns = [
      /^what about/i,
      /^how about/i,
      /^and /i,
      /^also /i,
      /^what else/i,
      /^can you/i,
      /^show me/i,
      /^yes/i,
      /^no/i,
      /^ok/i,
      /^got it/i
    ];

    return followUpPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get follow-up context
   */
  getFollowUpContext() {
    const lastInteraction = this.session.interactions[this.session.interactions.length - 1];
    if (!lastInteraction) return null;

    return {
      lastQuery: lastInteraction.query,
      lastAction: lastInteraction.action,
      currentTriage: this.session.currentTriage,
      currentProtocol: this.session.currentProtocol,
      context: this.session.context
    };
  }

  /**
   * Get relevant history for similar queries
   */
  async getRelevantHistory(query, limit = 3) {
    try {
      // Simple relevance: keyword matching
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      const relevant = this.session.interactions
        .filter(interaction => {
          const queryLower = interaction.query.toLowerCase();
          return keywords.some(kw => queryLower.includes(kw));
        })
        .slice(-limit);

      return relevant;
    } catch (error) {
      log.warn('Failed to get relevant history', error);
      return [];
    }
  }

  /**
   * Get session summary for AI context
   */
  getSessionSummary() {
    const duration = Date.now() - this.session.startedAt;
    const minutes = Math.floor(duration / 60000);

    return {
      sessionId: this.session.id,
      duration: `${minutes}m`,
      interactionCount: this.session.interactions.length,
      currentTriage: this.session.currentTriage?.id,
      currentProtocol: this.session.currentProtocol?.name,
      hasPendingAction: !!this.session.pendingAction,
      contextKeys: Object.keys(this.session.context)
    };
  }

  /**
   * Clear all session memory
   */
  clear() {
    this.session = {
      id: this.generateSessionId(),
      startedAt: Date.now(),
      lastActivity: Date.now(),
      interactions: [],
      currentTriage: null,
      currentProtocol: null,
      pendingAction: null,
      userLocation: null,
      lastQuery: null,
      context: {}
    };
    log.info('Session memory cleared');
  }

  /**
   * Load previous session from storage
   */
  async loadPreviousSession() {
    try {
      // Get recent interactions from storage
      const allKeys = await db.getAllKeys(MEMORY_STORE);
      const recentKeys = allKeys
        .filter(key => key.startsWith('session_'))
        .sort()
        .slice(-MAX_SESSION_HISTORY);

      if (recentKeys.length > 0) {
        const interactions = await Promise.all(
          recentKeys.map(key => db.get(MEMORY_STORE, key))
        );

        // Filter valid interactions from last 24 hours
        const cutoff = Date.now() - SESSION_EXPIRY_MS;
        const validInteractions = interactions.filter(i => 
          i && new Date(i.timestamp).getTime() > cutoff
        );

        if (validInteractions.length > 0) {
          this.session.interactions = validInteractions;
          log.info(`Restored ${validInteractions.length} interactions from storage`);
        }
      }
    } catch (error) {
      log.warn('Failed to load previous session', error);
    }
  }

  /**
   * Cleanup old sessions from storage
   */
  async cleanupOldSessions() {
    try {
      const allKeys = await db.getAllKeys(MEMORY_STORE);
      const cutoff = Date.now() - SESSION_EXPIRY_MS;
      
      let cleaned = 0;
      for (const key of allKeys) {
        const interaction = await db.get(MEMORY_STORE, key);
        if (interaction && new Date(interaction.timestamp).getTime() < cutoff) {
          await db.delete(MEMORY_STORE, key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        log.info(`Cleaned up ${cleaned} old session entries`);
      }
    } catch (error) {
      log.warn('Cleanup failed', error);
    }
  }
}

// Export singleton
export const memoryStore = new MemoryStore();
export default MemoryStore;
