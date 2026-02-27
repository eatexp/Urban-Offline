/**
 * VISION GUARDRAILS - Architectural Enforcement
 * "Hammer the vision into the codebase"
 * 
 * This module provides runtime checks, validations, and templates
 * that enforce the Urban-Offline architectural vision.
 * 
 * Philosophy: The architecture should be self-documenting and
 * self-enforcing. Violations throw descriptive errors in development.
 * 
 * Compliance: VISION.md - All sections
 *             .clinerules - All standards
 */

import { createLogger } from './logger';

const log = createLogger('VisionGuardrails');

// =============================================================================
// ARCHITECTURAL CONSTANTS - The Three Pillars
// =============================================================================

export const PILLARS = {
  GROKOPEDIA: {
    id: 'grokopedia',
    name: 'Grokopedia',
    description: 'Knowledge layer - Browse, verify, explore',
    color: 'olive',
    allowedColors: ['--color-knowledge', '--olive-500', '--olive-600'],
    icon: 'Book',
    routes: ['/grokopedia', '/library'],
    components: ['GrokopediaEnhanced', 'ArticleView', 'ContentBrowser']
  },
  
  AI_ASSISTANT: {
    id: 'ai',
    name: 'AI Emergency Assistant',
    description: 'Intelligence layer - Contextual, private',
    color: 'copper',
    allowedColors: ['--color-ai', '--copper-500', '--copper-600'],
    icon: 'Sparkles',
    routes: ['/ai', '/chat'],
    components: ['AIChat', 'ModelMarketplaceEnhanced']
  },
  
  INK_TRIAGE: {
    id: 'triage',
    name: 'Ink Triage',
    description: 'Reliability layer - Deterministic, life-safety',
    color: 'amber',
    allowedColors: ['--accent-primary', '--amber-500', '--amber-600'],
    icon: 'AlertTriangle',
    routes: ['/triage', '/emergency'],
    components: ['TriagePage', 'ProtocolPage'],
    constraints: {
      noAI: true,  // Ink NEVER uses AI
      deterministic: true,
      instantLoad: true
    }
  }
};

// =============================================================================
// DESIGN SYSTEM ENFORCEMENT
// =============================================================================

export const DESIGN_RULES = {
  // Color enforcement
  colors: {
    allowedBackgrounds: [
      'var(--bg-void)',
      'var(--bg-primary)',
      'var(--bg-secondary)',
      'var(--bg-tertiary)',
      'var(--bg-elevated)',
      'var(--midnight-0)',
      'var(--midnight-50)',
      'var(--midnight-100)',
      'var(--midnight-200)'
    ],
    
    forbiddenColors: [
      '#ffffff',  // Pure white - too harsh
      '#000000',  // Pure black - too stark
      'red',      // Generic red - use --danger-500
      'blue',     // Generic blue - use semantic colors
      'green',    // Generic green - use --olive-500
    ],
    
    semanticMapping: {
      primary: '--accent-primary',      // Amber
      secondary: '--accent-secondary',  // Teal
      success: '--status-success',      // Olive
      warning: '--status-warning',      // Amber
      error: '--status-error',          // Danger red
      info: '--status-info'             // Teal
    }
  },
  
  // Spacing enforcement (8px grid)
  spacing: {
    base: 8,
    allowed: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    validate: (value) => {
      const px = parseInt(value);
      return px % 4 === 0;  // Must be divisible by 4
    }
  },
  
  // Typography enforcement
  typography: {
    allowedFamilies: [
      'var(--font-family-primary)',
      'var(--font-family-mono)',
      '-apple-system',
      'BlinkMacSystemFont'
    ],
    forbidden: ['serif', 'Times New Roman', 'Georgia']
  },
  
  // Border radius enforcement
  radius: {
    allowed: [4, 6, 8, 12, 16, 20, 24],
    componentMapping: {
      button: 12,
      card: 16,
      input: 12,
      badge: 100,  // Pill shape
      modal: 20
    }
  }
};

// =============================================================================
// COMPONENT VALIDATOR
// =============================================================================

export class ComponentValidator {
  constructor(componentName, pillar) {
    this.componentName = componentName;
    this.pillar = pillar;
    this.violations = [];
  }
  
  /**
   * Validate color usage
   */
  validateColor(colorValue, context) {
    // Check forbidden colors
    if (DESIGN_RULES.colors.forbiddenColors.includes(colorValue)) {
      this.violations.push({
        type: 'color',
        message: `Forbidden color "${colorValue}" in ${context}`,
        suggestion: `Use semantic color variables instead`,
        rule: 'DESIGN_SYSTEM.md §2'
      });
      return false;
    }
    
    // Check if using CSS variables (preferred)
    if (!colorValue.includes('var(--')) {
      log.warn(`[${this.componentName}] Consider using CSS variables for ${context}: ${colorValue}`);
    }
    
    return true;
  }
  
