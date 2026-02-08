#!/usr/bin/env node
/**
 * Generate PWA icon PNGs from icon.svg
 *
 * Requires: sharp (npm install --save-dev sharp)
 * Usage: node scripts/generate-icons.js
 *
 * Generates:
 *   public/icon-192.png  (192x192)
 *   public/icon-512.png  (512x512)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function generateIcons() {
    try {
        const sharp = (await import('sharp')).default;
        const svgBuffer = readFileSync(join(ROOT, 'public', 'icon.svg'));

        const sizes = [192, 512];

        for (const size of sizes) {
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(join(ROOT, 'public', `icon-${size}.png`));

            console.log(`Generated icon-${size}.png`);
        }

        console.log('All icons generated successfully');
    } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND' || e.message?.includes('sharp')) {
            console.error('sharp is not installed. Run: npm install --save-dev sharp');
            console.error('Then re-run: node scripts/generate-icons.js');
            process.exit(1);
        }
        throw e;
    }
}

generateIcons();
