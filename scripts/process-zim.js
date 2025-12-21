// scripts/process-zim.js
// ZIM file processing for WikiProject Medicine content
// 
// This script can operate in two modes:
// 1. ZIM Mode: Process a ZIM file directly (requires @openzim/libzim - Linux/WSL only)
// 2. Manifest Mode: Process a JSON manifest of Wikipedia articles
//
// Usage:
//   node process-zim.js <input.zim> [output.db]     - ZIM file mode
//   node process-zim.js --manifest articles.json    - Manifest mode

import Database from 'better-sqlite3';
import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const isManifestMode = args.includes('--manifest');
const inputFile = isManifestMode ? args[args.indexOf('--manifest') + 1] : args[0];
const outputDb = args.find(a => a.endsWith('.db')) || 'content.db';

if (!inputFile) {
    console.log('ZIM/Article Processing Script for Urban-Offline\n');
    console.log('Usage:');
    console.log('  node process-zim.js <input.zim> [output.db]   - Process ZIM file (Linux/WSL only)');
    console.log('  node process-zim.js --manifest <file.json>    - Process article manifest');
    console.log('\nManifest JSON format:');
    console.log('  { "articles": [{ "title": "...", "slug": "...", "url": "..." }, ...] }');
    process.exit(1);
}

// Dynamic import for SCHEMA_SQL
let SCHEMA_SQL;
try {
    const schemaModule = await import('../src/services/storage/schema.js');
    SCHEMA_SQL = schemaModule.SCHEMA_SQL;
} catch (_e) {
    console.error('Could not import schema. Using inline schema.');
    SCHEMA_SQL = `
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            body_html TEXT,
            body_plain TEXT,
            source TEXT DEFAULT 'wikipedia',
            source_url TEXT,
            last_updated TEXT DEFAULT (datetime('now')),
            content_hash TEXT
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
            title, body_plain, content='articles', content_rowid='id'
        );
        CREATE TABLE IF NOT EXISTS attributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_name TEXT NOT NULL,
            license_type TEXT NOT NULL,
            license_url TEXT,
            attribution_text TEXT
        );
    `;
}

// Helper functions
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function extractPlainText(html) {
    const dom = new JSDOM(html);
    dom.window.document.querySelectorAll('script, style, [data-mw]').forEach(el => el.remove());
    return dom.window.document.body?.textContent?.trim() || '';
}

function cleanHtml(html) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Remove unwanted elements
    const removeSelectors = [
        'script', 'style', '[data-mw]', '.mw-editsection',
        '.reference', '.references', '.navbox', '.sidebar',
        '.infobox', '.hatnote', '.metadata', '.ambox'
    ];
    
    removeSelectors.forEach(selector => {
        try {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        } catch (_e) {
            // Invalid selector, skip
        }
    });
    
    return doc.body?.innerHTML || html;
}

