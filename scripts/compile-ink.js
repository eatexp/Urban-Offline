// scripts/compile-ink.js
// Compiles all .ink source files to .ink.json

import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync, chmodSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const SOURCE_DIR = join(PROJECT_ROOT, 'ink-source');
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

function compileInkFile(sourceFile, compilerPath) {
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
        // Use node to run the inkjs-compiler
        execSync(`node "${compilerPath}" -o "${outputFile}" "${sourceFile}"`, {
            stdio: 'pipe',
            encoding: 'utf8'
        });

        // P0 FIX: Remove BOM if present (inkjs-compiler adds it by default)
        const content = readFileSync(outputFile);
        if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
            writeFileSync(outputFile, content.subarray(3));
            console.log(`  ✅ Output (BOM removed): ${relative(PROJECT_ROOT, outputFile)}`);
        } else {
            console.log(`  ✅ Output: ${relative(PROJECT_ROOT, outputFile)}`);
        }

        return { success: true, file: sourceFile };
    } catch (e) {
        console.error(`  ❌ Error: ${e.message}`);
        if (e.stderr) console.error(`  Stderr: ${e.stderr}`);
        return { success: false, file: sourceFile, error: e.message };
    }
}

async function main() {
    console.log('=== Ink Script Compiler ===\n');
    
    if (!existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }
    
    // Find inkjs-compiler.js
    let compilerPath = join(PROJECT_ROOT, 'node_modules', 'inkjs', 'bin', 'inkjs-compiler.js');
    if (!existsSync(compilerPath)) {
        // Try resolving if pnpm flattened structure is different
        try {
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            compilerPath = join(dirname(require.resolve('inkjs/package.json')), 'bin', 'inkjs-compiler.js');
        } catch (e) {
            console.error('❌ inkjs compiler not found.');
            process.exit(1);
        }
    }

    if (!existsSync(compilerPath)) {
        console.error(`❌ Compiler not found at: ${compilerPath}`);
        process.exit(1);
    }
    
    console.log(`Using compiler: ${compilerPath}`);

    const inkFiles = findInkFiles(SOURCE_DIR);
    console.log(`Found ${inkFiles.length} .ink files\n`);
    
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    for (const file of inkFiles) {
        const result = compileInkFile(file, compilerPath);
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
