/* global process */
// scripts/fetch-content.js
// MVP Content Pipeline - Fetches curated articles from Wikipedia API

import Database from 'better-sqlite3';
import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { SCHEMA_SQL } from '../src/services/storage/schema.js';

const OUTPUT_DB = process.argv[2] || 'content.db';
const WIKI_API_BASE = 'https://en.wikipedia.org/api/rest_v1/page/html';
const RATE_LIMIT_MS = 300;
const USER_AGENT = 'Urban-Offline/1.0 (emergency-preparedness-app)';

const CONTENT_MANIFEST = {
    categories: [
        { name: 'Emergency First Aid', parent: null },
        { name: 'Environmental Emergencies', parent: 'Emergency First Aid' },
        { name: 'Trauma', parent: 'Emergency First Aid' },
        { name: 'Medical Emergencies', parent: 'Emergency First Aid' },
        { name: 'Medications', parent: null },
        { name: 'Legal Rights UK', parent: null },
        { name: 'Anatomy Reference', parent: null },
        { name: 'Survival Skills', parent: null },
    ],

    articles: [
        // === ENVIRONMENTAL EMERGENCIES ===
        { title: 'Hypothermia', category: 'Environmental Emergencies' },
        { title: 'Hyperthermia', category: 'Environmental Emergencies' },
        { title: 'Heat_stroke', category: 'Environmental Emergencies' },
        { title: 'Frostbite', category: 'Environmental Emergencies' },
        { title: 'Dehydration', category: 'Environmental Emergencies' },
        { title: 'Drowning', category: 'Environmental Emergencies' },
        { title: 'Altitude_sickness', category: 'Environmental Emergencies' },
        { title: 'Lightning_strike', category: 'Environmental Emergencies' },
        { title: 'Radiation_poisoning', category: 'Environmental Emergencies' },

        // === TRAUMA ===
        { title: 'Bleeding', category: 'Trauma' },
        { title: 'Wound', category: 'Trauma' },
        { title: 'Bone_fracture', category: 'Trauma' },
        { title: 'Dislocation', category: 'Trauma' },
        { title: 'Sprain', category: 'Trauma' },
        { title: 'Concussion', category: 'Trauma' },
        { title: 'Traumatic_brain_injury', category: 'Trauma' },
        { title: 'Burns', category: 'Trauma' },
        { title: 'Chemical_burn', category: 'Trauma' },
        { title: 'Electrical_injury', category: 'Trauma' },
        { title: 'Crush_syndrome', category: 'Trauma' },
        { title: 'Pneumothorax', category: 'Trauma' },
        { title: 'Tourniquet', category: 'Trauma' },
        { title: 'Splint_(medicine)', category: 'Trauma' },
        { title: 'Suture', category: 'Trauma' },

        // === MEDICAL EMERGENCIES ===
        { title: 'Cardiac_arrest', category: 'Medical Emergencies' },
        { title: 'Cardiopulmonary_resuscitation', category: 'Medical Emergencies' },
        { title: 'Choking', category: 'Medical Emergencies' },
        { title: 'Heimlich_maneuver', category: 'Medical Emergencies' },
        { title: 'Anaphylaxis', category: 'Medical Emergencies' },
        { title: 'Shock_(circulatory)', category: 'Medical Emergencies' },
        { title: 'Stroke', category: 'Medical Emergencies' },
        { title: 'Myocardial_infarction', category: 'Medical Emergencies' },
        { title: 'Seizure', category: 'Medical Emergencies' },
        { title: 'Status_epilepticus', category: 'Medical Emergencies' },
        { title: 'Diabetic_ketoacidosis', category: 'Medical Emergencies' },
        { title: 'Hypoglycemia', category: 'Medical Emergencies' },
        { title: 'Asthma', category: 'Medical Emergencies' },
        { title: 'Pulmonary_embolism', category: 'Medical Emergencies' },
        { title: 'Sepsis', category: 'Medical Emergencies' },
        { title: 'Meningitis', category: 'Medical Emergencies' },
        { title: 'Appendicitis', category: 'Medical Emergencies' },
        { title: 'Food_poisoning', category: 'Medical Emergencies' },
        { title: 'Poisoning', category: 'Medical Emergencies' },
        { title: 'Drug_overdose', category: 'Medical Emergencies' },
        { title: 'Alcohol_intoxication', category: 'Medical Emergencies' },
        { title: 'Recovery_position', category: 'Medical Emergencies' },
        { title: 'Automated_external_defibrillator', category: 'Medical Emergencies' },
        { title: 'Infection', category: 'Medical Emergencies' },
        { title: 'Tetanus', category: 'Medical Emergencies' },
        { title: 'Rabies', category: 'Medical Emergencies' },
        { title: 'Cellulitis', category: 'Medical Emergencies' },
        { title: 'Gastroenteritis', category: 'Medical Emergencies' },
        { title: 'Pneumonia', category: 'Medical Emergencies' },
        { title: 'Panic_attack', category: 'Medical Emergencies' },
        { title: 'Psychosis', category: 'Medical Emergencies' },
        { title: 'Suicide_prevention', category: 'Medical Emergencies' },
        { title: 'Childbirth', category: 'Medical Emergencies' },
        { title: 'Obstetric_hemorrhage', category: 'Medical Emergencies' },
        { title: 'NHS_111', category: 'Medical Emergencies' },
        { title: '999_(emergency_telephone_number)', category: 'Medical Emergencies' },

        // === MEDICATIONS ===
        { title: 'Paracetamol', category: 'Medications' },
        { title: 'Ibuprofen', category: 'Medications' },
        { title: 'Aspirin', category: 'Medications' },
        { title: 'Epinephrine_autoinjector', category: 'Medications' },
        { title: 'Antihistamine', category: 'Medications' },
        { title: 'Oral_rehydration_therapy', category: 'Medications' },
        { title: 'Activated_charcoal', category: 'Medications' },
        { title: 'Naloxone', category: 'Medications' },
        { title: 'Glucose', category: 'Medications' },

        // === ANATOMY REFERENCE ===
        { title: 'Circulatory_system', category: 'Anatomy Reference' },
        { title: 'Respiratory_system', category: 'Anatomy Reference' },
        { title: 'Airway', category: 'Anatomy Reference' },
        { title: 'Femoral_artery', category: 'Anatomy Reference' },
        { title: 'Carotid_artery', category: 'Anatomy Reference' },
        { title: 'Radial_artery', category: 'Anatomy Reference' },

        // === LEGAL RIGHTS UK ===
        { title: 'Police_and_Criminal_Evidence_Act_1984', category: 'Legal Rights UK' },
        { title: 'Right_to_silence', category: 'Legal Rights UK' },
        { title: 'Stop_and_search', category: 'Legal Rights UK' },
        { title: 'Arrest', category: 'Legal Rights UK' },
        { title: 'Human_Rights_Act_1998', category: 'Legal Rights UK' },
        { title: 'Public_Order_Act_1986', category: 'Legal Rights UK' },
        { title: 'Duty_solicitor', category: 'Legal Rights UK' },
        { title: 'Habeas_corpus', category: 'Legal Rights UK' },

        // === SURVIVAL SKILLS ===
        { title: 'Water_purification', category: 'Survival Skills' },
        { title: 'Fire_making', category: 'Survival Skills' },
        { title: 'Survival_shelter', category: 'Survival Skills' },
        { title: 'Distress_signal', category: 'Survival Skills' },
        { title: 'Survival_kit', category: 'Survival Skills' },
        { title: 'Emergency_blanket', category: 'Survival Skills' },
    ]
};

