// scripts/validate-content.js
// Validates content quality, completeness, and licensing compliance

import Database from 'better-sqlite3';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CONTENT_DB = join(PROJECT_ROOT, 'content.db');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets');

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeContent() {
    console.log('=== Urban-Offline Content Validation Report ===\n');

    if (!existsSync(CONTENT_DB)) {
        console.error('❌ content.db not found. Run "npm run fetch-content" first.');
        process.exit(1);
    }

    const db = new Database(CONTENT_DB);
    const report = {
        timestamp: new Date().toISOString(),
        database: {
            path: CONTENT_DB,
            size: 0,
            exists: true
        },
        articles: {
            total: 0,
            byCategory: {},
            quality: {
                excellent: 0, // >10k chars
                good: 0,       // 5k-10k chars
                fair: 0,       // 2k-5k chars
                poor: 0        // <2k chars
            },
            issues: []
        },
        search: {
            ftsEnabled: false,
            testQueries: []
        },
        licensing: {
            attributions: [],
            compliance: true
        },
        coverage: {
            critical: [],
            missing: []
        }
    };

    // Database size
    try {
        const stats = statSync(CONTENT_DB);
        report.database.size = stats.size;
    } catch (_e) {
        // Database file not found
    }

    // Article statistics
    const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    report.articles.total = articleCount.count;

    // Articles by category
    const byCategory = db.prepare(`
        SELECT c.name, COUNT(ac.article_id) as count
        FROM categories c
        LEFT JOIN article_categories ac ON c.id = ac.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC
    `).all();

    byCategory.forEach(row => {
        report.articles.byCategory[row.name] = row.count;
    });

    // Quality analysis
    const qualityAnalysis = db.prepare(`
        SELECT 
            id,
            title,
            slug,
            LENGTH(body_plain) as char_count,
            LENGTH(body_html) as html_size,
            source,
            source_url
        FROM articles
        ORDER BY char_count DESC
    `).all();

    qualityAnalysis.forEach(article => {
        const chars = article.char_count;
        if (chars > 10000) {
            report.articles.quality.excellent++;
        } else if (chars > 5000) {
            report.articles.quality.good++;
        } else if (chars > 2000) {
            report.articles.quality.fair++;
        } else {
            report.articles.quality.poor++;
            report.articles.issues.push({
                type: 'short_content',
                article: article.title,
                chars: chars,
                slug: article.slug
            });
        }

        // Check for very short articles that might be stubs
        if (chars < 1000) {
            report.articles.issues.push({
                type: 'stub_article',
                article: article.title,
                chars: chars
            });
        }
    });

    // FTS Search validation
    try {
        const testQuery = db.prepare(`
            SELECT COUNT(*) as count
            FROM articles_fts
            WHERE articles_fts MATCH 'hypothermia'
        `).get();
        
        report.search.ftsEnabled = testQuery.count > 0;
        
        // Test various emergency queries
        const testQueries = [
            'cardiac arrest',
            'bleeding',
            'fracture',
            'stroke',
            'choking',
            'burns',
            'hypothermia',
            'anaphylaxis'
        ];

        testQueries.forEach(query => {
            const results = db.prepare(`
                SELECT COUNT(*) as count
                FROM articles_fts
                WHERE articles_fts MATCH ?
            `).get(query);
            
            report.search.testQueries.push({
                query,
                results: results.count
            });
        });
    } catch (e) {
        report.search.ftsEnabled = false;
        report.articles.issues.push({
            type: 'fts_error',
            error: e.message
        });
    }

    // Licensing compliance
    const attributions = db.prepare(`
        SELECT source_name, license_type, license_url, attribution_text
        FROM attributions
    `).all();

    report.licensing.attributions = attributions;

    if (attributions.length === 0) {
        report.licensing.compliance = false;
        report.articles.issues.push({
            type: 'missing_attribution',
            message: 'No attribution records found'
        });
    }

    // Coverage analysis - check for critical emergency topics
    const criticalTopics = [
        { name: 'CPR', keywords: ['cardiopulmonary resuscitation', 'cpr', 'cardiac arrest'] },
        { name: 'Bleeding Control', keywords: ['bleeding', 'hemorrhage', 'tourniquet'] },
        { name: 'Choking', keywords: ['choking', 'heimlich', 'airway obstruction'] },
        { name: 'Stroke', keywords: ['stroke', 'cerebrovascular'] },
        { name: 'Anaphylaxis', keywords: ['anaphylaxis', 'allergic reaction'] },
        { name: 'Burns', keywords: ['burns', 'burn injury'] },
        { name: 'Fractures', keywords: ['fracture', 'broken bone'] },
        { name: 'Hypothermia', keywords: ['hypothermia', 'cold exposure'] }
    ];

    criticalTopics.forEach(topic => {
        const found = db.prepare(`
            SELECT COUNT(*) as count
            FROM articles_fts
            WHERE articles_fts MATCH ?
        `).get(topic.keywords.join(' OR '));

        if (found.count > 0) {
            report.coverage.critical.push({
                topic: topic.name,
                covered: true,
                articles: found.count
            });
        } else {
            report.coverage.critical.push({
                topic: topic.name,
                covered: false,
                articles: 0
            });
            report.coverage.missing.push(topic.name);
        }
    });

    db.close();
    return report;
}

