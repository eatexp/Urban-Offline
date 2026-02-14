const fs = require('fs');
const path = require('path');

console.log('Script started');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

const PUBLIC_WASM_DIR = path.join(__dirname, '../public/wasm');
const NODE_MODULES_DIR = path.join(__dirname, '../node_modules');

console.log('Public WASM dir:', PUBLIC_WASM_DIR);
console.log('Node modules dir:', NODE_MODULES_DIR);

try {
    // Ensure output directory exists
    if (!fs.existsSync(PUBLIC_WASM_DIR)) {
        console.log('Creating directory:', PUBLIC_WASM_DIR);
        fs.mkdirSync(PUBLIC_WASM_DIR, { recursive: true });
    } else {
        console.log('Directory exists:', PUBLIC_WASM_DIR);
    }
} catch (e) {
    console.error('Error creating directory:', e);
    process.exit(1);
}

// Function to extract base64 string using regex
function extractBase64Regex(content, regex) {
    const match = content.match(regex);
    return match ? match[1] : null;
}

// Extract ZSTD WASM
function extractZstdWasm() {
    console.log('Extracting ZSTD...');
    const zstdPath = path.join(NODE_MODULES_DIR, 'zstddec/dist/zstddec.esm.js');
    console.log('Checking zstddec path:', zstdPath);

    if (!fs.existsSync(zstdPath)) {
        console.error('Error: zstddec not found at', zstdPath);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(zstdPath, 'utf8');
        console.log('Read zstddec file, size:', content.length);

        // Regex for: var wasm = '...';
        const wasmBase64 = extractBase64Regex(content, /var wasm = '([^']+)';/);

        if (wasmBase64) {
            console.log('Found WASM string, decoding...');
            const buffer = Buffer.from(wasmBase64, 'base64');
            const outputPath = path.join(PUBLIC_WASM_DIR, 'zstddec.wasm');
            fs.writeFileSync(outputPath, buffer);
            console.log(`Extracted zstddec.wasm to ${outputPath} (${buffer.length} bytes)`);
        } else {
            console.error('Error: Could not find WASM string in zstddec');
            const p = content.indexOf('var wasm');
            if (p !== -1) console.log('Found "var wasm" at', p, 'Context:', content.substring(p, p + 50));
            process.exit(1);
        }
    } catch (e) {
        console.error('Error processing zstddec:', e);
        process.exit(1);
    }
}

// Extract XZ WASM
function extractXzWasm() {
    console.log('Extracting XZ...');
    const xzPath = path.join(NODE_MODULES_DIR, 'xz-decompress/dist/package/xz-decompress.js');
    console.log('Checking xz-decompress path:', xzPath);

    if (!fs.existsSync(xzPath)) {
        console.error('Error: xz-decompress not found at', xzPath);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(xzPath, 'utf8');
        console.log('Read xz-decompress file, size:', content.length);

        // Regex for: module.exports = "data:application/wasm;base64,...";
        const wasmBase64 = extractBase64Regex(content, /module\.exports = "data:application\/wasm;base64,([^"]+)";/);

        if (wasmBase64) {
            console.log('Found WASM string, decoding...');
            const buffer = Buffer.from(wasmBase64, 'base64');
            const outputPath = path.join(PUBLIC_WASM_DIR, 'xz-decompress.wasm');
            fs.writeFileSync(outputPath, buffer);
            console.log(`Extracted xz-decompress.wasm to ${outputPath} (${buffer.length} bytes)`);
        } else {
            console.error('Error: Could not find WASM string in xz-decompress');
            const p = content.indexOf('data:application/wasm;base64');
            if (p !== -1) console.log('Found matches at', p, 'Context:', content.substring(p, p + 50));
            process.exit(1);
        }
    } catch (e) {
        console.error('Error processing xz-decompress:', e);
        process.exit(1);
    }
}

console.log('Starting WASM extraction...');
extractZstdWasm();
extractXzWasm();
console.log('WASM extraction complete.');
