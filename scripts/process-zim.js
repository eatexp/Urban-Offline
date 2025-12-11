#!/usr/bin/env node
/* global process */
// scripts/process-zim.js
// import { Archive } from '@openzim/libzim';
import Database from 'better-sqlite3';
import { JSDOM } from 'jsdom';

const INPUT_ZIM = process.argv[2];
const OUTPUT_DB = process.argv[3] || 'content.db';

if (!INPUT_ZIM) {
    console.error('Usage: node process-zim.js <input.zim> [output.db]');
    process.exit(1);
}

import { SCHEMA_SQL } from '../src/services/storage/schema.js';

// Phase 2: import { Archive } from '@openzim/libzim'; // Requires native compilation/WSL
// const INPUT_ZIM = process.argv[2];


function _slugify(path) {
    return path
        .replace(/^A\//, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase();
}

function _extractPlainText(html) {
    const dom = new JSDOM(html);
    // Remove script/style tags
    dom.window.document.querySelectorAll('script, style').forEach(el => el.remove());
    return dom.window.document.body?.textContent?.trim() || '';
}

async function main() {
    /* Phase 2: ZIM Processing
    console.log(`Opening ZIM: ${INPUT_ZIM}`);
    const archive = new Archive(INPUT_ZIM);

    console.log(`Archive has ${archive.entryCount} entries`);
    console.log(`Main entry: ${archive.mainEntry?.path || 'none'}`);
    */

    const db = new Database(OUTPUT_DB);
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

    let _processed = 0;
    let skipped = 0;
    const batch = [];
    const BATCH_SIZE = 100;

    /*
    for (const entry of archive.iterByPath()) {
        // Only process article namespace (A/) with HTML content
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
            const plainText = extractPlainText(content);

            // Skip very short articles (likely stubs)
            if (plainText.length < 100) {
                skipped++;
                continue;
            }

            const title = entry.title || path.replace('A/', '');
            const hash = createHash('md5').update(content).digest('hex');

            batch.push({
                slug: slugify(path),
                title: title,
                html: content,
                plain: plainText,
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
    */

    // Final batch
    if (batch.length > 0) {
        insertMany(batch);
        _processed += batch.length;
    }

    console.log(`\n\nRebuilding FTS index...`);
    db.exec(`INSERT INTO articles_fts(articles_fts) VALUES('rebuild')`);

    // Add attribution
    db.prepare(`
    INSERT INTO attributions (source_name, license_type, license_url, attribution_text)
    VALUES (?, ?, ?, ?)
  `).run(
        'WikiMed',
        'CC-BY-SA-3.0',
        'https://creativecommons.org/licenses/by-sa/3.0/',
        'Content derived from Wikipedia medical articles, available under CC-BY-SA 3.0'
    );

    const stats = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    console.log(`\nDone. ${stats.count} articles indexed, ${skipped} entries skipped.`);

    // Output size
    const { size } = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
    console.log(`Database size: ${(size / 1024 / 1024).toFixed(2)} MB`);

    db.close();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
