#!/usr/bin/env node
/* global process */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../content.db');

if (!fs.existsSync(dbPath)) {
    console.error('❌ content.db not found!');
    process.exit(1);
}

const db = new Database(dbPath);

try {
    const articleCount = db.prepare('SELECT count(*) as count FROM articles').get().count;
    console.log(`✅ Articles: ${articleCount}`);

    const ftsCount = db.prepare('SELECT count(*) as count FROM articles_fts').get().count;
    console.log(`✅ FTS Index Size: ${ftsCount}`);

    const testSearch = db.prepare('SELECT title FROM articles_fts WHERE articles_fts MATCH ? LIMIT 1').get('hypothermia');
    console.log(`✅ Search Test: ${testSearch ? 'Success (' + testSearch.title + ')' : 'Failed'}`);

    console.log('✅ Database is healthy.');
} catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
}
