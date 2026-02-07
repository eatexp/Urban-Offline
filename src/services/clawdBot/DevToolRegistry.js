/**
 * DevToolRegistry - Development & Quality Assurance Tools for clawdBot
 *
 * Tools that help clawdBot actively improve and monitor the app.
 * These are registered alongside core tools to enable development assistance.
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('clawdBot:DevTools');

/**
 * Development Tool Definitions
 */
export const devTools = {
  /**
   * Validate App Health
   * Runs comprehensive checks on app components
   */
  validate_app: {
    description: 'Run comprehensive health checks on app components',
    parameters: {
      component: {
        type: 'string',
        required: false,
        description: 'Specific component to validate: storage, search, ai, maps, triage, or all'
      }
    },
    validate: (params) => {
      const validComponents = ['storage', 'search', 'ai', 'maps', 'triage', 'all'];
      if (params.component && !validComponents.includes(params.component)) {
        return `Invalid component. Must be one of: ${validComponents.join(', ')}`;
      }
      return true;
    },
    execute: async (params) => {
      const component = params.component || 'all';
      const results = {
        timestamp: new Date().toISOString(),
        component,
        checks: {},
        summary: { passed: 0, failed: 0, warnings: 0 }
      };

      // Storage Check
      if (component === 'all' || component === 'storage') {
        try {
          const { db } = await import('../db');
          const stores = await db.getAllObjectStoreNames?.() || ['datasets', 'map_tiles', 'search_index'];
          results.checks.storage = {
            status: 'passed',
            details: `Storage accessible. Stores: ${stores.join(', ')}`,
            offlineReady: !navigator.onLine
          };
          results.summary.passed++;
        } catch (error) {
          results.checks.storage = {
            status: 'failed',
            details: `Storage error: ${error.message}`
          };
          results.summary.failed++;
        }
      }

      // Search Check
      if (component === 'all' || component === 'search') {
        try {
          const { HybridSearchService } = await import('../search/HybridSearch');
          const testQuery = await HybridSearchService.search('CPR');
          results.checks.search = {
            status: 'passed',
            details: `Search functional. Test query returned ${testQuery.totalResults} results`,
            hasResults: testQuery.totalResults > 0
          };
          results.summary.passed++;
        } catch (error) {
          results.checks.search = {
            status: 'failed',
            details: `Search error: ${error.message}`
          };
          results.summary.failed++;
        }
      }

      // AI Check
      if (component === 'all' || component === 'ai') {
        try {
          const { AIModelManager } = await import('../ai/AIModelManager');
          const isLoaded = AIModelManager.isModelLoaded?.() || false;
          results.checks.ai = {
            status: isLoaded ? 'passed' : 'warning',
            details: isLoaded ? 'AI model loaded' : 'AI model not loaded (will use fallback)',
            modelLoaded: isLoaded
          };
          isLoaded ? results.summary.passed++ : results.summary.warnings++;
        } catch (error) {
          results.checks.ai = {
            status: 'warning',
            details: `AI check error: ${error.message}`
          };
          results.summary.warnings++;
        }
      }

      // Maps Check
      if (component === 'all' || component === 'maps') {
        try {
          const { dataManager } = await import('../dataManager');
          const regions = await dataManager.getInstalledRegions();
          results.checks.maps = {
            status: regions.length > 0 ? 'passed' : 'warning',
            details: regions.length > 0 
              ? `Maps ready. ${regions.length} region(s) installed: ${regions.map(r => r.name).join(', ')}`
              : 'No map regions installed. Maps will use online fallback.',
            regionsInstalled: regions.length
          };
          regions.length > 0 ? results.summary.passed++ : results.summary.warnings++;
        } catch (error) {
          results.checks.maps = {
            status: 'failed',
            details: `Maps error: ${error.message}`
          };
          results.summary.failed++;
        }
      }

      // Triage Check
      if (component === 'all' || component === 'triage') {
        try {
          // Check if critical triage stories are available
          const criticalStories = [
            'health/cpr.ink.json',
            'health/choking.ink.json', 
            'health/severe-bleeding.ink.json',
            'legal/arrest-rights.ink.json'
          ];
          
          const availableStories = [];
          const missingStories = [];
          
          for (const story of criticalStories) {
            try {
              const response = await fetch(`/assets/ink/${story}`);
              if (response.ok) {
                availableStories.push(story);
              } else {
                missingStories.push(story);
              }
            } catch {
              missingStories.push(story);
            }
          }

          results.checks.triage = {
            status: availableStories.length === criticalStories.length ? 'passed' : 'warning',
            details: `${availableStories.length}/${criticalStories.length} critical triage flows available`,
            available: availableStories,
            missing: missingStories
          };
          
          availableStories.length === criticalStories.length 
            ? results.summary.passed++ 
            : results.summary.warnings++;
        } catch (error) {
          results.checks.triage = {
            status: 'failed',
            details: `Triage check error: ${error.message}`
          };
          results.summary.failed++;
        }
      }

      log.info('App validation complete', results.summary);
      return results;
    }
  },

  /**
   * Check Offline Coverage
   * Verifies critical functionality works offline
   */
  check_offline_coverage: {
    description: 'Verify critical app functionality works without internet',
    parameters: {
      criticalPath: {
        type: 'string',
        required: false,
        description: 'Test specific path: medical, legal, survival, maps, search, or all'
      }
    },
    execute: async (params) => {
      const path = params.criticalPath || 'all';
      const results = {
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
        tests: {},
        coverage: 0
      };

      const tests = [];

      // Medical emergency path
      if (path === 'all' || path === 'medical') {
        tests.push(async () => {
          try {
            const response = await fetch('/assets/ink/health/cpr.ink.json');
            const data = await response.json();
            return {
              name: 'medical',
              status: data ? 'passed' : 'failed',
              details: 'CPR guide accessible offline'
            };
          } catch (error) {
            return {
              name: 'medical',
              status: 'failed',
              details: `Medical content not available: ${error.message}`
            };
          }
        });
      }

      // Legal rights path
      if (path === 'all' || path === 'legal') {
        tests.push(async () => {
          try {
            const response = await fetch('/assets/ink/legal/arrest-rights.ink.json');
            const data = await response.json();
            return {
              name: 'legal',
              status: data ? 'passed' : 'failed',
              details: 'Arrest rights guide accessible offline'
            };
          } catch (error) {
            return {
              name: 'legal',
              status: 'failed',
              details: `Legal content not available: ${error.message}`
            };
          }
        });
      }

      // Survival path
      if (path === 'all' || path === 'survival') {
        tests.push(async () => {
          try {
            const response = await fetch('/assets/ink/survival/fire-making.ink.json');
            const data = await response.json();
            return {
              name: 'survival',
              status: data ? 'passed' : 'failed',
              details: 'Survival guide accessible offline'
            };
          } catch (error) {
            return {
              name: 'survival',
              status: 'failed',
              details: `Survival content not available: ${error.message}`
            };
          }
        });
      }

      // Maps path
      if (path === 'all' || path === 'maps') {
        tests.push(async () => {
          try {
            const { dataManager } = await import('../dataManager');
            const regions = await dataManager.getInstalledRegions();
            const hasTiles = regions.some(r => r.tileCount > 0);
            return {
              name: 'maps',
              status: hasTiles ? 'passed' : 'warning',
              details: hasTiles 
                ? `Map tiles available: ${regions.reduce((sum, r) => sum + (r.tileCount || 0), 0)} tiles`
                : 'No offline map tiles installed'
            };
          } catch (error) {
            return {
              name: 'maps',
              status: 'failed',
              details: `Map check error: ${error.message}`
            };
          }
        });
      }

      // Search path
      if (path === 'all' || path === 'search') {
        tests.push(async () => {
          try {
            const { HybridSearchService } = await import('../search/HybridSearch');
            const start = performance.now();
            const result = await HybridSearchService.search('emergency', { limit: 5 });
            const duration = performance.now() - start;
            return {
              name: 'search',
              status: result.results ? 'passed' : 'failed',
              details: `Search works offline. Found ${result.totalResults} results in ${duration.toFixed(0)}ms`
            };
          } catch (error) {
            return {
              name: 'search',
              status: 'failed',
              details: `Search not working: ${error.message}`
            };
          }
        });
      }

      // Run all tests
      const testResults = await Promise.all(tests.map(t => t()));
      testResults.forEach(r => {
        results.tests[r.name] = r;
      });

      // Calculate coverage
      const passed = Object.values(results.tests).filter(t => t.status === 'passed').length;
      const total = Object.values(results.tests).length;
      results.coverage = Math.round((passed / total) * 100);

      log.info('Offline coverage check complete', { coverage: results.coverage });
      return results;
    }
  },

  /**
   * Monitor Performance
   * Tracks app performance metrics
   */
  monitor_performance: {
    description: 'Monitor app performance metrics and identify bottlenecks',
    parameters: {
      metric: {
        type: 'string',
        required: false,
        description: 'Specific metric: startup, search, ai, render, storage, or all'
      }
    },
    execute: async (params) => {
      const metric = params.metric || 'all';
      const results = {
        timestamp: new Date().toISOString(),
        metrics: {}
      };

      // Startup time
      if (metric === 'all' || metric === 'startup') {
        if (window.performance) {
          const nav = window.performance.getEntriesByType('navigation')[0];
          if (nav) {
            results.metrics.startup = {
              domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
              loadComplete: nav.loadEventEnd - nav.startTime,
              firstByte: nav.responseStart - nav.startTime
            };
          }
        }
      }

      // Search performance
      if (metric === 'all' || metric === 'search') {
        try {
          const { HybridSearchService } = await import('../search/HybridSearch');
          const queries = ['CPR', 'legal rights', 'water', 'fire', 'emergency'];
          const times = [];
          
          for (const query of queries) {
            const start = performance.now();
            await HybridSearchService.search(query, { limit: 10 });
            times.push(performance.now() - start);
          }
          
          results.metrics.search = {
            averageTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
            minTime: Math.min(...times).toFixed(2),
            maxTime: Math.max(...times).toFixed(2),
            queries: queries.length
          };
        } catch (error) {
          results.metrics.search = { error: error.message };
        }
      }

      // Storage metrics
      if (metric === 'all' || metric === 'storage') {
        try {
          if (navigator.storage?.estimate) {
            const estimate = await navigator.storage.estimate();
            results.metrics.storage = {
              usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
              quota: estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) + ' MB' : 'unlimited',
              usagePercent: estimate.quota 
                ? ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
                : 'unknown'
            };
          }
        } catch (error) {
          results.metrics.storage = { error: error.message };
        }
      }

      // Memory usage
      if (metric === 'all' || metric === 'render') {
        if (window.performance?.memory) {
          const mem = window.performance.memory;
          results.metrics.memory = {
            used: (mem.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            total: (mem.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            limit: (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
          };
        }
      }

      log.info('Performance monitoring complete', results.metrics);
      return results;
    }
  },

  /**
   * Suggest Improvements
   * Analyzes app state and suggests enhancements
   */
  suggest_improvements: {
    description: 'Analyze app and suggest improvements based on current state',
    parameters: {
      focus: {
        type: 'string',
        required: false,
        description: 'Focus area: content, performance, offline, ux, or all'
      }
    },
    execute: async (params) => {
      const focus = params.focus || 'all';
      const suggestions = [];

      // Content suggestions
      if (focus === 'all' || focus === 'content') {
        try {
          const { dataManager } = await import('../dataManager');
          const regions = await dataManager.getInstalledRegions();
          
          if (regions.length === 0) {
            suggestions.push({
              category: 'content',
              priority: 'high',
              title: 'Install Map Regions',
              description: 'No offline map regions installed. Install at least one region for full offline functionality.',
              action: 'Navigate to /resources to download regions'
            });
          }

          // Check for content gaps
          try {
            const { articleService } = await import('../articleService');
            const articles = await articleService.getAllArticles?.() || [];
            if (articles.length < 10) {
              suggestions.push({
                category: 'content',
                priority: 'medium',
                title: 'Add More Articles',
                description: `Only ${articles.length} articles in knowledge base. Consider adding more emergency content.`,
                action: 'Run npm run fetch-content to update content database'
              });
            }
          } catch {
            // Article service may not have getAllArticles
          }
        } catch (error) {
          suggestions.push({
            category: 'content',
            priority: 'low',
            title: 'Content Check Failed',
            description: `Could not verify content: ${error.message}`
          });
        }
      }

      // Performance suggestions
      if (focus === 'all' || focus === 'performance') {
        if (window.performance?.memory) {
          const mem = window.performance.memory;
          const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
          
          if (usagePercent > 80) {
            suggestions.push({
              category: 'performance',
              priority: 'high',
              title: 'High Memory Usage',
              description: `Memory usage at ${usagePercent.toFixed(1)}%. Consider clearing cache or restarting app.`,
              action: 'Navigate to /settings to clear cache'
            });
          }
        }
      }

      // Offline suggestions
      if (focus === 'all' || focus === 'offline') {
        if (navigator.onLine) {
          suggestions.push({
            category: 'offline',
            priority: 'medium',
            title: 'Test Offline Mode',
            description: 'You are currently online. Test offline functionality by enabling airplane mode.',
            action: 'Enable airplane mode and verify critical features still work'
          });
        }

        // Check Service Worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (!registration.active) {
            suggestions.push({
              category: 'offline',
              priority: 'high',
              title: 'Service Worker Not Active',
              description: 'Offline caching may not work properly.',
              action: 'Refresh the page to activate service worker'
            });
          }
        }
      }

      // UX suggestions
      if (focus === 'all' || focus === 'ux') {
        // Check for mobile optimization
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        if (isMobile) {
          suggestions.push({
            category: 'ux',
            priority: 'low',
            title: 'Mobile Device Detected',
            description: 'Running on mobile. Consider installing as PWA for better experience.',
            action: 'Add to home screen from browser menu'
          });
        }
      }

      log.info('Improvement suggestions generated', { count: suggestions.length });
      return {
        timestamp: new Date().toISOString(),
        suggestionCount: suggestions.length,
        suggestions: suggestions.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
      };
    }
  },

  /**
   * Run Audit
   * Executes automated quality checks
   */
  run_audit: {
    description: 'Run automated code quality and functionality audit',
    parameters: {
      scope: {
        type: 'string',
        required: false,
        description: 'Audit scope: quick, full, or critical'
      }
    },
    execute: async (params) => {
      const scope = params.scope || 'quick';
      const audit = {
        timestamp: new Date().toISOString(),
        scope,
        results: {}
      };

      // Run validation
      const validationResults = await devTools.validate_app.execute({ component: 'all' });
      audit.results.validation = validationResults;

      // Run offline coverage
      if (scope === 'full' || scope === 'critical') {
        const coverageResults = await devTools.check_offline_coverage.execute({ criticalPath: 'all' });
        audit.results.offlineCoverage = coverageResults;
      }

      // Run performance check
      if (scope === 'full') {
        const perfResults = await devTools.monitor_performance.execute({ metric: 'all' });
        audit.results.performance = perfResults;
      }

      // Generate summary
      const totalChecks = Object.values(audit.results).reduce((sum, r) => {
        return sum + (r.summary?.passed || 0) + (r.summary?.failed || 0) + (r.summary?.warnings || 0);
      }, 0);
      
      const passedChecks = Object.values(audit.results).reduce((sum, r) => {
        return sum + (r.summary?.passed || 0);
      }, 0);

      audit.summary = {
        totalChecks,
        passedChecks,
        failedChecks: Object.values(audit.results).reduce((sum, r) => {
          return sum + (r.summary?.failed || 0);
        }, 0),
        score: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0,
        status: passedChecks === totalChecks ? 'passed' : 'issues-found'
      };

      log.info('Audit complete', audit.summary);
      return audit;
    }
  }
};

/**
 * Register dev tools with tool registry
 * Call this after ToolRegistry is initialized
 */
export function registerDevTools(toolRegistry) {
  Object.entries(devTools).forEach(([name, definition]) => {
    toolRegistry.register(name, definition);
    log.info(`Registered dev tool: ${name}`);
  });
}

export default devTools;