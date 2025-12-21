// scripts/analyze-bundle-size.js
// Analyzes production bundle size and creates size budget tracking

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const DIST_DIR = join(PROJECT_ROOT, 'dist');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets');

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
    try {
        const stats = statSync(filePath);
        return stats.size;
    } catch (_e) {
        return 0;
    }
}

function getDirectorySize(dirPath) {
    let totalSize = 0;
    try {
        const files = readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = join(dirPath, file.name);
            if (file.isDirectory()) {
                totalSize += getDirectorySize(filePath);
            } else {
                totalSize += getFileSize(filePath);
            }
        }
    } catch (_e) {
        // Directory doesn't exist
    }
    return totalSize;
}

function analyzeBundle() {
    console.log('=== Urban-Offline Bundle Size Analysis ===\n');

    const results = {
        timestamp: new Date().toISOString(),
        targets: {
            total: 500 * 1024 * 1024, // 500MB
            code: 50 * 1024 * 1024, // 50MB
            content: 150 * 1024 * 1024, // 150MB
            maps: 200 * 1024 * 1024, // 200MB
            buffer: 100 * 1024 * 1024 // 100MB buffer
        },
        actual: {},
        breakdown: {}
    };

    // Analyze dist/ directory (production build)
    if (getFileSize(DIST_DIR) > 0 || getDirectorySize(DIST_DIR) > 0) {
        const distSize = getDirectorySize(DIST_DIR);
        results.actual.dist = distSize;
        results.breakdown.dist = {
            size: distSize,
            formatted: formatBytes(distSize)
        };

        // Analyze individual files in dist/ (including subdirectories)
        try {
            function scanDirectory(dir, basePath = '') {
                const files = readdirSync(dir, { withFileTypes: true });
                const jsFiles = [];
                const cssFiles = [];
                const otherFiles = [];

                for (const file of files) {
                    const filePath = join(dir, file.name);
                    const relativePath = basePath ? join(basePath, file.name) : file.name;

                    if (file.isDirectory()) {
                        const subResults = scanDirectory(filePath, relativePath);
                        jsFiles.push(...subResults.jsFiles);
                        cssFiles.push(...subResults.cssFiles);
                        otherFiles.push(...subResults.otherFiles);
                    } else if (file.isFile()) {
                        const size = getFileSize(filePath);
                    const ext = file.name.split('.').pop().toLowerCase();

                    if (ext === 'js') {
                        jsFiles.push({ name: relativePath, size });
                    } else if (ext === 'css') {
                        cssFiles.push({ name: relativePath, size });
                    } else {
                        otherFiles.push({ name: relativePath, size });
                    }
                    }
                }

                return { jsFiles, cssFiles, otherFiles };
            }

            const scanned = scanDirectory(DIST_DIR);
            const jsFiles = scanned.jsFiles;
            const cssFiles = scanned.cssFiles;
            const otherFiles = scanned.otherFiles;

            results.breakdown.js = {
                files: jsFiles.sort((a, b) => b.size - a.size),
                total: jsFiles.reduce((sum, f) => sum + f.size, 0)
            };

            results.breakdown.css = {
                files: cssFiles.sort((a, b) => b.size - a.size),
                total: cssFiles.reduce((sum, f) => sum + f.size, 0)
            };

            results.breakdown.other = {
                files: otherFiles.sort((a, b) => b.size - a.size),
                total: otherFiles.reduce((sum, f) => sum + f.size, 0)
            };
        } catch (e) {
            console.warn('Could not analyze dist/ files:', e.message);
        }
    } else {
        console.warn('⚠️  dist/ directory not found. Run "npm run build" first.');
        results.actual.dist = 0;
    }

    // Analyze content.db (check both locations)
    const contentDbPaths = [
        join(PUBLIC_ASSETS, 'content.db'),
        join(PROJECT_ROOT, 'content.db')
    ];
    let contentDbSize = 0;
    let contentDbPath = null;
    for (const path of contentDbPaths) {
        const size = getFileSize(path);
        if (size > 0) {
            contentDbSize = size;
            contentDbPath = path;
            break;
        }
    }
    results.actual.contentDb = contentDbSize;
    results.breakdown.contentDb = {
        size: contentDbSize,
        formatted: formatBytes(contentDbSize),
        path: contentDbPath || 'Not found'
    };

    // Analyze Ink scripts
    const inkDir = join(PUBLIC_ASSETS, 'ink');
    const inkSize = getDirectorySize(inkDir);
    results.actual.ink = inkSize;
    results.breakdown.ink = {
        size: inkSize,
        formatted: formatBytes(inkSize)
    };

    // Calculate totals
    const codeSize = results.actual.dist || 0;
    const contentSize = (results.actual.contentDb || 0) + (results.actual.ink || 0);
    const totalSize = codeSize + contentSize; // Maps not included yet

    results.actual.code = codeSize;
    results.actual.content = contentSize;
    results.actual.total = totalSize;

    // Calculate percentages vs targets
    results.percentages = {
        code: ((codeSize / results.targets.code) * 100).toFixed(1),
        content: ((contentSize / results.targets.content) * 100).toFixed(1),
        total: ((totalSize / results.targets.total) * 100).toFixed(1)
    };

    // Status indicators
    results.status = {
        code: codeSize <= results.targets.code ? '✅' : '⚠️',
        content: contentSize <= results.targets.content ? '✅' : '⚠️',
        total: totalSize <= results.targets.total ? '✅' : '❌'
    };

    return results;
}

