// scripts/generate-manifest.js
// Reads content.db and exports JSON manifest + per-category pack files
// for runtime consumption by the browser (which can't read SQLite directly)

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.argv[2] || resolve(__dirname, '..', 'content.db');
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'assets');
const PACKS_DIR = resolve(OUTPUT_DIR, 'packs');

// Category → Pack mapping
const CATEGORY_TO_PACK = {
    'Environmental Emergencies': 'medical-core',
    'Trauma': 'medical-core',
    'Medical Emergencies': 'medical-core',
    'Medications': 'medical-core',
    'Anatomy Reference': 'medical-core',
    'Legal Rights UK': 'legal-uk',
    'Survival Skills': 'survival-core'
};

const PACK_DEFINITIONS = {
    'medical-core': {
        id: 'medical-core',
        name: 'Emergency Medical Guide',
        description: 'First aid, CPR, emergency triage, trauma care, medications, and anatomy reference. Sourced from Wikipedia WikiProject Medicine.',
        category: 'medical',
        store: 'health_content',
        tags: ['first-aid', 'cpr', 'emergency', 'medical', 'trauma', 'medications'],
        metadata: {
            source: 'Wikipedia WikiProject Medicine',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors, licensed under CC-BY-SA 4.0',
            lastVerified: new Date().toISOString().split('T')[0]
        }
    },
    'legal-uk': {
        id: 'legal-uk',
        name: 'UK Legal Rights',
        description: 'Know your rights: PACE codes, arrest procedures, stop & search, police encounters, and legal protections.',
        category: 'legal',
        store: 'law_content',
        tags: ['legal', 'rights', 'police', 'arrest', 'uk', 'pace'],
        metadata: {
            source: 'UK Government / legislation.gov.uk / Wikipedia',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors',
            lastVerified: new Date().toISOString().split('T')[0]
        }
    },
    'survival-core': {
        id: 'survival-core',
        name: 'Survival Essentials',
        description: 'Water purification, shelter building, fire starting, navigation, and emergency preparedness.',
        category: 'survival',
        store: 'survival_content',
        tags: ['survival', 'emergency', 'water', 'shelter', 'fire', 'navigation'],
        metadata: {
            source: 'Wikipedia',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors',
            lastVerified: new Date().toISOString().split('T')[0]
        }
    }
};

function main() {
    console.log(`Reading content.db from: ${DB_PATH}`);

    if (!existsSync(DB_PATH)) {
        console.error(`content.db not found at ${DB_PATH}. Run 'npm run fetch-content' first.`);
        process.exit(1);
    }

    const db = new Database(DB_PATH, { readonly: true });

    // Query articles with their categories via join
    const articles = db.prepare(`
        SELECT
            a.id, a.slug, a.title, a.body_html, a.body_plain,
            a.source, a.source_url,
            c.name as categoryName
        FROM articles a
        LEFT JOIN article_categories ac ON a.id = ac.article_id
        LEFT JOIN categories c ON ac.category_id = c.id
        ORDER BY c.name, a.title
    `).all();

    console.log(`Found ${articles.length} articles`);

    // Group articles into packs
    const packArticles = {};
    for (const packId of Object.keys(PACK_DEFINITIONS)) {
        packArticles[packId] = [];
    }

    let unmappedCount = 0;
    for (const article of articles) {
        const packId = CATEGORY_TO_PACK[article.categoryName];
        if (!packId) {
            // Default unmapped articles to medical-core
            packArticles['medical-core'].push(article);
            unmappedCount++;
            continue;
        }
        packArticles[packId].push(article);
    }

    if (unmappedCount > 0) {
        console.log(`Note: ${unmappedCount} articles with unmapped categories defaulted to medical-core`);
    }

    // Ensure output directories exist
    mkdirSync(PACKS_DIR, { recursive: true });

    // Generate per-pack JSON files
    const manifestPacks = [];

    for (const [packId, definition] of Object.entries(PACK_DEFINITIONS)) {
        const articles = packArticles[packId];
        if (articles.length === 0) {
            console.log(`  Skipping ${packId}: no articles`);
            continue;
        }

        // Build pack data with articles
        const packData = {
            packId,
            generatedAt: new Date().toISOString(),
            articles: articles.map(a => ({
                id: a.slug,
                slug: a.slug,
                title: a.title,
                content: a.body_html,
                plainText: (a.body_plain || '').substring(0, 5000),
                description: (a.body_plain || '').substring(0, 200),
                source: a.source || 'wikipedia',
                sourceUrl: a.source_url || '',
                category: definition.category
            }))
        };

        // Write pack JSON
        const packPath = resolve(PACKS_DIR, `${packId}.json`);
        const packJson = JSON.stringify(packData);
        writeFileSync(packPath, packJson, 'utf-8');

        const packSizeBytes = Buffer.byteLength(packJson, 'utf-8');

        console.log(`  ${packId}: ${articles.length} articles, ${(packSizeBytes / 1024 / 1024).toFixed(1)} MB`);

        // Add to manifest
        manifestPacks.push({
            ...definition,
            version: '1.0.0',
            articleCount: articles.length,
            size: packSizeBytes,
            sizeDisplay: packSizeBytes > 1024 * 1024
                ? `${(packSizeBytes / 1024 / 1024).toFixed(1)} MB`
                : `${(packSizeBytes / 1024).toFixed(0)} KB`,
            dataUrl: `/assets/packs/${packId}.json`,
            bundled: true
        });
    }

    // Generate master manifest
    const manifest = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        bundled: true,
        packs: manifestPacks,
        totalArticles: articles.length,
        totalSize: manifestPacks.reduce((sum, p) => sum + p.size, 0)
    };

    const manifestPath = resolve(OUTPUT_DIR, 'content-manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`\nManifest written to: ${manifestPath}`);
    console.log(`Total: ${manifest.totalArticles} articles in ${manifestPacks.length} packs`);
    console.log(`Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(1)} MB`);

    db.close();
}

main();
