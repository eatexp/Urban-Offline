// scripts/compile-ink.js
// Compiles all .ink source files to .ink.json

import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const SOURCE_DIR = join(PROJECT_ROOT, 'public', 'assets', 'ink', 'source');
const OUTPUT_BASE = join(PROJECT_ROOT, 'public', 'assets', 'ink');

function findInkFiles(dir) {
    const files = [];
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...findInkFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.ink')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function compileInkFile(sourceFile) {
    // Determine output path
    const relativePath = relative(SOURCE_DIR, sourceFile);
    const outputFile = join(OUTPUT_BASE, relativePath.replace('.ink', '.ink.json'));
    const outputDir = dirname(outputFile);
    
    // Create output directory if needed
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    
    try {
        console.log(`Compiling: ${basename(sourceFile)}`);
        execSync(`inklecate -o "${outputFile}" "${sourceFile}"`, {
            stdio: 'pipe',
            encoding: 'utf8'
        });
        console.log(`  ✅ Output: ${relative(PROJECT_ROOT, outputFile)}`);
        return { success: true, file: sourceFile };
    } catch (e) {
        console.error(`  ❌ Error: ${e.message}`);
        return { success: false, file: sourceFile, error: e.message };
    }
}

async function main() {
    console.log('=== Ink Script Compiler ===\n');
    
    if (!existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }
    
    // Check for inklecate
    try {
        execSync('inklecate --version', { stdio: 'pipe' });
    } catch (_e) {
        console.error('❌ inklecate not found. Install with: npm install -g inklecate');
        process.exit(1);
    }
    
    const inkFiles = findInkFiles(SOURCE_DIR);
    console.log(`Found ${inkFiles.length} .ink files\n`);
    
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    for (const file of inkFiles) {
        const result = compileInkFile(file);
        if (result.success) {
            results.success++;
        } else {
            results.failed++;
            results.errors.push(result);
        }
    }
    
    console.log('\n=== Compilation Complete ===');
    console.log(`✅ Success: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(err => {
            console.log(`  - ${basename(err.file)}: ${err.error}`);
        });
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});



