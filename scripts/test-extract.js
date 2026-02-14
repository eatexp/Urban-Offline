const fs = require('fs');
const path = require('path');

const zstdPath = path.join(__dirname, '../node_modules/zstddec/dist/zstddec.esm.js');
console.log('Testing ZSTD path:', zstdPath);

if (fs.existsSync(zstdPath)) {
    const content = fs.readFileSync(zstdPath, 'utf8');
    console.log('Content length:', content.length);
    const regex = /var wasm = '([^']+)';/;
    const match = content.match(regex);
    if (match) {
        console.log('ZSTD Match found! Length:', match[1].length);
    } else {
        console.log('ZSTD Match NOT found');
        console.log('Snippet:', content.substring(0, 500));
    }
} else {
    console.log('ZSTD file not found');
}

const xzPath = path.join(__dirname, '../node_modules/xz-decompress/dist/package/xz-decompress.js');
console.log('Testing XZ path:', xzPath);

if (fs.existsSync(xzPath)) {
    const content = fs.readFileSync(xzPath, 'utf8');
    console.log('Content length:', content.length);
    // Try a simpler match first
    const matchStart = content.indexOf('data:application/wasm;base64,');
    if (matchStart !== -1) {
        console.log('XZ Start found at:', matchStart);
    } else {
        console.log('XZ Start NOT found');
    }
} else {
    console.log('XZ file not found');
}