async function processManifest(manifestPath, db, insertMany) {
    console.log(`\nProcessing manifest: ${manifestPath}`);
    
    if (!existsSync(manifestPath)) {
        throw new Error(`Manifest file not found: ${manifestPath}`);
    }
    
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const articles = manifest.articles || [];
    
    console.log(`Found ${articles.length} articles in manifest`);
    
    let processed = 0;
    let failed = 0;
    const batch = [];
    const BATCH_SIZE = 50;
    
    for (const article of articles) {
        try {
            // Fetch article content from Wikipedia if not already included
            let html = article.body_html || article.html;
            let plain = article.body_plain || article.plain;
            
            if (!html && article.url) {
                // Fetch from Wikipedia REST API
                const wikiTitle = article.url.split('/wiki/').pop();
                const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(wikiTitle)}`;
                
                console.log(`  Fetching: ${article.title || wikiTitle}`);
                
                const response = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Urban-Offline/1.0 (Emergency Preparedness App)' }
                });
                
                if (response.ok) {
                    html = await response.text();
                    html = cleanHtml(html);
                    plain = extractPlainText(html);
                } else {
                    console.warn(`  Failed to fetch ${article.title}: ${response.status}`);
                    failed++;
                    continue;
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (!plain && html) {
                plain = extractPlainText(html);
            }
            
            const hash = createHash('md5').update(html || '').digest('hex');
            
            batch.push({
                slug: article.slug || slugify(article.title),
                title: article.title,
                html: html || '',
                plain: plain || '',
                source: article.source || 'wikipedia',
                url: article.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                hash: hash
            });
            
            if (batch.length >= BATCH_SIZE) {
                insertMany(batch);
                processed += batch.length;
                console.log(`  Processed: ${processed}/${articles.length}`);
                batch.length = 0;
            }
            
        } catch (error) {
            console.error(`  Error processing ${article.title}: ${error.message}`);
            failed++;
        }
    }
    
    // Final batch
    if (batch.length > 0) {
        insertMany(batch);
        processed += batch.length;
    }
    
    return { processed, failed };
}

async function processZim(zimPath, db, insertMany) {
    console.log(`\nProcessing ZIM file: ${zimPath}`);
    console.log('NOTE: ZIM processing requires @openzim/libzim which needs Linux/WSL');
    
    // Check if libzim is available
    let Archive;
    try {
        const libzim = await import('@openzim/libzim');
        Archive = libzim.Archive;
    } catch (_e) {
        console.error('\n❌ @openzim/libzim not available');
        console.error('   Install with: npm install @openzim/libzim');
        console.error('   Note: Requires Linux or WSL on Windows');
        console.error('\n   Alternative: Use --manifest mode with a JSON article list');
        process.exit(1);
    }
    
    const archive = new Archive(zimPath);
    console.log(`Archive has ${archive.entryCount} entries`);
    
    let processed = 0;
    let skipped = 0;
    const batch = [];
    const BATCH_SIZE = 100;
    
    for (const entry of archive.iterByPath()) {
        if (entry.isRedirect) {
            skipped++;
            continue;
        }
        
        const path = entry.path;
        if (!path.startsWith('A/')) {
            skipped++;
            continue;
        }
        
        const item = entry.item;
        const mimeType = item.mimetype;
        
        if (!mimeType.includes('html')) {
            skipped++;
            continue;
        }
        
        try {
            const content = item.data.toString();
            const html = cleanHtml(content);
            const plain = extractPlainText(html);
            
            if (plain.length < 100) {
                skipped++;
                continue;
            }
            
            const title = entry.title || path.replace('A/', '');
            const hash = createHash('md5').update(content).digest('hex');
            
            batch.push({
                slug: slugify(path.replace('A/', '')),
                title: title,
                html: html,
                plain: plain,
                source: 'wikimed',
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
                hash: hash
            });
            
            if (batch.length >= BATCH_SIZE) {
                insertMany(batch);
                processed += batch.length;
                process.stdout.write(`\rProcessed: ${processed}`);
                batch.length = 0;
            }
        } catch (err) {
            console.error(`\nError processing ${path}: ${err.message}`);
            skipped++;
        }
    }
    
    if (batch.length > 0) {
        insertMany(batch);
        processed += batch.length;
    }
    
    return { processed, skipped };
}

async function main() {
    console.log('=== Urban-Offline Content Processor ===\n');
    
    // Initialize database
    const db = new Database(outputDb);
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA_SQL);
    
    const insertArticle = db.prepare(`
        INSERT OR REPLACE INTO articles 
        (slug, title, body_html, body_plain, source, source_url, last_updated, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `);
    
    const insertMany = db.transaction((articles) => {
        for (const a of articles) {
            insertArticle.run(a.slug, a.title, a.html, a.plain, a.source, a.url, a.hash);
        }
    });
    
    let result;
    
    if (isManifestMode) {
        result = await processManifest(inputFile, db, insertMany);
    } else if (inputFile.endsWith('.zim')) {
        result = await processZim(inputFile, db, insertMany);
    } else {
        console.error('Unknown input format. Use .zim file or --manifest flag');
        process.exit(1);
    }
    
    // Rebuild FTS index
    console.log('\nRebuilding FTS index...');
    try {
        db.exec(`INSERT INTO articles_fts(articles_fts) VALUES('rebuild')`);
    } catch (ftsError) {
        console.warn('FTS rebuild skipped:', ftsError.message);
    }
    
    // Add attribution
    try {
        db.prepare(`
            INSERT OR REPLACE INTO attributions (source_name, license_type, license_url, attribution_text)
            VALUES (?, ?, ?, ?)
        `).run(
            'WikiMed / Wikipedia',
            'CC-BY-SA-4.0',
            'https://creativecommons.org/licenses/by-sa/4.0/',
            'Content derived from Wikipedia medical articles, available under CC-BY-SA 4.0'
        );
    } catch (_e) {
        // Attribution may already exist
    }
    
    // Statistics
    const stats = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    console.log(`\n✅ Done!`);
    console.log(`   Articles: ${stats.count}`);
    console.log(`   Processed: ${result.processed}`);
    console.log(`   ${result.failed ? `Failed: ${result.failed}` : result.skipped ? `Skipped: ${result.skipped}` : ''}`);
    
    // Database size
    try {
        const { size } = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
        console.log(`   Database: ${(size / 1024 / 1024).toFixed(2)} MB`);
    } catch (_e) {
        // Size query may fail
    }
    
    db.close();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
