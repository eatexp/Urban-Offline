const { performance } = require('perf_hooks');

// Configuration
const ITEM_COUNT = 1000;
const DB_WRITE_DELAY_MS = 2; // Simulating IDB/FS write
const INDEX_SAVE_DELAY_MS = 20; // Simulating Index Serialize + Save (gets slower in reality, but fixed average here)

// Mock Data
const manifest = {
    articles: Array.from({ length: ITEM_COUNT }, (_, i) => ({
        slug: `article-${i}`,
        title: `Article ${i}`,
        body_plain: 'Some content here...',
        categories: i % 3 === 0 ? ['Legal'] : i % 3 === 1 ? ['Survival'] : ['Health']
    }))
};

// Mocks
const db = {
    async put(store, item) {
        await new Promise(resolve => setTimeout(resolve, DB_WRITE_DELAY_MS));
    },
    async putAll(store, items) {
        // Simulating batch write: overhead + parallel/transaction speedup
        // Say it takes 20ms overhead + 0.1ms per item (much faster)
        await new Promise(resolve => setTimeout(resolve, 20 + (items.length * 0.1)));
    }
};

const SearchService = {
    async addDocument(doc) {
        // N+1: Saves index every time
        await new Promise(resolve => setTimeout(resolve, INDEX_SAVE_DELAY_MS));
    },
    async addDocuments(docs) {
        // Batch: Saves index ONCE
        // Indexing takes time (0.5ms per doc) + 1 Save (20ms)
        await new Promise(resolve => setTimeout(resolve, 20 + (docs.length * 0.5)));
    }
};

// Baseline Implementation (Current Code Logic)
async function runBaseline() {
    console.log('Starting Baseline Sync (N+1)...');
    const start = performance.now();

    let count = 0;
    if (manifest.articles) {
        for (const article of manifest.articles) {
            let category = 'health';
            if (article.categories) {
                if (article.categories.some(c => c.includes('Legal'))) {
                    category = 'law';
                } else if (article.categories.some(c => c.includes('Survival'))) {
                    category = 'survival';
                }
            }

            // DB Put
            await db.put(`${category}_content`, article);

            // Search Index
            await SearchService.addDocument(article);

            count++;
            if (count % 100 === 0) process.stdout.write('.');
        }
    }
    console.log('');
    const end = performance.now();
    return end - start;
}

// Optimized Implementation (Proposed Logic)
async function runOptimized() {
    console.log('Starting Optimized Sync (Batch)...');
    const start = performance.now();

    const stores = {
        health: [],
        law: [],
        survival: []
    };
    const searchDocs = [];

    if (manifest.articles) {
        for (const article of manifest.articles) {
            let category = 'health';
            if (article.categories) {
                if (article.categories.some(c => c.includes('Legal'))) {
                    category = 'law';
                } else if (article.categories.some(c => c.includes('Survival'))) {
                    category = 'survival';
                }
            }

            stores[category].push(article);
            searchDocs.push(article);
        }

        await Promise.all([
            db.putAll('health_content', stores.health),
            db.putAll('law_content', stores.law),
            db.putAll('survival_content', stores.survival),
            SearchService.addDocuments(searchDocs)
        ]);
    }

    const end = performance.now();
    return end - start;
}

(async () => {
    const baselineTime = await runBaseline();
    console.log(`Baseline Time: ${(baselineTime / 1000).toFixed(2)}s`);

    const optimizedTime = await runOptimized();
    console.log(`Optimized Time: ${(optimizedTime / 1000).toFixed(2)}s`);

    console.log(`Improvement: ${(baselineTime / optimizedTime).toFixed(1)}x faster`);
})();
