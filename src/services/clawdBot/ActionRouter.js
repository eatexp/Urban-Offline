/**
 * ActionRouter - Intent to Action Mapping
 *
 * Bridges natural language intent to ToolRegistry actions.
 * Uses pattern matching and confidence scoring.
 */

import { classifyIntent } from '../ai/IntentClassifier';
import { toolRegistry } from './ToolRegistry';
import { createLogger } from '../../utils/logger';
import { cartridgePOIQueryEngine } from '../maps/CartridgePOIQueryEngine';

const log = createLogger('clawdBot:ActionRouter');

/**
 * Action patterns - map intent types to tools
 */
const ACTION_PATTERNS = [
  // Navigation patterns
  {
    patterns: ['navigate', 'go to', 'open', 'show me', 'take me', 'view'],
    tool: 'navigate_to',
    extractParams: (query) => {
      const destinations = {
        'home': /home|main|start/i,
        'map': /map|location|where/i,
        'ai': /ai|assistant|chat/i,
        'resources': /resource|download|region/i,
        'settings': /setting|config/i,
        'health': /health|medical|first aid/i,
        'survival': /survival|preparedness/i,
        'law': /law|legal|rights/i
      };

      for (const [dest, regex] of Object.entries(destinations)) {
        if (regex.test(query)) return { destination: dest };
      }
      return null;
    }
  },

  // Protocol generation patterns
  {
    patterns: ['protocol', 'riot', 'evacuate', 'shelter', 'power out', 'no water', 'what do i do', 'emergency plan'],
    tool: 'generate_protocol',
    extractParams: (query) => {
      const scenarios = {
        'riot-nearby': /riot|protest|unrest|crowd/i,
        'evacuate-now': /evacuate|leave now|get out|escape/i,
        'shelter-in-place': /shelter|stay inside|lockdown|hide/i,
        'power-out': /power|electricity|blackout|no lights/i,
        'no-water': /water|tap|supply/i
      };

      for (const [scenario, regex] of Object.entries(scenarios)) {
        if (regex.test(query)) return { scenario };
      }
      return null;
    }
  },

  // Search patterns
  {
    patterns: ['search', 'find', 'look up', 'information about', 'how to', 'what is', 'tell me about'],
    tool: 'search_content',
    extractParams: (query) => {
      // Remove search keywords to get clean query
      const cleanQuery = query
        .replace(/search|find|look up|information about|how to|what is|tell me about/gi, '')
        .trim();

      // Detect category from query
      let category = null;
      if (/medical|health|first aid|cpr|bleeding|injury/i.test(query)) category = 'medical';
      else if (/survival|shelter|fire|water|food/i.test(query)) category = 'survival';
      else if (/law|legal|rights|arrest|police/i.test(query)) category = 'legal';

      return { query: cleanQuery || query, category };
    }
  },

  // User context patterns
  {
    patterns: ['what do i have', 'my kit', 'my inventory', 'my supplies', 'what\'s in my', 'my location', 'my medical'],
    tool: 'get_user_context',
    extractParams: (query) => {
      if (/kit|inventory|supplies|have/i.test(query)) return { category: 'inventory' };
      if (/medical|allergy|medication|condition/i.test(query)) return { category: 'medical' };
      if (/location|home|address|where/i.test(query)) return { category: 'location' };
      if (/water|food|resource|cash/i.test(query)) return { category: 'resources' };
      return {}; // All categories
    }
  },

  // Triage patterns
  {
    patterns: ['start', 'begin', 'help with', 'i need help', 'emergency', 'someone is'],
    tool: 'start_triage',
    extractParams: (query) => {
      const conditions = {
        'cpr': /cpr|not breathing|heart stopped|cardiac/i,
        'choking': /choking|can't breathe|airway/i,
        'bleeding': /bleeding|blood|wound|cut/i,
        'burns': /burn|scald|fire injury/i,
        'stroke': /stroke|brain|face drooping/i,
        'arrest': /arrest|detained|police|custody/i,
        'stop-search': /stop and search|search me|pulled over/i,
        'fire': /fire|make fire|start fire/i,
        'shelter': /shelter|build shelter/i,
        'water': /water|purify/i
      };

      for (const [condition, regex] of Object.entries(conditions)) {
        if (regex.test(query)) return { condition };
      }
      return null;
    }
  },

  // Map patterns - POI-aware
  {
    patterns: ['map', 'show map', 'where is', 'find nearest', 'locate', 'directions to'],
    tool: 'show_map_location',
    extractParams: (query) => {
      // Extract location keywords by removing trigger words
      const keywords = query
        .replace(/where is|find|locate|show me|directions to|find nearest|show map|map/gi, '')
        .trim();
      
      // Try POI search first (if keywords extracted)
      if (keywords && keywords.length > 2) {
        try {
          const poiResult = cartridgePOIQueryEngine.queryPOI(keywords);
          
          if (poiResult && poiResult.confidence > 0.5) {
            // High-confidence POI match - return enriched params
            log.info('POI match found in ActionRouter', { 
              poi: poiResult.poi.name, 
              confidence: poiResult.confidence 
            });
            
            return {
              location: poiResult.poi.name,
              coords: poiResult.poi.coords,
              zoom: 16,
              isPOI: true,
              poiType: poiResult.poi.type
            };
          }
        } catch (e) {
          log.warn('POI query failed in ActionRouter', e);
          // Fall through to pattern matching
        }
      }
      
      // Fallback: Current pattern matching behavior
      const locations = {
        'hospitals': /hospital|medical|emergency room|er/i,
        'shelters': /shelter|safe place|evacuation/i,
        'water': /water|fountain|source/i,
        'home': /home|my house/i,
        'current': /current|here|my location/i
      };

      for (const [location, regex] of Object.entries(locations)) {
        if (regex.test(query)) return { location };
      }
      return { location: 'current' };
    }
  },

  // List scenarios
  {
    patterns: ['what scenarios', 'available protocols', 'emergency types', 'what can you do', 'help'],
    tool: 'list_scenarios',
    extractParams: () => ({})
  },

  // Status check
  {
    patterns: ['status', 'check', 'am i ready', 'what\'s installed', 'offline mode', 'storage'],
    tool: 'get_status',
    extractParams: () => ({})
  },

  // Development & Quality Assurance patterns
  {
    patterns: ['validate', 'health check', 'diagnose', 'check app', 'app status', 'system check'],
    tool: 'validate_app',
    extractParams: (query) => {
      const components = {
        'storage': /storage|database|db/i,
        'search': /search|find/i,
        'ai': /ai|model|ml/i,
        'maps': /map|tile/i,
        'triage': /triage|emergency|medical/i
      };

      for (const [component, regex] of Object.entries(components)) {
        if (regex.test(query)) return { component };
      }
      return { component: 'all' };
    }
  },

  {
    patterns: ['offline coverage', 'offline test', 'works offline', 'can i use offline', 'test offline'],
    tool: 'check_offline_coverage',
    extractParams: (query) => {
      const paths = {
        'medical': /medical|health|cpr|first aid/i,
        'legal': /legal|rights|law/i,
        'survival': /survival|shelter|fire/i,
        'maps': /map|location/i,
        'search': /search/i
      };

      for (const [path, regex] of Object.entries(paths)) {
        if (regex.test(query)) return { criticalPath: path };
      }
      return { criticalPath: 'all' };
    }
  },

  {
    patterns: ['performance', 'speed', 'slow', 'metrics', 'benchmark', 'how fast'],
    tool: 'monitor_performance',
    extractParams: (query) => {
      const metrics = {
        'startup': /startup|load|boot/i,
        'search': /search/i,
        'ai': /ai|model/i,
        'render': /render|display|ui/i,
        'storage': /storage|save/i
      };

      for (const [metric, regex] of Object.entries(metrics)) {
        if (regex.test(query)) return { metric };
      }
      return { metric: 'all' };
    }
  },

  {
    patterns: ['suggest', 'improve', 'better', 'optimization', 'what should i do', 'recommend'],
    tool: 'suggest_improvements',
    extractParams: (query) => {
      const focusAreas = {
        'content': /content|article|data/i,
        'performance': /performance|speed|slow/i,
        'offline': /offline|cache/i,
        'ux': /ux|ui|interface|user/i
      };

      for (const [focus, regex] of Object.entries(focusAreas)) {
        if (regex.test(query)) return { focus };
      }
      return { focus: 'all' };
    }
  },

  {
    patterns: ['audit', 'quality check', 'code review', 'analyze', 'inspect'],
    tool: 'run_audit',
    extractParams: (query) => {
      const scopes = {
        'quick': /quick|fast|brief/i,
        'full': /full|complete|thorough/i,
        'critical': /critical|important|essential/i
      };

      for (const [scope, regex] of Object.entries(scopes)) {
        if (regex.test(query)) return { scope };
      }
      return { scope: 'quick' };
    }
  }
];

