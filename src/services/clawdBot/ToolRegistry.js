/**
 * ToolRegistry - clawdBot Action System
 *
 * Defines all executable actions clawdBot can perform.
 * Each tool has: description, parameters schema, validation, and execution.
 */

import { createLogger } from '../../utils/logger';
import { registerDevTools } from './DevToolRegistry';

const log = createLogger('clawdBot:ToolRegistry');

/**
 * Tool Definition Schema:
 * {
 *   name: string,
 *   description: string,
 *   parameters: { [key]: { type, required, description } },
 *   validate: (params) => boolean | string,
 *   execute: (params, context) => Promise<result>
 * }
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerCoreTools();
  }

  /**
   * Register a new tool
   */
  register(name, definition) {
    if (this.tools.has(name)) {
      log.warn(`Tool ${name} already registered, overwriting`);
    }
    this.tools.set(name, definition);
    log.debug(`Registered tool: ${name}`);
  }

  /**
   * Get a tool by name
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Get all registered tool names
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool descriptions for AI context
   */
  getToolDescriptions() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Execute a tool with validation
   */
  async execute(name, params = {}, context = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      log.error(`Tool not found: ${name}`);
      return { success: false, error: `Unknown tool: ${name}` };
    }

    // Validate parameters
    const validation = this.validateParams(tool, params);
    if (!validation.valid) {
      log.error(`Parameter validation failed for ${name}`, validation.error);
      return { success: false, error: validation.error };
    }

    // Execute with timeout protection
    try {
      log.info(`Executing tool: ${name}`, params);
      const result = await Promise.race([
        tool.execute(params, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), 10000)
        )
      ]);

      log.info(`Tool ${name} executed successfully`);
      return { success: true, result, tool: name };

    } catch (error) {
      log.error(`Tool execution failed: ${name}`, error);
      return {
        success: false,
        error: error.message || 'Tool execution failed',
        tool: name
      };
    }
  }

  /**
   * Validate parameters against tool schema
   */
  validateParams(tool, params) {
    if (tool.validate) {
      const customValidation = tool.validate(params);
      if (customValidation !== true) {
        return { valid: false, error: customValidation };
      }
    }

    // Check required parameters
    for (const [key, config] of Object.entries(tool.parameters || {})) {
      if (config.required && !(key in params)) {
        return { valid: false, error: `Missing required parameter: ${key}` };
      }

      if (key in params && config.type) {
        const actualType = typeof params[key];
        if (actualType !== config.type && !(config.type === 'array' && Array.isArray(params[key]))) {
          return {
            valid: false,
            error: `Parameter ${key} should be ${config.type}, got ${actualType}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Register all core clawdBot tools
   */
  registerCoreTools() {
    // Tool 1: Navigation
    this.register('navigate_to', {
      description: 'Navigate to a specific page, triage flow, or protocol view',
      parameters: {
        destination: {
          type: 'string',
          required: true,
          description: 'Target destination: home, map, ai, resources, settings, triage/[id], protocol/[id], article/[slug]'
        },
        context: {
          type: 'object',
          required: false,
          description: 'Optional context data to pass to destination'
        }
      },
      execute: async (params, context) => {
        if (!context.navigate) {
          throw new Error('Navigation function not available in context');
        }

        const { destination, context: navContext } = params;

        // Use view transition if available
        if (context.transition) {
          await context.transition(() => {
            context.navigate(destination, navContext ? { state: navContext } : undefined);
          });
        } else {
          context.navigate(destination, navContext ? { state: navContext } : undefined);
        }

        return { navigated: true, destination };
      }
    });

    // Tool 2: Protocol Generation
    this.register('generate_protocol', {
      description: 'Generate personalized emergency protocol for a scenario',
      parameters: {
        scenario: {
          type: 'string',
          required: true,
          description: 'Scenario ID: riot-nearby, evacuate-now, shelter-in-place, power-out, no-water'
        },
        use_context: {
          type: 'boolean',
          required: false,
          description: 'Whether to incorporate user context (inventory, location)'
        }
      },
      validate: (params) => {
        const validScenarios = ['riot-nearby', 'evacuate-now', 'shelter-in-place', 'power-out', 'no-water'];
        if (!validScenarios.includes(params.scenario)) {
          return `Invalid scenario. Must be one of: ${validScenarios.join(', ')}`;
        }
        return true;
      },
      execute: async (params, context) => {
        const { ProtocolGenerator } = await import('../ai/ProtocolGenerator');

        const protocol = await ProtocolGenerator.generate(params.scenario, {
          useAI: true,
          maxRetries: 1
        });

        // Store in context for subsequent navigation
        if (context.setProtocol) {
          context.setProtocol(protocol);
        }

        return {
          protocol,
          scenario: params.scenario,
          steps: protocol.steps?.length || 0
        };
      }
    });

    // Tool 3: Content Search
    this.register('search_content', {
      description: 'Search the offline knowledge base for articles and guides',
      parameters: {
        query: {
          type: 'string',
          required: true,
          description: 'Search query string'
        },
        category: {
          type: 'string',
          required: false,
          description: 'Filter by category: medical, survival, legal'
        },
        limit: {
          type: 'number',
          required: false,
          description: 'Maximum results to return (default: 10)'
        }
      },
      execute: async (params) => {
        const { HybridSearchService } = await import('../search/HybridSearch');

        const response = await HybridSearchService.search(params.query, {
          limit: params.limit || 10,
          category: params.category,
          includeIntentRouting: true
        });

        return {
          results: response.results,
          total: response.totalResults,
          intent: response.intent,
          suggestedAction: response.suggestedAction,
          triageFlow: response.triageFlow
        };
      }
    });

    // Tool 4: Get User Context
    this.register('get_user_context', {
      description: 'Retrieve user personal context (inventory, medical, location, resources)',
      parameters: {
        category: {
          type: 'string',
          required: false,
          description: 'Specific category: inventory, medical, location, resources, or omit for all'
        }
      },
      validate: (params) => {
        if (params.category) {
          const validCategories = ['inventory', 'medical', 'location', 'resources'];
          if (!validCategories.includes(params.category)) {
            return `Invalid category. Must be one of: ${validCategories.join(', ')}`;
          }
        }
        return true;
      },
      execute: async (params) => {
        const { userContextManager } = await import('../context/UserContextManager');

        if (params.category) {
          const getters = {
            inventory: () => userContextManager.getInventory(),
            medical: () => userContextManager.getMedical(),
            location: () => userContextManager.getLocation(),
            resources: () => userContextManager.getResources()
          };
          const data = await getters[params.category]();
          return { [params.category]: data };
        }

        const all = await userContextManager.getAll();
        return all;
      }
    });

    // Tool 5: Start Triage
    this.register('start_triage', {
      description: 'Start an emergency triage/decision flow for a specific condition',
      parameters: {
        condition: {
          type: 'string',
          required: true,
          description: 'Triage condition: cpr, choking, bleeding, burns, stroke, arrest-rights, stop-and-search, etc.'
        },
        category: {
          type: 'string',
          required: false,
          description: 'Category hint: health, medical, legal, survival'
        }
      },
      execute: async (params, _context) => {
        // Map condition to story file
        const conditionMap = {
          // Medical
          'cpr': 'health/cpr.ink.json',
          'choking': 'health/choking.ink.json',
          'bleeding': 'health/severe-bleeding.ink.json',
          'burns': 'medical/burns-assessment.ink.json',
          'stroke': 'medical/stroke-recognition.ink.json',
          'heat': 'medical/heat-illness.ink.json',
          'hypothermia': 'hypothermia.ink.json',
          // Legal
          'arrest': 'legal/arrest-rights.ink.json',
          'arrest-rights': 'legal/arrest-rights.ink.json',
          'custody': 'legal/custody-rights.ink.json',
          'stop-search': 'legal/stop-and-search.ink.json',
          // Survival
          'fire': 'survival/fire-making.ink.json',
          'shelter': 'survival/shelter-building.ink.json',
          'water': 'survival/water-purification.ink.json',
          'signal': 'survival/signaling.ink.json'
        };

        const storyFile = conditionMap[params.condition.toLowerCase()];

        if (!storyFile) {
          // Try to infer from category
          const category = params.category || 'health';
          const inferredFile = `${category}/${params.condition}.ink.json`;

          return {
            storyFile: inferredFile,
            condition: params.condition,
            inferred: true,
            message: `Starting triage for ${params.condition}`
          };
        }

        return {
          storyFile,
          condition: params.condition,
          inferred: false,
          message: `Starting triage for ${params.condition}`
        };
      }
    });

    // Tool 6: Show Map Location
    this.register('show_map_location', {
      description: 'Show map centered on a specific location or points of interest',
      parameters: {
        location: {
          type: 'string',
          required: true,
          description: 'Location: current, home, hospitals, shelters, water, or [lat,lng]'
        },
        zoom: {
          type: 'number',
          required: false,
          description: 'Zoom level (1-18)'
        }
      },
      execute: async (params) => {
        const { userContextManager } = await import('../context/UserContextManager');

        let targetLocation = params.location;
        let targetZoom = params.zoom || 13;

        // Resolve special locations
        if (params.location === 'home') {
          const location = await userContextManager.getLocation();
          if (location?.home?.coordinates) {
            targetLocation = location.home.coordinates;
          }
        } else if (params.location === 'current') {
          // Will use geolocation in map component
          targetLocation = 'current';
        }

        return {
          location: targetLocation,
          zoom: targetZoom,
          poi: ['hospitals', 'shelters', 'water'].includes(params.location) ? params.location : null
        };
      }
    });

    // Tool 7: Get Available Scenarios
    this.register('list_scenarios', {
      description: 'List all available emergency scenarios and protocols',
      parameters: {},
      execute: async () => {
        const { getAllScenarios } = await import('../ai/scenarioTemplates');
        const scenarios = getAllScenarios();

        return {
          scenarios: scenarios.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            icon: s.icon?.name || 'Shield'
          }))
        };
      }
    });

    // Tool 8: Check App Status
    this.register('get_status', {
      description: 'Get current app status: offline/online, AI ready, storage, installed regions',
      parameters: {},
      execute: async () => {
        const { dataManager } = await import('../dataManager');
        const { AIModelManager } = await import('../ai/AIModelManager');

        const [regions, storage, aiReady] = await Promise.all([
          dataManager.getInstalledRegions(),
          dataManager.getStorageUsage(),
          Promise.resolve(AIModelManager.isModelLoaded())
        ]);

        return {
          online: navigator.onLine,
          aiReady,
          storage,
          installedRegions: regions.map(r => r.name),
          regionCount: regions.length
        };
      }
    });

    log.info('Core tools registered:', this.getToolNames());

    // Register development tools
    registerDevTools(this);
    log.info('Development tools registered');
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();

// Export class for testing/extending
export default ToolRegistry;
