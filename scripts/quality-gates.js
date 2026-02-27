#!/usr/bin/env node
/**
 * QUALITY GATES - Automated Testing & Enforcement
 * "Loops for testing and refinement"
 * 
 * Pre-commit and CI/CD quality checks that enforce:
 * - Design system compliance
 * - Performance budgets
 * - Offline functionality
 * - Architectural vision
 * 
 * Usage: node scripts/quality-gates.js [options]
 * 
 * Compliance: VISION.md §6 - Testing & Quality Assurance
 */

const fs = require('fs');
const path = require('path');
require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // File patterns to check
  patterns: {
    components: 'src/components/**/*.{jsx,tsx}',
    pages: 'src/pages/**/*.{jsx,tsx}',
    styles: 'src/styles/**/*.css',
    services: 'src/services/**/*.js'
  },

  // Performance budgets (bytes)
  budgets: {
    initialBundle: 200 * 1024,      // 200KB
    componentMax: 15 * 1024,         // 15KB per component
    cssMax: 50 * 1024                // 50KB CSS total
  },

  // Forbidden patterns (design violations)
  forbiddenPatterns: [
    { pattern: /#[0-9a-f]{3,6}/i, message: 'Use CSS variables, not hex colors', severity: 'warning' },
    { pattern: /color:\s*red/i, message: 'Use --status-error, not "red"', severity: 'error' },
    { pattern: /color:\s*blue/i, message: 'Use semantic colors, not "blue"', severity: 'error' },
    { pattern: /color:\s*green/i, message: 'Use --status-success, not "green"', severity: 'error' },
    { pattern: /padding:\s*[0-9]+px(?!\s*\/\*\s*4\s*\*\/)/, message: 'Use 4px grid (8px base)', severity: 'warning' },
    { pattern: /margin:\s*[0-9]+px(?!\s*\/\*\s*4\s*\*\/)/, message: 'Use 4px grid (8px base)', severity: 'warning' },
    { pattern: /setTimeout.*[0-9]{4,}/, message: 'Long timeouts may indicate poor performance', severity: 'warning' },
    { pattern: /fetch\(.*\)(?!.*catch)/, message: 'Network requests must have error handling', severity: 'error' },
    { pattern: /localStorage\.getItem(?!.*\|\|)/, message: 'localStorage access needs fallback', severity: 'warning' }
  ],

  // Required patterns (architecture enforcement)
  requiredPatterns: {
    components: {
      'React import': /import\s+React/,
      'JSDoc header': /\/\*\*/,
      'Component function': /export\s+(default\s+)?function|const\s+\w+\s*=\s*(\([^)]*\)\s*=>|React\.memo|React\.forwardRef)/
    },
    services: {
      'Logger usage': /createLogger/,
      'Error handling': /try\s*{[^}]*}\s*catch|\.catch\(/s
    }
  },

  // Pillar enforcement
  pillars: {
    triage: {
      path: 'src/pages/Triage',
      forbidden: ['useAI', 'generate', 'AIModelManager', 'fetch('],
      required: ['InkService', 'deterministic']
    },
    ai: {
      path: 'src/services/ai',
      required: ['createLogger', 'checkAICapability']
    }
  }
};

// =============================================================================
// QUALITY CHECKS
// =============================================================================

class QualityChecker {
  constructor() {
    this.issues = [];
    this.stats = {
      filesChecked: 0,
      componentsChecked: 0,
      servicesChecked: 0,
      totalIssues: 0,
      errors: 0,
      warnings: 0
    };
  }

  /**
   * Run all quality checks
   */
  async run() {
    console.log('🔍 Urban-Offline Quality Gates\n');

    // Check 1: Design System Compliance
    await this.checkDesignSystem();

    // Check 2: Performance Budgets
    await this.checkPerformance();

    // Check 3: Architectural Compliance
    await this.checkArchitecture();

    // Check 4: Offline-First Verification
    await this.checkOfflineFirst();

    // Check 5: Pillar Enforcement
    await this.checkPillars();

    // Report
    return this.generateReport();
  }

  /**
   * Check design system compliance
   */
  async checkDesignSystem() {
    console.log('🎨 Checking Design System Compliance...');

    const cssFiles = this.getFiles(CONFIG.patterns.styles);
    const componentFiles = [
      ...this.getFiles(CONFIG.patterns.components),
      ...this.getFiles(CONFIG.patterns.pages)
    ];

    // Check CSS files
    for (const file of cssFiles) {
      this.stats.filesChecked++;
      const content = fs.readFileSync(file, 'utf8');

      // Check for forbidden patterns
      for (const { pattern, message, severity } of CONFIG.forbiddenPatterns) {
        if (pattern.test(content)) {
          this.addIssue(file, message, severity, 'design-system');
        }
      }
    }

    // Check component files
    for (const file of componentFiles) {
      this.stats.filesChecked++;
      const content = fs.readFileSync(file, 'utf8');

      // Check required patterns
      const fileType = file.includes('/services/') ? 'services' : 'components';
      const patterns = CONFIG.requiredPatterns[fileType];

      if (patterns) {
        for (const [name, pattern] of Object.entries(patterns)) {
          if (!pattern.test(content)) {
            this.addIssue(file, `Missing: ${name}`, 'warning', 'design-system');
          }
        }
      }
    }

    console.log(`  ✓ Checked ${this.stats.filesChecked} files`);
  }