class ActionRouter {
  constructor() {
    this.patterns = ACTION_PATTERNS;
  }

  /**
   * Route user query to appropriate action
   * Returns: { tool, params, confidence, reasoning }
   */
  async route(query, _context = {}) {
    log.info('Routing query', { query: query.substring(0, 50) });

    // Step 1: Try pattern matching first (fast, deterministic)
    const patternMatch = this.matchPatterns(query);
    if (patternMatch && patternMatch.confidence > 0.7) {
      log.info('Pattern match found', patternMatch);
      return patternMatch;
    }

    // Step 2: Use IntentClassifier for ambiguous queries
    const intentResult = await classifyIntent(query);

    // Step 3: Map intent to action
    const intentMatch = this.mapIntentToAction(intentResult, query);

    // Step 4: Choose best match
    const bestMatch = this.selectBestMatch(patternMatch, intentMatch);

    log.info('Route result', {
      tool: bestMatch?.tool,
      confidence: bestMatch?.confidence
    });

    return bestMatch || this.getFallbackAction(query);
  }

  /**
   * Match query against action patterns
   */
  matchPatterns(query) {
    const lowerQuery = query.toLowerCase();

    for (const pattern of this.patterns) {
      // Check if any pattern keyword matches
      const matchesPattern = pattern.patterns.some(p => lowerQuery.includes(p.toLowerCase()));

      if (matchesPattern) {
        const params = pattern.extractParams(query);

        if (params !== null) {
          // Calculate confidence based on specificity
          let confidence = 0.6;
          if (Object.keys(params).length > 0) confidence += 0.2;
          if (pattern.patterns.some(p => lowerQuery.startsWith(p.toLowerCase()))) confidence += 0.1;

          return {
            tool: pattern.tool,
            params,
            confidence: Math.min(confidence, 0.95),
            reasoning: `Pattern match: ${pattern.patterns[0]}`
          };
        }
      }
    }

    return null;
  }