  /**
   * Validate spacing
   */
  validateSpacing(value, context) {
    const px = parseInt(value);
    if (isNaN(px)) return true;  // Skip non-pixel values
    
    if (!DESIGN_RULES.spacing.validate(value)) {
      this.violations.push({
        type: 'spacing',
        message: `Invalid spacing "${value}" in ${context}`,
        suggestion: `Use multiples of 4px (8px grid system)`,
        rule: 'DESIGN_SYSTEM.md §4'
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate touch target size
   */
  validateTouchTarget(width, height, context) {
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (w < 44 || h < 44) {
      this.violations.push({
        type: 'accessibility',
        message: `Touch target too small (${w}x${h}) in ${context}`,
        suggestion: `Minimum 44x44px (prefer 48x48px)`,
        rule: '.clinerules §6 - 48px+ touch targets'
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate pillar constraints
   */
  validatePillarConstraints(features) {
    if (!this.pillar) return true;
    
    const pillarConfig = Object.values(PILLARS).find(p => p.id === this.pillar);
    if (!pillarConfig) return true;
    
    // Check Ink constraints
    if (pillarConfig.constraints?.noAI && features.usesAI) {
      this.violations.push({
        type: 'architecture',
        message: `${this.componentName} violates Ink Triage constraints`,
        suggestion: 'Ink components must NEVER use AI. Use deterministic logic only.',
        rule: 'VISION.md §1.3 - Zero AI Dependency'
      });
      return false;
    }
    
    // Check instant load constraint
    if (pillarConfig.constraints?.instantLoad && !features.instantLoad) {
      log.warn(`[${this.componentName}] Should load instantly for ${pillarConfig.name}`);
    }
    
    return true;
  }
  
  /**
   * Report violations
   */
  report() {
    if (this.violations.length === 0) {
      log.info(`[${this.componentName}] ✓ All validations passed`);
      return { valid: true };
    }
    
    log.error(`[${this.componentName}] ${this.violations.length} violation(s):`);
    this.violations.forEach((v, i) => {
      log.error(`  ${i + 1}. [${v.type}] ${v.message}`);
      log.error(`     Suggestion: ${v.suggestion}`);
      log.error(`     Rule: ${v.rule}`);
    });
    
    // In development, throw for critical violations
    if (import.meta.env?.DEV) {
      const critical = this.violations.filter(v => v.type === 'architecture');
      if (critical.length > 0) {
        throw new Error(
          `Architectural violation in ${this.componentName}: ${critical[0].message}`
        );
      }
    }
    
    return { valid: false, violations: this.violations };
  }
}

// =============================================================================
// COMPONENT TEMPLATES
// =============================================================================

export const ComponentTemplates = {
  /**
   * Standard component template with vision enforcement
   */
  createComponent(name, options = {}) {
    const { pillar, features = {} } = options;
    
    return {
      // JSDoc template
      jsdoc: `/**
 * ${name}
 * 
 * ${pillar ? `@pillar ${pillar} - ${PILLARS[pillar.toUpperCase()]?.description || ''}` : ''}
 * ${features.offlineFirst ? '@offline-first Critical content' : ''}
 * ${features.usesAI ? '@ai-enhanced Uses local AI' : '@no-ai Deterministic only'}
 * 
 * Compliance: VISION.md
 *             DESIGN_SYSTEM.md
 *             .clinerules
 */`,
      
      // Import order template
      imports: `import React from 'react';
// External libs
// Internal services
// Components
// Styles`,
      
      // Validation hook
      useValidation: () => {
        const validator = new ComponentValidator(name, pillar);
        return validator;
      }
    };
  },
  
  /**
   * Pillar-specific component template
   */
  forPillar(pillarId, name) {
    const pillar = Object.values(PILLARS).find(p => p.id === pillarId);
    if (!pillar) {
      throw new Error(`Unknown pillar: ${pillarId}`);
    }
    
    return this.createComponent(name, {
      pillar: pillarId,
      features: {
        offlineFirst: true,
        usesAI: pillarId === 'ai',
        deterministic: pillarId === 'triage'
      }
    });
  }
};

// =============================================================================
// OFFLINE-FIRST ENFORCEMENT
// =============================================================================

export const OfflineEnforcement = {
  /**
   * Verify component works offline
   */
  verifyOfflineReady(componentName, dependencies) {
    const networkDependencies = dependencies.filter(dep => 
      dep.includes('fetch') || 
      dep.includes('axios') || 
      dep.includes('online')
    );
    
    if (networkDependencies.length > 0) {
      log.warn(`[${componentName}] Has network dependencies:`, networkDependencies);
      log.warn(`  Ensure fallback behavior for offline mode`);
    }
    
    return networkDependencies.length === 0;
  },
  
  /**
   * Check for offline storage
   */
  verifyStorageIntegration(componentName, storageMethod) {
    const validMethods = ['IndexedDB', 'localStorage', 'db.js', 'NativeStorage'];
    const isValid = validMethods.some(m => storageMethod.includes(m));
    
    if (!isValid) {
      log.warn(`[${componentName}] Storage method "${storageMethod}" may not support offline-first`);
    }
    
    return isValid;
  }
};

// =============================================================================
// PERFORMANCE ENFORCEMENT
// =============================================================================

export const PerformanceEnforcement = {
  budgets: {
    initialBundle: 200 * 1024,      // 200KB
    aiModule: 150 * 1024,           // 150KB lazy-loaded
    mapModule: 100 * 1024,          // 100KB lazy-loaded
    firstPaint: 100,                // 100ms
    timeToInteractive: 3000         // 3s
  },
  
  /**
   * Check bundle size
   */
  checkBundleSize(componentName, sizeBytes) {
    if (sizeBytes > this.budgets.initialBundle) {
      log.warn(`[${componentName}] Bundle size ${(sizeBytes/1024).toFixed(1)}KB exceeds ${this.budgets.initialBundle/1024}KB budget`);
      log.warn(`  Consider code splitting or lazy loading`);
    }
  },
  
  /**
   * Enforce lazy loading for heavy modules
   */
  requireLazyLoad(componentName, dependencies) {
    const heavyModules = ['transformers', 'mapbox', 'leaflet', 'chart'];
    const violations = dependencies.filter(dep => 
      heavyModules.some(hm => dep.toLowerCase().includes(hm))
    );
    
    if (violations.length > 0) {
      log.warn(`[${componentName}] Heavy dependencies should be lazy-loaded:`, violations);
    }
    
    return violations;
  }
};

// =============================================================================
// PREMIUM ENFORCEMENT
// =============================================================================

export const PremiumEnforcement = {
  /**
   * Validate native feel
   */
  validateNativeFeel(componentName, platform) {
    const checks = {
      ios: {
        radius: 20,  // iOS cards
        spring: true,
        blur: 24
      },
      android: {
        radius: 16,  // Material 3
        ripple: true,
        elevation: true
      }
    };
    
    return checks[platform] || checks.ios;
  },
  
  /**
   * Enforce haptics usage
   */
  requireHaptics(componentName, interactions) {
    const hapticTriggers = ['onClick', 'onPress', 'onSelect', 'onSuccess'];
    const missing = hapticTriggers.filter(trigger => 
      interactions.includes(trigger) && !interactions.includes(`haptic${trigger}`)
    );
    
    if (missing.length > 0) {
      log.info(`[${componentName}] Consider adding haptics for: ${missing.join(', ')}`);
    }
  },
  
  /**
   * Validate animation quality
   */
  validateAnimations(componentName, animationConfig) {
    const { duration, easing } = animationConfig;
    
    // Check duration
    if (duration > 500) {
      log.warn(`[${componentName}] Animation duration ${duration}ms may feel sluggish`);
    }
    
    // Check easing
    const validEasings = ['ease-out', 'cubic-bezier(0.4, 0, 0.2, 1)'];
    if (!validEasings.some(e => easing.includes(e))) {
      log.info(`[${componentName}] Consider standard easing for native feel`);
    }
  }
};

// =============================================================================
// DEV MODE GUARDRAILS
// =============================================================================

if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  // Global error handler for architectural violations
  window.addEventListener('error', (event) => {
    if (event.message.includes('Architectural violation')) {
      log.error('🚫 VISION GUARDRAIL VIOLATION');
      log.error(event.message);
      event.preventDefault();
    }
  });
  
  // Warn about direct color usage
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('#') && !message.includes('var(--')) {
      log.debug('Consider using CSS variables instead of hex colors');
    }
    originalWarn.apply(console, args);
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  PILLARS,
  DESIGN_RULES,
  ComponentValidator,
  ComponentTemplates,
  OfflineEnforcement,
  PerformanceEnforcement,
  PremiumEnforcement
};