#!/usr/bin/env node
/**
 * Urban-Offline Quality Audit System
 * 
 * Usage: node scripts/quality-audit.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  budgets: {
    initialBundle: 200 * 1024,
    aiModule: 150 * 1024,
    mapModule: 100 * 1024,
  },
  colours: {
    primary: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', 
              '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'],
  },
  requiredFiles: [
    'src/styles/colors.css',
    'DESIGN_SYSTEM.md',
  ],
};

class AuditResults {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }
  
  error(message, file) {
    this.errors.push({ message, file });
    console.error(`❌ ERROR: ${message}${file ? ` in ${file}` : ''}`);
  }
  
  warn(message, file) {
    this.warnings.push({ message, file });
    console.warn(`⚠️  WARNING: ${message}${file ? ` in ${file}` : ''}`);
  }
  
  pass(message) {
    this.passed.push(message);
    console.log(`✅ PASS: ${message}`);
  }
  
  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed:  ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors:   ${this.errors.length}`);
    console.log('-'.repeat(60));
    
    return {
      success: this.errors.length === 0,
      errors: this.errors.length,
      warnings: this.warnings.length,
    };
  }
}

const results = new AuditResults();

function findFiles(dir, ext) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, ext));
    } else if (stat.isFile() && fullPath.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkRequiredFiles() {
  console.log('\n📁 Checking required files...');
  
  CONFIG.requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.pass(`Required file exists: ${file}`);
    } else {
      results.error(`Missing required file: ${file}`);
    }
  });
}

function checkColourConsistency() {
  console.log('\n🎨 Checking colour consistency...');
  
  const cssFiles = findFiles('src', '.css');
  const allAllowedColours = Object.values(CONFIG.colours).flat();
  
  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const hexMatches = line.match(/#[a-fA-F0-9]{3,8}/g);
      if (hexMatches) {
        hexMatches.forEach(colour => {
          const normalized = colour.length === 4 
            ? '#' + colour.slice(1).split('').map(c => c + c).join('')
            : colour.toLowerCase();
          
          if (!allAllowedColours.includes(normalized) && !line.includes('ignore-audit')) {
            results.warn(`Non-palette colour: ${colour}`, `${file}:${index + 1}`);
          }
        });
      }
    });
  });
}

function main() {
  console.log('🔍 Urban-Offline Quality Audit');
  console.log('================================');
  
  checkRequiredFiles();
  checkColourConsistency();
  
  const summary = results.summary();
  
  process.exit(summary.success ? 0 : 1);
}

main();