#!/usr/bin/env node
// scripts/prepare-build.js
// Cross-platform build preparation script
// Handles content.db generation and copying to public/assets

import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const CONTENT_DB = join(PROJECT_ROOT, 'content.db');
const ASSETS_DIR = join(PROJECT_ROOT, 'public', 'assets');
const TARGET_DB = join(ASSETS_DIR, 'content.db');

function log(message) {
    console.log(`[prepare-build] ${message}`);
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
    log('Starting build preparation...');

    // Step 1: Check if content.db exists, if not run fetch-content
    if (!existsSync(CONTENT_DB)) {
        log('content.db not found, running fetch-content script...');
        log('This may take a few minutes (fetching ~90 Wikipedia articles)...');

        try {
            execSync('node scripts/fetch-content.js content.db', {
                cwd: PROJECT_ROOT,
                stdio: 'inherit'
            });
        } catch (error) {
            console.error('[prepare-build] ERROR: fetch-content failed');
            console.error('You can skip this step by creating an empty content.db or running in offline mode');
            // Don't fail the build - allow development without content
            log('Continuing without content.db...');
            return;
        }
    } else {
        const stats = statSync(CONTENT_DB);
        log(`content.db exists (${formatSize(stats.size)})`);
    }

    // Step 2: Ensure public/assets directory exists
    if (!existsSync(ASSETS_DIR)) {
        log(`Creating directory: public/assets`);
        mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // Step 3: Copy content.db to public/assets if source exists
    if (existsSync(CONTENT_DB)) {
        log(`Copying content.db to public/assets/`);
        copyFileSync(CONTENT_DB, TARGET_DB);

        const stats = statSync(TARGET_DB);
        log(`Content database ready (${formatSize(stats.size)})`);

        // Step 4: Export content.db to JSON manifest for web consumption
        log('Exporting content to JSON manifest for web...');
        try {
            execSync('node scripts/export-content-json.js', {
                cwd: PROJECT_ROOT,
                stdio: 'inherit'
            });
        } catch (error) {
            log('WARNING: Failed to export JSON manifest');
            log('Web platform may not have content available');
        }
    }

    log('Build preparation complete!');
}

main().catch(err => {
    console.error('[prepare-build] Fatal error:', err.message);
    process.exit(1);
});
