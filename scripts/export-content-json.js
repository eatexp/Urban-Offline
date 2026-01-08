#!/usr/bin/env node
// scripts/export-content-json.js
// Exports content.db (SQLite) to JSON format for web consumption
// This bridges the build-time SQLite database with runtime IndexedDB

import Database from 'better-sqlite3';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const CONTENT_DB = process.argv[2] || join(PROJECT_ROOT, 'content.db');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'assets');
const OUTPUT_FILE = join(OUTPUT_DIR, 'content-manifest.json');

function log(message) {
    console.log(`[export-content] ${message}`);
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function main() {
    log('Exporting content.db to JSON manifest...');

    // Check if content.db exists
    if (!existsSync(CONTENT_DB)) {
        log(`ERROR: content.db not found at ${CONTENT_DB}`);
        log('Run "npm run fetch-content" first to generate the database.');
        process.exit(1);
    }

    // Open database
    const db = new Database(CONTENT_DB, { readonly: true });
    db.pragma('journal_mode = WAL');

    // Get all articles with their categories
    const articles = db.prepare(`
        SELECT
            a.id,
            a.slug,
            a.title,
            a.body_html,
            a.body_plain,
            a.source,
            a.source_url,
            a.last_updated,
            a.content_hash,
            GROUP_CONCAT(c.name, '|') as categories
        FROM articles a
        LEFT JOIN article_categories ac ON a.id = ac.article_id
        LEFT JOIN categories c ON ac.category_id = c.id
        GROUP BY a.id
        ORDER BY a.title
    `).all();

    log(`Found ${articles.length} articles`);

    // Get categories
    const categories = db.prepare(`
        SELECT id, name, parent_id
        FROM categories
        ORDER BY name
    `).all();

    log(`Found ${categories.length} categories`);

    // Get attributions
    const attributions = db.prepare(`
        SELECT source_name, license_type, license_url, attribution_text
        FROM attributions
    `).all();

    // Process articles - split categories into array
    const processedArticles = articles.map(article => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        body_html: article.body_html,
        body_plain: article.body_plain,
        source: article.source,
        source_url: article.source_url,
        last_updated: article.last_updated,
        content_hash: article.content_hash,
        categories: article.categories ? article.categories.split('|') : []
    }));

    // Create manifest
    const manifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        stats: {
            articleCount: articles.length,
            categoryCount: categories.length
        },
        categories: categories,
        attributions: attributions,
        articles: processedArticles
    };

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write manifest
    const jsonString = JSON.stringify(manifest, null, 2);
    writeFileSync(OUTPUT_FILE, jsonString);

    const stats = {
        articles: articles.length,
        categories: categories.length,
        fileSize: formatSize(Buffer.byteLength(jsonString, 'utf8'))
    };

    log(`Manifest written to: ${OUTPUT_FILE}`);
    log(`Articles: ${stats.articles}`);
    log(`Categories: ${stats.categories}`);
    log(`File size: ${stats.fileSize}`);

    // Also create a compressed version for production
    // (minified JSON without pretty printing)
    const minifiedJson = JSON.stringify(manifest);
    const minifiedFile = join(OUTPUT_DIR, 'content-manifest.min.json');
    writeFileSync(minifiedFile, minifiedJson);
    log(`Minified version: ${formatSize(Buffer.byteLength(minifiedJson, 'utf8'))}`);

    db.close();
    log('Export complete!');
}

try {
    main();
} catch (error) {
    console.error('[export-content] Fatal error:', error.message);
    process.exit(1);
}