function printReport(results) {
    console.log('📊 SIZE BUDGET REPORT\n');
    console.log('Targets:');
    console.log(`  Total:     ${formatBytes(results.targets.total)}`);
    console.log(`  Code:      ${formatBytes(results.targets.code)}`);
    console.log(`  Content:   ${formatBytes(results.targets.content)}`);
    console.log(`  Maps:      ${formatBytes(results.targets.maps)}`);
    console.log(`  Buffer:    ${formatBytes(results.targets.buffer)}\n`);

    console.log('Actual:');
    console.log(`  ${results.status.total} Total:     ${formatBytes(results.actual.total)} (${results.percentages.total}% of target)`);
    console.log(`  ${results.status.code} Code:      ${formatBytes(results.actual.code)} (${results.percentages.code}% of target)`);
    console.log(`  ${results.status.content} Content:   ${formatBytes(results.actual.content)} (${results.percentages.content}% of target)`);
    console.log(`  ⏳ Maps:      Not yet measured\n`);

    if (results.breakdown.dist) {
        console.log('📦 Bundle Breakdown:');
        console.log(`  dist/ total: ${results.breakdown.dist.formatted}\n`);

        if (results.breakdown.js && results.breakdown.js.files.length > 0) {
            console.log('  JavaScript files:');
            results.breakdown.js.files.slice(0, 5).forEach(file => {
                console.log(`    - ${file.name}: ${formatBytes(file.size)}`);
            });
            if (results.breakdown.js.files.length > 5) {
                console.log(`    ... and ${results.breakdown.js.files.length - 5} more`);
            }
            console.log(`    Total JS: ${formatBytes(results.breakdown.js.total)}\n`);
        }

        if (results.breakdown.css && results.breakdown.css.files.length > 0) {
            console.log('  CSS files:');
            results.breakdown.css.files.forEach(file => {
                console.log(`    - ${file.name}: ${formatBytes(file.size)}`);
            });
            console.log(`    Total CSS: ${formatBytes(results.breakdown.css.total)}\n`);
        }
    }

    if (results.breakdown.contentDb) {
        console.log('📚 Content:');
        console.log(`  content.db: ${results.breakdown.contentDb.formatted}`);
        console.log(`  Ink scripts: ${results.breakdown.ink.formatted}\n`);
    }

    console.log('📈 Status:');
    if (results.status.total === '✅') {
        console.log('  ✅ Within total budget!');
    } else {
        console.log('  ❌ Exceeds total budget - optimization needed');
    }
    if (results.status.code === '⚠️') {
        console.log('  ⚠️  Code size exceeds target - consider code splitting');
    }
    if (results.status.content === '⚠️') {
        console.log('  ⚠️  Content size exceeds target - compression needed');
    }
}

async function saveBudgetFile(results) {
    const budgetPath = join(PROJECT_ROOT, 'size-budget.json');
    const budgetData = {
        ...results,
        // Remove file lists from saved data (too verbose)
        breakdown: {
            dist: results.breakdown.dist,
            contentDb: results.breakdown.contentDb,
            ink: results.breakdown.ink,
            jsTotal: results.breakdown.js?.total || 0,
            cssTotal: results.breakdown.css?.total || 0
        }
    };

    try {
        readFileSync(budgetPath); // Check if exists
        // Append to history if file exists
        const existing = JSON.parse(readFileSync(budgetPath, 'utf8'));
        if (!existing.history) existing.history = [];
        existing.history.push({
            timestamp: results.timestamp,
            actual: results.actual,
            percentages: results.percentages,
            status: results.status
        });
        // Keep last 10 entries
        if (existing.history.length > 10) {
            existing.history = existing.history.slice(-10);
        }
        budgetData.history = existing.history;
    } catch (_e) {
        // File doesn't exist, create new
    }

    const fs = await import('fs');
    fs.writeFileSync(budgetPath, JSON.stringify(budgetData, null, 2));
    console.log(`\n💾 Budget data saved to: size-budget.json`);
}

// Main execution
async function main() {
    const results = analyzeBundle();
    printReport(results);
    await saveBudgetFile(results);

    // Exit with error code if over budget
    if (results.status.total === '❌') {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

