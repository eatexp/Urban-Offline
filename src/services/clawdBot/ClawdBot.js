/**
 * ClawdBot - Main Orchestrator
 *
 * The intelligent agent interface for Urban-Offline.
 * Coordinates ToolRegistry, ActionRouter, and MemoryStore
 * to provide contextual, actionable assistance.
 */

import { toolRegistry } from './ToolRegistry';
import { actionRouter } from './ActionRouter';
import { memoryStore } from './MemoryStore';
import { createLogger } from '../../utils/logger';

const log = createLogger('clawdBot');

/**
 * clawdBot Service
 * 
 * Usage:
 *   import { clawdBot } from './services/clawdBot';
 *   
 *   // Simple query
 *   const response = await clawdBot.ask("Show me the riot protocol");
 *   
 *   // With execution context (for navigation, etc.)
 *   const response = await clawdBot.ask("Go to map", { 
 *     navigate, 
 *     transition 
 *   });
 */
class ClawdBot {
  constructor() {
    this.tools = toolRegistry;
    this.router = actionRouter;
    this.memory = memoryStore;
    this.initialized = false;
  }

  /**
   * Initialize clawdBot
   */
  async init() {
    if (this.initialized) return;

    log.info('Initializing clawdBot');
    
    // Load previous session history
    await this.memory.loadPreviousSession();
    
    // Cleanup old sessions
    await this.memory.cleanupOldSessions();

    this.initialized = true;
    log.info('clawdBot initialized');
  }

  /**
   * Process user query and return response
   * 
   * @param {string} query - User's natural language query
   * @param {Object} executionContext - Context for tool execution (navigate, transition, etc.)
   * @returns {Object} Response with action, result, and formatted message
   */
  async ask(query, executionContext = {}) {
    await this.init();

    log.info('Processing query', { query: query.substring(0, 50) });

    // Check for follow-up query
    if (this.memory.isFollowUpQuery(query)) {
      return this.handleFollowUp(query, executionContext);
    }

    // Route query to action
    const action = await this.router.route(query, executionContext);
    
    // Check if action requires confirmation
    if (this.requiresConfirmation(action)) {
      this.memory.setPendingAction(action, this.describeAction(action));
      return this.formatConfirmationResponse(action);
    }

    // Execute action
    const result = await this.router.execute(action, executionContext);

    // Record interaction
    this.memory.recordInteraction(query, action, result);

    // Update state based on action
    this.updateState(action, result);

    // Format response
    return this.formatResponse(query, action, result);
  }

  /**
   * Handle follow-up queries
   */
  async handleFollowUp(query, executionContext) {
    const followUpContext = this.memory.getFollowUpContext();
    log.info('Handling follow-up', { lastAction: followUpContext?.lastAction });

    // Check for confirmation/denial
    if (/^yes|^ok|^sure|^go ahead/i.test(query)) {
      const pending = this.memory.getPendingAction();
      if (pending) {
        this.memory.clearPendingAction();
        const result = await this.router.execute(pending.action, executionContext);
        this.memory.recordInteraction(query, pending.action, result);
        return this.formatResponse(query, pending.action, result, { confirmed: true });
      }
    }

    if (/^no|^cancel|^stop|^nevermind/i.test(query)) {
      this.memory.clearPendingAction();
      return {
        type: 'cancelled',
        message: 'Action cancelled.',
        followUp: true
      };
    }

    // Handle "what about X" follow-ups
    if (/^what about|^how about/i.test(query)) {
      const newQuery = query.replace(/^what about|^how about/i, '').trim();
      // Combine with last action context
      return this.ask(newQuery, executionContext);
    }

    // Default: treat as new query but with context
    return this.ask(query, executionContext);
  }

  /**
   * Check if action requires user confirmation
   */
  requiresConfirmation(action) {
    // High-confidence actions don't need confirmation
    if (action.confidence > 0.85) return false;
    
    // Fallback actions should confirm
    if (action.isFallback) return true;
    
    // Navigation to external (non-app) destinations should confirm
    // (None currently, but future-proofing)
    
    return false;
  }

  /**
   * Describe action in human terms
   */
  describeAction(action) {
    const descriptions = {
      'navigate_to': `Navigate to ${action.params?.destination}`,
      'generate_protocol': `Generate ${action.params?.scenario} protocol`,
      'start_triage': `Start ${action.params?.condition} triage`,
      'search_content': `Search for "${action.params?.query}"`,
      'get_user_context': 'Access your personal context',
      'show_map_location': `Show ${action.params?.location} on map`,
      'list_scenarios': 'Show available scenarios',
      'get_status': 'Check app status'
    };

    return descriptions[action.tool] || action.tool;
  }

