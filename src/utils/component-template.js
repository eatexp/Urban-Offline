/**
 * COMPONENT TEMPLATE - Vision Enforcement
 * "Hammer the vision into every component"
 * 
 * Usage:
 *   import { createComponent } from './component-template';
 *   
 *   const MyComponent = createComponent('MyComponent', {
 *     pillar: 'ai',  // 'grokopedia' | 'ai' | 'triage'
 *     description: 'Brief description',
 *     offlineFirst: true,
 *     features: ['usesAI', 'streaming']
 *   });
 * 
 * Compliance: VISION.md - All pillars
 *             .clinerules - All standards
 */

import React from 'react';
import { ComponentValidator, ComponentTemplates } from './vision-guardrails';
import { createLogger } from './logger';

const log = createLogger('ComponentTemplate');

/**
 * Create a component with built-in vision enforcement
 */
export function createComponent(name, config = {}) {
  const {
    pillar,           // 'grokopedia' | 'ai' | 'triage'
    description = '',
    offlineFirst = true,
    features = [],
    render,
    ...componentProps
  } = config;

  // Validate pillar
  if (pillar && !['grokopedia', 'ai', 'triage'].includes(pillar)) {
    throw new Error(`[${name}] Invalid pillar: ${pillar}. Must be 'grokopedia', 'ai', or 'triage'`);
  }

  // Check Ink constraints
  if (pillar === 'triage') {
    const forbiddenFeatures = features.filter(f => 
      ['usesAI', 'fetch', 'async'].includes(f)
    );
    if (forbiddenFeatures.length > 0) {
      throw new Error(
        `[${name}] Ink Triage components cannot use: ${forbiddenFeatures.join(', ')}. ` +
        `Ink must be deterministic and instant.`
      );
    }
  }

  // Generate JSDoc header
  const jsdoc = `/**
 * ${name}
 * ${description ? `\n * ${description}` : ''}
 * 
 * @pillar ${pillar || 'general'}${pillar ? ` - ${getPillarDescription(pillar)}` : ''}
 * ${offlineFirst ? '@offline-first Works without network' : ''}
 * ${features.includes('usesAI') ? '@ai-enhanced Uses local AI inference' : '@no-ai Deterministic logic only'}
 * 
 * @compliance VISION.md §1 - Three Pillars
 *             DESIGN_SYSTEM.md §2 - Colour System
 *             .clinerules §6 - Code Quality
 */`;

  // Create the component with validation
  const Component = (props) => {
    // Development-only validation
    if (process.env.NODE_ENV === 'development') {
      const validator = new ComponentValidator(name, pillar);
      
      // Validate features against pillar constraints
      validator.validatePillarConstraints({
        usesAI: features.includes('usesAI'),
        instantLoad: pillar === 'triage',
        offlineFirst
      });
      
      // Report any violations
      const result = validator.report();
      if (!result.valid) {
        log.warn(`[${name}] Component has validation issues`);
      }
    }

    // Call the render function
    return render(props);
  };

  // Attach metadata
  Component.displayName = name;
  Component.pillar = pillar;
  Component.offlineFirst = offlineFirst;
  Component.features = features;
  Component.jsdoc = jsdoc;

  return Component;
}

/**
 * Get pillar description
 */
function getPillarDescription(pillar) {
  const descriptions = {
    grokopedia: 'Knowledge layer - Browse, verify, explore',
    ai: 'Intelligence layer - Contextual, private',
    triage: 'Reliability layer - Deterministic, life-safety'
  };
  return descriptions[pillar] || '';
}

/**
 * Higher-order component for wrapping with validation
 */
export function withVisionEnforcement(WrappedComponent, options = {}) {
  const { pillar, features = [] } = options;

  const EnforcedComponent = (props) => {
    // Validation in development
    if (process.env.NODE_ENV === 'development') {
      const validator = new ComponentValidator(
        WrappedComponent.displayName || WrappedComponent.name,
        pillar
      );
      
      validator.validatePillarConstraints({
        usesAI: features.includes('usesAI'),
        instantLoad: pillar === 'triage'
      });
      
      validator.report();
    }

    return React.createElement(WrappedComponent, props);
  };

  EnforcedComponent.displayName = `WithVision(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return EnforcedComponent;
}

/**
 * Hook for component-level validation
 */
export function useComponentValidation(componentName, pillar) {
  const validator = React.useMemo(() => {
    return new ComponentValidator(componentName, pillar);
  }, [componentName, pillar]);

  return {
    validateColor: (color, context) => validator.validateColor(color, context),
    validateSpacing: (value, context) => validator.validateSpacing(value, context),
    validateTouchTarget: (w, h, context) => validator.validateTouchTarget(w, h, context),
    report: () => validator.report()
  };
}

/**
 * Create a pillar-specific component
 */
export const PillarComponents = {
  /**
   * Grokopedia (Knowledge) component
   */
  forGrokopedia(name, config) {
    return createComponent(name, {
      ...config,
      pillar: 'grokopedia',
      allowedColors: ['olive', 'copper'],
      features: [...(config.features || []), 'offlineFirst', 'searchable']
    });
  },

  /**
   * AI Assistant component
   */
  forAI(name, config) {
    return createComponent(name, {
      ...config,
      pillar: 'ai',
      allowedColors: ['copper', 'amber'],
      features: [...(config.features || []), 'usesAI', 'streaming', 'offlineFirst']
    });
  },

  /**
   * Ink Triage component - STRICT CONSTRAINTS
   */
  forTriage(name, config) {
    // Enforce triage constraints
    if (config.features?.some(f => ['usesAI', 'fetch', 'async'].includes(f))) {
      throw new Error(
        `[${name}] Ink Triage components CANNOT use AI or async operations. ` +
        `Use InkService and deterministic logic only.`
      );
    }

    return createComponent(name, {
      ...config,
      pillar: 'triage',
      allowedColors: ['amber', 'danger'],
      offlineFirst: true,
      features: [...(config.features || []), 'instantLoad', 'deterministic'],
      constraints: {
        noAI: true,
        maxLoadTime: 100  // 100ms max
      }
    });
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  createComponent,
  withVisionEnforcement,
  useComponentValidation,
  PillarComponents
};