function printReport(report) {
    console.log('📊 CONTENT VALIDATION REPORT\n');

    console.log('Database:');
    console.log(`  Path: ${report.database.path}`);
    console.log(`  Size: ${formatBytes(report.database.size)}`);
    console.log(`  Articles: ${report.articles.total}\n`);

    console.log('Articles by Category:');
    Object.entries(report.articles.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            console.log(`  ${category}: ${count} articles`);
        });
    console.log();

    console.log('Content Quality:');
    console.log(`  ✅ Excellent (>10k chars): ${report.articles.quality.excellent}`);
    console.log(`  ✅ Good (5k-10k chars): ${report.articles.quality.good}`);
    console.log(`  ⚠️  Fair (2k-5k chars): ${report.articles.quality.fair}`);
    console.log(`  ❌ Poor (<2k chars): ${report.articles.quality.poor}\n`);

    console.log('Search Functionality:');
    console.log(`  FTS5 Enabled: ${report.search.ftsEnabled ? '✅' : '❌'}`);
    if (report.search.testQueries.length > 0) {
        console.log('  Test Query Results:');
        report.search.testQueries.forEach(test => {
            const status = test.results > 0 ? '✅' : '❌';
            console.log(`    ${status} "${test.query}": ${test.results} results`);
        });
    }
    console.log();

    console.log('Critical Topic Coverage:');
    report.coverage.critical.forEach(topic => {
        const status = topic.covered ? '✅' : '❌';
        console.log(`  ${status} ${topic.topic}: ${topic.articles} article(s)`);
    });
    console.log();

    if (report.coverage.missing.length > 0) {
        console.log('⚠️  Missing Critical Topics:');
        report.coverage.missing.forEach(topic => {
            console.log(`    - ${topic}`);
        });
        console.log();
    }

    console.log('Licensing Compliance:');
    console.log(`  Status: ${report.licensing.compliance ? '✅ Compliant' : '❌ Non-compliant'}`);
    if (report.licensing.attributions.length > 0) {
        console.log('  Attributions:');
        report.licensing.attributions.forEach(attr => {
            console.log(`    - ${attr.source_name}: ${attr.license_type}`);
        });
    }
    console.log();

    if (report.articles.issues.length > 0) {
        console.log('⚠️  Issues Found:');
        const issuesByType = {};
        report.articles.issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
        });

        Object.entries(issuesByType).forEach(([type, issues]) => {
            console.log(`  ${type}: ${issues.length} occurrence(s)`);
            if (type === 'short_content' || type === 'stub_article') {
                issues.slice(0, 5).forEach(issue => {
                    console.log(`    - ${issue.article} (${issue.chars} chars)`);
                });
                if (issues.length > 5) {
                    console.log(`    ... and ${issues.length - 5} more`);
                }
            }
        });
        console.log();
    }

    // Overall assessment
    const qualityScore = (
        (report.articles.quality.excellent * 4 +
         report.articles.quality.good * 3 +
         report.articles.quality.fair * 2 +
         report.articles.quality.poor * 1) /
        report.articles.total
    ).toFixed(2);

    const coverageScore = (
        (report.coverage.critical.filter(t => t.covered).length /
         report.coverage.critical.length) * 100
    ).toFixed(1);

    console.log('📈 Overall Assessment:');
    console.log(`  Quality Score: ${qualityScore}/4.0`);
    console.log(`  Coverage Score: ${coverageScore}%`);
    console.log(`  Search Functional: ${report.search.ftsEnabled ? '✅' : '❌'}`);
    console.log(`  Licensing Compliant: ${report.licensing.compliance ? '✅' : '❌'}`);

    const overallStatus = 
        parseFloat(qualityScore) >= 2.5 &&
        parseFloat(coverageScore) >= 80 &&
        report.search.ftsEnabled &&
        report.licensing.compliance;

    console.log(`\n  Overall Status: ${overallStatus ? '✅ PASS' : '⚠️  NEEDS IMPROVEMENT'}\n`);
}

async function saveReport(report) {
    const reportPath = join(PROJECT_ROOT, 'content-validation-report.json');
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Full report saved to: content-validation-report.json`);
}

// Main execution
async function main() {
    const report = analyzeContent();
    printReport(report);
    await saveReport(report);

    // Exit with error if critical issues
    const hasCriticalIssues = 
        report.coverage.missing.length > 0 ||
        !report.search.ftsEnabled ||
        !report.licensing.compliance;

    if (hasCriticalIssues) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