  /**
   * Map IntentClassifier result to action
   */
  mapIntentToAction(intent, query) {
    if (!intent || intent.type === 'general') {
      return null;
    }

    const intentToolMap = {
      'medical_critical': { tool: 'start_triage', params: { condition: 'cpr' }, confidence: 0.9 },
      'medical_severe': { tool: 'start_triage', params: { condition: 'bleeding' }, confidence: 0.8 },
      'medical_query': { tool: 'search_content', params: { query }, confidence: 0.7 },
      'survival_critical': { tool: 'generate_protocol', params: { scenario: 'riot-nearby' }, confidence: 0.9 },
      'survival_prep': { tool: 'search_content', params: { query, category: 'survival' }, confidence: 0.7 },
      'legal_immediate': { tool: 'start_triage', params: { condition: 'arrest' }, confidence: 0.85 },
      'legal_query': { tool: 'search_content', params: { query, category: 'legal' }, confidence: 0.7 }
    };

    const mapping = intentToolMap[intent.type];
    if (!mapping) return null;

    // Refine params based on intent details
    const refinedParams = { ...mapping.params };
    if (intent.triageStory) {
      const storyId = intent.triageStory.replace('.ink.json', '').split('/').pop();
      refinedParams.condition = storyId;
    }
    if (intent.protocolId) {
      refinedParams.scenario = intent.protocolId;
    }

    return {
      tool: mapping.tool,
      params: refinedParams,
      confidence: mapping.confidence * intent.confidence,
      reasoning: `Intent: ${intent.type} (${intent.source})`
    };
  }

  /**
   * Select best match between pattern and intent results
   */
  selectBestMatch(patternMatch, intentMatch) {
    // If only one has result, use it
    if (!patternMatch) return intentMatch;
    if (!intentMatch) return patternMatch;

    // Compare confidence
    if (intentMatch.confidence > patternMatch.confidence + 0.15) {
      return intentMatch;
    }

    return patternMatch;
  }

  /**
   * Fallback action when no match found
   */
  getFallbackAction(query) {
    return {
      tool: 'search_content',
      params: { query, limit: 5 },
      confidence: 0.5,
      reasoning: 'No specific pattern matched, falling back to search',
      isFallback: true
    };
  }

  /**
   * Execute the routed action
   */
  async execute(action, executionContext = {}) {
    if (!action || !action.tool) {
      return { success: false, error: 'No action to execute' };
    }

    log.info('Executing routed action', { tool: action.tool, params: action.params });

    const result = await toolRegistry.execute(action.tool, action.params, executionContext);

    return {
      ...result,
      action: action.tool,
      confidence: action.confidence,
      reasoning: action.reasoning
    };
  }

  /**
   * Quick route + execute in one call
   */
  async process(query, executionContext = {}) {
    const action = await this.route(query, executionContext);
    const result = await this.execute(action, executionContext);

    return {
      query,
      action,
      result,
      success: result.success
    };
  }
}

// Export singleton
export const actionRouter = new ActionRouter();
export default ActionRouter;