  /**
   * Format confirmation request response
   */
  formatConfirmationResponse(action) {
    const description = this.describeAction(action);
    
    return {
      type: 'confirmation',
      message: `I'll ${description.toLowerCase()}. Is that right?`,
      action: action.tool,
      confidence: action.confidence,
      requiresConfirmation: true,
      suggestedResponse: 'Yes or No'
    };
  }

  /**
   * Update internal state based on action result
   */
  updateState(action, result) {
    if (!result.success) return;

    switch (action.tool) {
      case 'start_triage':
        if (result.result?.storyFile) {
          this.memory.setCurrentTriage(
            result.result.condition,
            result.result.storyFile
          );
        }
        break;

      case 'generate_protocol':
        if (result.result?.protocol) {
          this.memory.setCurrentProtocol(result.result.protocol);
        }
        break;

      case 'navigate_to':
        // Navigation happens externally, just update last activity
        this.memory.session.lastActivity = Date.now();
        break;

      default:
        break;
    }
  }

  /**
   * Format final response for UI
   */
  formatResponse(query, action, result, options = {}) {
    const { confirmed = false } = options;

    // Build response object
    const response = {
      type: result.success ? 'success' : 'error',
      query,
      action: action.tool,
      confidence: action.confidence,
      reasoning: action.reasoning,
      confirmed,
      result: result.result,
      error: result.error,
      message: this.generateMessage(action, result)
    };

    // Add quick actions based on result
    response.quickActions = this.suggestQuickActions(action, result);

    return response;
  }

  /**
   * Generate human-readable message
   */
  generateMessage(action, result) {
    if (!result.success) {
      return `I couldn't complete that. ${result.error || 'Please try again.'}`;
    }

    // Development tools message generation
    if (this.isDevTool(action.tool)) {
      return this.generateDevToolMessage(action, result);
    }

    const messages = {
      'navigate_to': `Going to ${result.result?.destination}...`,
      
      'generate_protocol': result.result?.protocol?.usedFallback 
        ? `Here's the ${result.result.scenario} protocol.`
        : `I've generated a personalized ${result.result.scenario} protocol for you.`,
      
      'search_content': result.result?.total > 0 
        ? `Found ${result.result.total} result${result.result.total !== 1 ? 's' : ''}.`
        : 'No results found.',
      
      'start_triage': `Starting ${result.result?.condition} guide...`,
      
      'get_user_context': 'Here is your information.',
      
      'show_map_location': 'Opening map...',
      
      'list_scenarios': `Available emergency scenarios:`,
      
      'get_status': 'Current status:'
    };

    return messages[action.tool] || 'Done.';
  }

  /**
   * Check if action is a development tool
   */
  isDevTool(toolName) {
    const devTools = ['validate_app', 'check_offline_coverage', 'monitor_performance', 'suggest_improvements', 'run_audit'];
    return devTools.includes(toolName);
  }

  /**
   * Generate message for dev tools
   */
  generateDevToolMessage(action, result) {
    const data = result.result;

    switch (action.tool) {
      case 'validate_app': {
        const { passed, failed, warnings } = data.summary;
        const emoji = failed === 0 ? '✅' : failed > 0 ? '⚠️' : 'ℹ️';
        let msg = `${emoji} App Validation Complete\n\n`;
        msg += `✅ Passed: ${passed}\n`;
        if (warnings > 0) msg += `⚠️ Warnings: ${warnings}\n`;
        if (failed > 0) msg += `❌ Failed: ${failed}\n`;
        msg += '\nChecks:\n';
        Object.entries(data.checks).forEach(([name, check]) => {
          const statusEmoji = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
          msg += `${statusEmoji} ${name}: ${check.status}\n`;
        });
        return msg;
      }

      case 'check_offline_coverage': {
        const { coverage, tests } = data;
        const emoji = coverage === 100 ? '✅' : coverage >= 80 ? '⚠️' : '❌';
        let msg = `${emoji} Offline Coverage: ${coverage}%\n\n`;
        Object.entries(tests).forEach(([name, test]) => {
          const statusEmoji = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
          msg += `${statusEmoji} ${name}: ${test.details}\n`;
        });
        return msg;
      }

      case 'monitor_performance': {
        let msg = '📊 Performance Metrics\n\n';
        if (data.metrics.startup) {
          msg += `🚀 Startup: ${data.metrics.startup.loadComplete}ms\n`;
        }
        if (data.metrics.search) {
          msg += `🔍 Search: ${data.metrics.search.averageTime}ms avg (${data.metrics.search.queries} queries)\n`;
        }
        if (data.metrics.storage) {
          msg += `💾 Storage: ${data.metrics.storage.usage} / ${data.metrics.storage.quota}\n`;
        }
        if (data.metrics.memory) {
          msg += `🧠 Memory: ${data.metrics.memory.used} / ${data.metrics.memory.limit}\n`;
        }
        return msg;
      }

      case 'suggest_improvements': {
        if (data.suggestions.length === 0) {
          return '✅ No immediate improvements needed. The app looks good!';
        }
        let msg = `💡 ${data.suggestions.length} Improvement Suggestions\n\n`;
        data.suggestions.forEach((s, i) => {
          const priorityEmoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟠' : '🟡';
          msg += `${priorityEmoji} ${s.title}\n`;
          msg += `   ${s.description}\n`;
          if (s.action) msg += `   👉 ${s.action}\n`;
          msg += '\n';
        });
        return msg;
      }

      case 'run_audit': {
        const { score, status, passedChecks, failedChecks } = data.summary;
        const emoji = status === 'passed' ? '✅' : '⚠️';
        let msg = `${emoji} Audit Complete: ${score}%\n\n`;
        msg += `✅ Passed: ${passedChecks}\n`;
        if (failedChecks > 0) msg += `❌ Failed: ${failedChecks}\n`;
        return msg;
      }

      default:
        return 'Dev tool completed.';
    }
  }