// === UTILITY FUNCTIONS ===

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (response.ok) return response;

        if (response.status === 429) {
            const backoff = Math.pow(2, attempt) * 1000;
            console.warn(`\nRate limited, waiting ${backoff}ms...`);
            await sleep(backoff);
            continue;
        }

        // Non-retryable error
        return response;
    }
    throw new Error(`Failed after ${maxRetries} retries`);
}

function cleanHtml(rawHtml) {
    const dom = new JSDOM(rawHtml);
    const doc = dom.window.document;

    // Remove unwanted elements
    // Remove specific elements
    const elementsToRemove = [
        'style', 'script', 'link',
        '.mw-editsection',
        '.mw-empty-elt',
        '.navbox',
        '.sidebar',
        '.reference',
        '.reflist'
    ];

    // Remove entire sections if they match these
    const sectionsToRemove = [
        '[data-mw-section-id] > .mw-heading:has(#References)',
        '[data-mw-section-id] > .mw-heading:has(#External_links)',
        '[data-mw-section-id] > .mw-heading:has(#See_also)',
        '[data-mw-section-id] > .mw-heading:has(#Further_reading)',
    ];

    elementsToRemove.forEach(selector => {
        try {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        } catch { /* ignore invalid selectors */ }
    });

    sectionsToRemove.forEach(selector => {
        try {
            doc.querySelectorAll(selector).forEach(el => {
                if (el.closest('[data-mw-section-id]')) {
                    el.closest('[data-mw-section-id]').remove();
                } else {
                    el.remove();
                }
            });
        } catch { /* ignore invalid selectors */ }
    });

    // Remove data-mw attributes (MediaWiki metadata)
    doc.querySelectorAll('[data-mw]').forEach(el => el.removeAttribute('data-mw'));

    // Get the body content
    const body = doc.querySelector('body') || doc.documentElement;
    return body.innerHTML;
}

function extractPlainText(html) {
    const dom = new JSDOM(html);
    const text = dom.window.document.body?.textContent || '';
    // Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
}

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// === DATABASE FUNCTIONS ===

function initDatabase(dbPath) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA_SQL);
    return db;
}

