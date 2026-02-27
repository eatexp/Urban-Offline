/**
 * Integration Test: Content Pack System -> Grokopedia
 * 
 * Verifies that content installed by ContentPackManager is visible to ZimContentService.
 * This ensures the "Unified Content Architecture" is working.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PACK_METADATA_STORE, CONTENT_STORES } from '../../constants/ContentConstants';

// Mock DB
const mockDb = new Map();

vi.mock('../db', () => ({
    db: {
        getAll: vi.fn(async (store) => {
            if (!mockDb.has(store)) return [];
            return Array.from(mockDb.get(store).values());
        }),
        get: vi.fn(async (store, key) => {
            if (!mockDb.has(store)) return undefined;
            return mockDb.get(store).get(key);
        }),
        put: vi.fn(async (store, value) => {
            console.log(`[MockDB] put called for store: ${store}, key: ${value.id}`);
            if (!mockDb.has(store)) mockDb.set(store, new Map());
            // Use 'id' as key if available, else JSON stringify
            const key = value.id || JSON.stringify(value);
            mockDb.get(store).set(key, value);
        }),
        delete: vi.fn(async (store, key) => {
            if (mockDb.has(store)) mockDb.get(store).delete(key);
        })
    }
}));

// Mock simple dependencies
vi.mock('../SearchService', () => ({
    SearchService: { addDocuments: vi.fn() }
}));
vi.mock('../../utils/logger', () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}));
vi.mock('../DownloadCheckpoint', () => ({
    DownloadCheckpoint: {
        getCheckpoint: vi.fn(),
        saveCheckpoint: vi.fn(),
        updateProgress: vi.fn(),
        deleteCheckpoint: vi.fn(),
        canResume: vi.fn(),
        getResumeInfo: vi.fn(),
        incrementRetry: vi.fn()
    }
}));
vi.mock('../contentPacks/ContentPackSchema', () => ({
    validateManifest: vi.fn(() => ({ valid: true, errors: [] })),
    formatSize: vi.fn(),
    PACK_STATUS: { NOT_INSTALLED: 'not_installed' },
    PACK_CATEGORIES: { MEDICAL: 'medical' },
    BUNDLED_PACKS: []
}));
vi.mock('../../utils/rangeFetcher', () => ({
    createCheckpointedStream: vi.fn().mockReturnValue({
        body: {
            getReader: () => ({
                read: vi.fn().mockResolvedValue({ done: true }),
                releaseLock: vi.fn()
            })
        }
    }),
    getContentLength: vi.fn().mockResolvedValue(100)
}));
vi.mock('../../utils/checksum', () => ({
    verifyChecksum: vi.fn().mockResolvedValue(true),
    computeChecksumFromStream: vi.fn().mockResolvedValue({ hash: 'mock-hash' })
}));

// Import services after mocks
import ContentPackManager from '../contentPacks/ContentPackManager';
// Need to import ZimContentService properly, assuming it exports default or named
// Looking at file, it is `export const ZimContentService = ...`
import { ZimContentService } from './ZimContentService';

describe('Content Architecture Integration', () => {
    const TEST_PACK_ID = 'test-medical-pack';
    const TEST_PACK = {
        id: TEST_PACK_ID,
        name: 'Test Medical Pack',
        version: '1.0.0',
        category: 'medical',
        size: 1024,
        downloadUrl: 'http://example.com/pack',
        resources: [
            { id: 'article-1', type: 'article' },
            { id: 'article-2', type: 'article' }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.clear();

        // Setup ContentPackManager mocks
        ContentPackManager._downloadProgress = new Map();
        ContentPackManager._abortControllers = new Map();
        vi.spyOn(ContentPackManager, 'getAvailablePacks').mockResolvedValue([TEST_PACK]);
        vi.spyOn(ContentPackManager, '_getPackById').mockResolvedValue(TEST_PACK);

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Map(),
            body: {
                getReader: () => ({
                    read: vi.fn().mockResolvedValue({ done: true }),
                    releaseLock: vi.fn()
                })
            }
        });

        // Mock storage
        global.navigator.storage = {
            estimate: vi.fn().mockResolvedValue({ quota: 10 * 1024 * 1024, usage: 0 }),
            getDirectory: vi.fn()
        };
        Object.defineProperty(global.navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        });
    });

    it('should allow ZimContentService to read content installed by ContentPackManager', async () => {
        // 1. Install Pack
        const result = await ContentPackManager.downloadPack(TEST_PACK_ID);
        if (!result.success) {
            console.error('Download failed:', result.error);
        }
        expect(result.success).toBe(true);

        // Verify ContentPackManager put data into the correct store
        const healthStore = mockDb.get(CONTENT_STORES.MEDICAL);
        expect(healthStore).toBeDefined();
        expect(healthStore.size).toBeGreaterThan(0);
        expect(healthStore.get('article-1')).toBeDefined();

        // 2. Read with ZimContentService
        // Initialize service
        await ZimContentService.init();

        // Check if getArticle finds it (it should search all stores)
        const article = await ZimContentService.getArticle('article-1');
        expect(article).toBeDefined();
        expect(article.id).toBe('article-1');
        expect(article.category).toBe('medical');

        // Check if listing articles for pack works
        // This requires ZimContentService to look up metadata
        const articles = await ZimContentService._getArticlesForPack(TEST_PACK_ID);
        expect(articles.length).toBe(2);

        // If getAll works
        const all = await ZimContentService._getAllArticles();
        expect(all.length).toBe(2);
    });
});