  /**
   * Suggest quick follow-up actions
   */
  suggestQuickActions(action, result) {
    const actions = [];

    if (!result.success) {
      actions.push({ label: 'Try again', query: 'try again' });
      return actions;
    }

    switch (action.tool) {
      case 'generate_protocol':
        actions.push(
          { label: 'Show me the steps', query: 'show steps' },
          { label: 'Different protocol', query: 'list scenarios' }
        );
        break;

      case 'search_content':
        if (result.result?.triageFlow) {
          actions.push({ 
            label: 'Start guide', 
            query: `start ${result.result.triageFlow.replace('.ink.json', '')}` 
          });
        }
        break;

      case 'start_triage':
        actions.push(
          { label: 'Go back', query: 'go back' },
          { label: 'Restart', query: `start ${result.result?.condition}` }
        );
        break;

      case 'list_scenarios':
        // Add quick access to each scenario
        result.result?.scenarios?.slice(0, 3).forEach(s => {
          actions.push({ label: s.name, query: `show ${s.id}` });
        });
        break;

      case 'validate_app':
        if (result.result?.summary?.failed > 0 || result.result?.summary?.warnings > 0) {
          actions.push({ label: 'Run full audit', query: 'run full audit' });
          actions.push({ label: 'Check offline coverage', query: 'test offline coverage' });
        }
        actions.push({ label: 'View suggestions', query: 'suggest improvements' });
        break;

      case 'check_offline_coverage':
        if (result.result?.coverage < 100) {
          actions.push({ label: 'Install regions', query: 'go to resources' });
          actions.push({ label: 'Validate app', query: 'validate app' });
        }
        break;

      case 'suggest_improvements':
        result.result?.suggestions?.slice(0, 3).forEach(s => {
          if (s.action) {
            actions.push({ label: s.title, query: s.action.split('.')[0] });
          }
        });
        break;

      case 'run_audit':
        if (result.result?.summary?.status === 'issues-found') {
          actions.push({ label: 'View suggestions', query: 'suggest improvements' });
          actions.push({ label: 'Validate components', query: 'validate app' });
        }
        break;

      default:
        break;
    }

    return actions;
  }

  /**
   * Get proactive suggestion based on context
   */
  getProactiveSuggestion() {
    const summary = this.memory.getSessionSummary();
    
    // No suggestions for new sessions
    if (summary.interactionCount === 0) return null;

    // Suggest completing current triage
    if (summary.currentTriage && !summary.currentProtocol) {
      return {
        type: 'continue',
        message: 'Continue where you left off?',
        action: { tool: 'navigate_to', params: { destination: '/triage' } }
      };
    }

    // Context-aware suggestions based on time
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      return {
        type: 'time',
        message: 'Late night — medical shortcuts available',
        quickActions: [
          { label: 'CPR', query: 'start cpr' },
          { label: 'Bleeding', query: 'start bleeding' }
        ]
      };
    }

    return null;
  }

  /**
   * Clear all memory and reset
   */
  reset() {
    this.memory.clear();
    log.info('clawdBot reset');
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      tools: this.tools.getToolNames(),
      memory: this.memory.getSessionSummary()
    };
  }
}

// Export singleton instance
export const clawdBot = new ClawdBot();
export default ClawdBot;