function createCategories(db, categories) {
    const insert = db.prepare(
        'INSERT OR IGNORE INTO categories (name, parent_id) VALUES (?, ?)'
    );
    const getByName = db.prepare('SELECT id FROM categories WHERE name = ?');

    const categoryIds = {};

    // First pass: create all categories without parents
    for (const cat of categories) {
        insert.run(cat.name, null);
        categoryIds[cat.name] = getByName.get(cat.name).id;
    }

    // Second pass: update parent references
    const updateParent = db.prepare('UPDATE categories SET parent_id = ? WHERE name = ?');
    for (const cat of categories) {
        if (cat.parent) {
            updateParent.run(categoryIds[cat.parent], cat.name);
        }
    }

    return categoryIds;
}

function insertArticle(db, article, categoryId) {
    const insertArticle = db.prepare(`
    INSERT OR REPLACE INTO articles 
    (slug, title, body_html, body_plain, source, source_url, last_updated, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `);

    const result = insertArticle.run(
        article.slug,
        article.title,
        article.body_html,
        article.body_plain,
        article.source,
        article.source_url,
        article.content_hash
    );

    // Link to category
    const linkCategory = db.prepare(`
    INSERT OR IGNORE INTO article_categories (article_id, category_id)
    VALUES (?, ?)
  `);
    linkCategory.run(result.lastInsertRowid, categoryId);

    return result.lastInsertRowid;
}

function insertAttribution(db) {
    const insert = db.prepare(`
    INSERT OR IGNORE INTO attributions 
    (source_name, license_type, license_url, attribution_text)
    VALUES (?, ?, ?, ?)
  `);

    insert.run(
        'Wikipedia',
        'CC-BY-SA-4.0',
        'https://creativecommons.org/licenses/by-sa/4.0/',
        'Content from Wikipedia, the free encyclopedia. Available under Creative Commons Attribution-ShareAlike 4.0 International License.'
    );
}

// === MAIN PIPELINE ===

async function main() {
    console.log('=== Urban-Offline MVP Content Pipeline ===\n');

    console.log('Initializing database...');
    const db = initDatabase(OUTPUT_DB);

    console.log('Creating categories...');
    const categoryIds = createCategories(db, CONTENT_MANIFEST.categories);
    console.log(`Created ${Object.keys(categoryIds).length} categories\n`);

    console.log('Fetching articles from Wikipedia...\n');

    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < CONTENT_MANIFEST.articles.length; i++) {
        const article = CONTENT_MANIFEST.articles[i];
        const progress = `[${i + 1}/${CONTENT_MANIFEST.articles.length}]`;

        try {
            process.stdout.write(`${progress} Fetching: ${article.title.substring(0, 40).padEnd(40)}... `);

            const url = `${WIKI_API_BASE}/${encodeURIComponent(article.title)}`;
            const response = await fetchWithRetry(url);

            if (!response.ok) {
                console.log(`FAILED (HTTP ${response.status})`);
                errors.push({ title: article.title, error: `HTTP ${response.status}` });
                failed++;
                await sleep(RATE_LIMIT_MS);
                continue;
            }

            const rawHtml = await response.text();
            const cleanedHtml = cleanHtml(rawHtml);
            const plainText = extractPlainText(cleanedHtml);

            if (plainText.length < 500) {
                console.log(`SKIPPED (too short: ${plainText.length} chars)`);
                errors.push({ title: article.title, error: 'Content too short' });
                failed++;
                await sleep(RATE_LIMIT_MS);
                continue;
            }

            insertArticle(db, {
                slug: slugify(article.title),
                title: article.title.replace(/_/g, ' '),
                body_html: cleanedHtml,
                body_plain: plainText,
                source: 'wikipedia',
                source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                content_hash: createHash('md5').update(cleanedHtml).digest('hex')
            }, categoryIds[article.category]);

            console.log(`OK (${(plainText.length / 1000).toFixed(1)}k chars)`);
            success++;

            await sleep(RATE_LIMIT_MS);

        } catch (err) {
            console.log(`ERROR: ${err.message}`);
            errors.push({ title: article.title, error: err.message });
            failed++;
        }
    }

    console.log('\nRebuilding FTS index...');
    db.exec("INSERT INTO articles_fts(articles_fts) VALUES('rebuild')");

    console.log('Adding attribution record...');
    insertAttribution(db);

    // Summary
    console.log('\n=== COMPLETE ===\n');

    const stats = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const dbSize = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();

    console.log(`Articles indexed: ${stats.count}`);
    console.log(`Database size: ${(dbSize.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Success: ${success}, Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\nFailed articles:');
        errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`));
    }

    // Test search
    console.log('\nTesting FTS search for "hypothermia"...');
    const testResult = db.prepare(`
    SELECT articles.title, substr(articles.body_plain, 1, 100) as excerpt 
    FROM articles_fts 
    JOIN articles ON articles_fts.rowid = articles.id
    WHERE articles_fts MATCH 'hypothermia'
    LIMIT 3
  `).all();

    if (testResult.length > 0) {
        console.log(`Found ${testResult.length} results:`);
        testResult.forEach(r => console.log(`  - ${r.title}`));
    } else {
        console.log('WARNING: No search results found!');
    }

    db.close();
    console.log(`\nDatabase saved to: ${OUTPUT_DB}`);
}

main().catch(err => {
    console.error('\nFATAL ERROR:', err);
    process.exit(1);
});
