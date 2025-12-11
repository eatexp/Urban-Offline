#!/usr/bin/env node
/* global process */
/**
 * Cross-platform prebuild script
 * Works on Windows, Mac, Linux, and ARM boards (Raspberry Pi, etc.)
 *
 * This script:
 * 1. Runs fetch-content to generate content.db (if needed)
 * 2. Ensures public/assets directory exists
 * 3. Copies content.db to public/assets/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CONTENT_DB = path.join(ROOT_DIR, 'content.db');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');
const DEST_DB = path.join(ASSETS_DIR, 'content.db');

/**
 * Run a command and return a promise
 */
function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')}`);

        const child = spawn(command, args, {
            cwd: ROOT_DIR,
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

/**
 * Ensure directory exists (recursive mkdir)
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Copy file if source exists
 */
function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        console.log(`Copying: ${path.basename(src)} -> ${dest}`);
        fs.copyFileSync(src, dest);
        return true;
    }
    return false;
}

async function main() {
    console.log('=== Urban-Offline Prebuild ===\n');
    console.log(`Platform: ${process.platform} (${process.arch})`);
    console.log(`Node: ${process.version}\n`);

    // Step 1: Check if content.db exists, if not run fetch-content
    if (!fs.existsSync(CONTENT_DB)) {
        console.log('content.db not found, running fetch-content...\n');
        try {
            await runCommand('node', ['scripts/fetch-content.js', 'content.db']);
        } catch {
            console.warn('\nWarning: fetch-content failed. You may need to run it manually.');
            console.warn('The app will still work but without Wikipedia content.\n');
        }
    } else {
        console.log('content.db exists, skipping fetch-content\n');
    }

    // Step 2: Ensure public/assets directory exists
    ensureDir(ASSETS_DIR);

    // Step 3: Copy content.db to public/assets/
    if (fs.existsSync(CONTENT_DB)) {
        copyFile(CONTENT_DB, DEST_DB);

        const stats = fs.statSync(DEST_DB);
        console.log(`\nDatabase size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
        console.log('\nNo content.db to copy. App will work without offline content.');
    }

    console.log('\n=== Prebuild Complete ===');
}

main().catch(err => {
    console.error('\nPrebuild failed:', err.message);
    // Don't exit with error - allow build to continue without content
    console.log('Continuing build without content database...');
});