  /**
   * Check performance budgets
   */
  async checkPerformance() {
    console.log('⚡ Checking Performance Budgets...');

    // Check bundle size if available
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      const jsFiles = this.getFiles('dist/**/*.js');
      let totalSize = 0;

      for (const file of jsFiles) {
        const stats = fs.statSync(file);
        totalSize += stats.size;
      }

      if (totalSize > CONFIG.budgets.initialBundle) {
        this.addIssue(
          'dist/',
          `Bundle size ${(totalSize / 1024).toFixed(1)}KB exceeds ${CONFIG.budgets.initialBundle / 1024}KB budget`,
          'error',
          'performance'
        );
      } else {
        console.log(`  ✓ Bundle size: ${(totalSize / 1024).toFixed(1)}KB / ${CONFIG.budgets.initialBundle / 1024}KB`);
      }
    }

    // Check component sizes
    const components = this.getFiles(CONFIG.patterns.components);
    for (const file of components) {
      const stats = fs.statSync(file);
      if (stats.size > CONFIG.budgets.componentMax) {
        this.addIssue(
          file,
          `Component ${(stats.size / 1024).toFixed(1)}KB exceeds ${CONFIG.budgets.componentMax / 1024}KB budget`,
          'warning',
          'performance'
        );
      }
    }
  }

  /**
   * Check architectural compliance
   */
  async checkArchitecture() {
    console.log('🏗️  Checking Architectural Compliance...');

    // Check for lazy loading on heavy imports
    const files = [
      ...this.getFiles(CONFIG.patterns.components),
      ...this.getFiles(CONFIG.patterns.pages)
    ];

    const heavyImports = ['transformers', '@xenova/transformers', 'mapbox-gl', 'leaflet'];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      for (const imp of heavyImports) {
        if (content.includes(`from '${imp}'`) || content.includes(`from "${imp}"`)) {
          // Check if it's lazy loaded
          if (!content.includes('React.lazy') && !content.includes('lazy(')) {
            this.addIssue(
              file,
              `Heavy dependency '${imp}' should be lazy-loaded`,
              'warning',
              'architecture'
            );
          }
        }
      }
    }

    console.log('  ✓ Architecture checks complete');
  }

  /**
   * Check offline-first compliance
   */
  async checkOfflineFirst() {
    console.log('📴 Checking Offline-First Compliance...');

    const files = this.getFiles(CONFIG.patterns.services);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for network requests without fallback
      if (content.includes('fetch(') && !content.includes('navigator.onLine')) {
        this.addIssue(
          file,
          'Network request may need offline fallback',
          'warning',
          'offline-first'
        );
      }

      // Check for storage usage
      if (content.includes('localStorage') && !content.includes('try')) {
        this.addIssue(
          file,
          'localStorage access should be wrapped in try-catch',
          'warning',
          'offline-first'
        );
      }
    }

    console.log('  ✓ Offline-first checks complete');
  }

  /**
   * Check pillar enforcement
   */
  async checkPillars() {
    console.log('🎯 Checking Three Pillar Enforcement...');

    // Check Ink Triage constraints
    const triageFiles = this.getFiles('src/pages/Triage*.{jsx,tsx}');
    for (const file of triageFiles) {
      const content = fs.readFileSync(file, 'utf8');

      for (const forbidden of CONFIG.pillars.triage.forbidden) {
        if (content.includes(forbidden)) {
          this.addIssue(
            file,
            `Ink Triage must not use: ${forbidden}`,
            'error',
            'pillars'
          );
        }
      }
    }

    console.log('  ✓ Pillar checks complete');
  }

  /**
   * Get files matching pattern
   */
  getFiles(pattern) {
    try {
      const glob = require('glob');
      return glob.sync(pattern, { cwd: process.cwd() });
    } catch (_e) {
      // Fallback: simple file walking
      return this.walkFiles(process.cwd(), pattern);
    }
  }

  /**
   * Simple file walker fallback
   */
  walkFiles(dir, pattern) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.walkFiles(fullPath, pattern));
      } else if (stat.isFile()) {
        // Simple pattern matching
        const ext = path.extname(item);
        if (pattern.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Add an issue
   */
  addIssue(file, message, severity, category) {
    const issue = {
      file: path.relative(process.cwd(), file),
      message,
      severity,
      category,
      timestamp: new Date().toISOString()
    };

    this.issues.push(issue);
    this.stats.totalIssues++;

    if (severity === 'error') {
      this.stats.errors++;
    } else {
      this.stats.warnings++;
    }
  }

  /**
   * Generate quality report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('QUALITY GATE REPORT');
    console.log('='.repeat(60));

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`  Files checked: ${this.stats.filesChecked}`);
    console.log(`  Total issues: ${this.stats.totalIssues}`);
    console.log(`  Errors: ${this.stats.errors} ❌`);
    console.log(`  Warnings: ${this.stats.warnings} ⚠️`);

    // Categorized issues
    if (this.issues.length > 0) {
      console.log(`\n📋 Issues by Category:`);

      const byCategory = {};
      for (const issue of this.issues) {
        if (!byCategory[issue.category]) {
          byCategory[issue.category] = [];
        }
        byCategory[issue.category].push(issue);
      }

      for (const [category, issues] of Object.entries(byCategory)) {
        console.log(`\n  ${category.toUpperCase()} (${issues.length}):`);
        for (const issue of issues) {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`    ${icon} ${issue.file}`);
          console.log(`       ${issue.message}`);
        }
      }
    }

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (this.stats.errors === 0) {
      console.log('✅ ALL QUALITY GATES PASSED');
      console.log('='.repeat(60));
      return { success: true, issues: this.issues };
    } else {
      console.log(`❌ ${this.stats.errors} ERROR(S) MUST BE FIXED`);
      console.log('='.repeat(60));
      return { success: false, issues: this.issues };
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const checker = new QualityChecker();
  const result = await checker.run();

  // Exit with error code if failures
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Quality gates failed:', err);
    process.exit(1);
  });
}

module.exports = { QualityChecker, CONFIG };