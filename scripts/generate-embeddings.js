// scripts/generate-embeddings.js
// Generates vector embeddings for all articles using all-MiniLM-L6-v2

import { pipeline } from '@xenova/transformers';
import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CONTENT_DB = join(PROJECT_ROOT, 'content.db');
const EMBEDDINGS_FILE = join(PROJECT_ROOT, 'public', 'assets', 'embeddings.json');

async function generateEmbeddings() {
    console.log('=== Vector Embeddings Generator ===\n');
    
    if (!existsSync(CONTENT_DB)) {
        console.error('❌ content.db not found. Run "npm run fetch-content" first.');
        process.exit(1);
    }
    
    console.log('Loading embedding model (all-MiniLM-L6-v2)...');
    console.log('This may take a few minutes on first run...\n');
    
    // Load the embedding pipeline
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log('✅ Model loaded\n');
    
    const db = new Database(CONTENT_DB);
    
    // Get all articles
    const articles = db.prepare(`
        SELECT id, slug, title, body_plain
        FROM articles
        ORDER BY id
    `).all();
    
    console.log(`Found ${articles.length} articles to process\n`);
    
    const embeddings = [];
    let processed = 0;
    
    for (const article of articles) {
        try {
            process.stdout.write(`[${processed + 1}/${articles.length}] ${article.title.substring(0, 40).padEnd(40)}... `);
            
            // Combine title and first 500 chars of content for embedding
            const text = `${article.title}. ${article.body_plain.substring(0, 500)}`;
            
            // Generate embedding
            const output = await embedder(text, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            
            embeddings.push({
                id: article.id,
                slug: article.slug,
                title: article.title,
                embedding: embedding
            });
            
            console.log(`✅ (${embedding.length}d)`);
            processed++;
            
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
        }
    }
    
    db.close();
    
    // Save embeddings to JSON file
    console.log(`\nSaving embeddings to ${EMBEDDINGS_FILE}...`);
    const embeddingsData = {
        model: 'all-MiniLM-L6-v2',
        dimensions: embeddings[0]?.embedding.length || 384,
        count: embeddings.length,
        generated: new Date().toISOString(),
        embeddings: embeddings
    };
    
    writeFileSync(EMBEDDINGS_FILE, JSON.stringify(embeddingsData));
    
    const fileSizeMB = (readFileSync(EMBEDDINGS_FILE).length / 1024 / 1024).toFixed(2);
    
    console.log(`\n✅ Complete!`);
    console.log(`   Articles: ${embeddings.length}`);
    console.log(`   Dimensions: ${embeddingsData.dimensions}`);
    console.log(`   File size: ${fileSizeMB} MB`);
    console.log(`   Location: ${EMBEDDINGS_FILE}`);
}

generateEmbeddings().catch(err => {
    console.error('\nError:', err);
    process.exit(1);
});




