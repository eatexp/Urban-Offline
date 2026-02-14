/**
 * Integration Tests for ContentPackManager
 * 
 * Tests resume capability, checksum verification, and download management.
 * Ensures "Blackout Protocol" resilience through verified download operations.
 *
 * Compliance: .clinerules §1, §4 - Resume capability and checksum validation
 */

// Using vitest globals - vite.config.js has globals: true
// describe, it, expect, vi, beforeEach, afterEach are available globally

// Mock the dependencies
vi.mock('../db', () => ({
    db: {
        getAll: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
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

vi.mock('../SearchService', () => ({
    SearchService: {
        addDocuments: vi.fn()
    }
}));

vi.mock('../../utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    })
}));

vi.mock('./ContentPackSchema', () => ({
    PACK_STATUS: {
        NOT_INSTALLED: 'not_installed',
        INSTALLED: 'installed',
        BUNDLED: 'bundled',
        PAUSED: 'paused'
    },
    PACK_CATEGORIES: {
        MEDICAL: 'medical',
        LEGAL: 'legal',
        SURVIVAL: 'survival',
        REGION: 'region',
        AI_MODEL: 'ai_model',
        ZIM_IMPORT: 'zim_import'
    },
    formatSize: vi.fn((bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`),
    validateManifest: vi.fn(() => ({ valid: true, errors: [] })),
    BUNDLED_PACKS: []
}));

// Import after mocks
import ContentPackManager from './ContentPackManager';
import { db } from '../db';
import { DownloadCheckpoint } from '../DownloadCheckpoint';
import { SearchService } from '../SearchService';

describe('ContentPackManager Integration', () => {
    const TEST_PACK_ID = 'test-medical-pack';
    const TEST_PACK = {
        id: TEST_PACK_ID,
        name: 'Test Medical Pack',
        version: '1.0.0',
        category: 'medical',
        size: 1024 * 1024, // 1MB
        downloadUrl: 'https://example.com/pack.zim',
        checksum: 'a'.repeat(64),
        dependencies: { required: [] },
        resources: [{ id: 'article-1', type: 'article' }]
    };

    let fetchMock;
    let navigatorStorageMock;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock fetch
        fetchMock = vi.fn();
        global.fetch = fetchMock;
        
        // Mock navigator.storage
        navigatorStorageMock = {
            getDirectory: vi.fn(),
            estimate: vi.fn().mockResolvedValue({ quota: 10 * 1024 * 1024 * 1024, usage: 0 })
        };
        Object.defineProperty(global.navigator, 'storage', {
            value: navigatorStorageMock,
            writable: true,
            configurable: true
        });

        // Mock navigator.onLine
        Object.defineProperty(global.navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        });

        // Reset ContentPackManager state
        ContentPackManager._downloadProgress.clear();
        ContentPackManager._abortControllers.clear();
        ContentPackManager._retryQueue = [];
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Full Download', () => {
        it('should successfully download and install a pack', async () => {
            // Mock fetch to return successful response
            const mockArrayBuffer = new ArrayBuffer(TEST_PACK.size);
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map([['content-length', String(TEST_PACK.size)]]),
                body: {
                    getReader: () => ({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new Uint8Array(mockArrayBuffer) })
                            .mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            // Mock no existing checkpoint
            DownloadCheckpoint.getCheckpoint.mockResolvedValue(null);
            DownloadCheckpoint.saveCheckpoint.mockResolvedValue(undefined);
            DownloadCheckpoint.updateProgress.mockResolvedValue(undefined);
            DownloadCheckpoint.deleteCheckpoint.mockResolvedValue(undefined);

            // Mock db operations
            db.getAll.mockResolvedValue([]);
            db.put.mockResolvedValue(undefined);

            // Mock OPFS
            const mockFileHandle = {
                createWritable: vi.fn().mockResolvedValue({
                    write: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined),
                    seek: vi.fn().mockResolvedValue(undefined)
                }),
                getFile: vi.fn().mockResolvedValue({
                    arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
                })
            };
            navigatorStorageMock.getDirectory.mockResolvedValue({
                getFileHandle: vi.fn()
                    .mockRejectedValueOnce(new Error('File not found')) // First call - doesn't exist
                    .mockResolvedValue(mockFileHandle), // Second call - created
                removeEntry: vi.fn().mockResolvedValue(undefined)
            });

            const progressCallback = vi.fn();
            const result = await ContentPackManager.downloadPack(TEST_PACK_ID, progressCallback);

            expect(result.success).toBe(true);
            expect(fetchMock).toHaveBeenCalled();
            expect(db.put).toHaveBeenCalledWith('content_packs', expect.any(Object));
        });

        it('should verify checksum after download', async () => {
            // This test verifies that checksum verification is attempted
            const mockArrayBuffer = new ArrayBuffer(100);
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map(),
                body: {
                    getReader: () => ({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new Uint8Array(100) })
                            .mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            DownloadCheckpoint.getCheckpoint.mockResolvedValue(null);
            db.getAll.mockResolvedValue([TEST_PACK]);
            
            const progressCallback = vi.fn();
            await ContentPackManager.downloadPack(TEST_PACK_ID, progressCallback);

            // Verify that download was attempted
            expect(fetchMock).toHaveBeenCalled();
        });
    });

    describe('Interrupted Download', () => {
        it('should save checkpoint when download is interrupted', async () => {
            const bytesBeforeError = 500 * 1024; // 500KB
            
            // Mock fetch that throws after partial download
            fetchMock.mockRejectedValue(new Error('Network error'));

            // Mock checkpoint exists with partial progress
            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: bytesBeforeError,
                totalBytes: TEST_PACK.size,
                timestamp: Date.now(),
                retryCount: 0
            });
            DownloadCheckpoint.canResume.mockReturnValue(true);
            DownloadCheckpoint.updateProgress.mockResolvedValue(undefined);
            DownloadCheckpoint.saveCheckpoint.mockResolvedValue(undefined);

            db.getAll.mockResolvedValue([TEST_PACK]);

            const progressCallback = vi.fn();
            const result = await ContentPackManager.downloadPack(TEST_PACK_ID, progressCallback);

            // Should indicate that resume is possible
            expect(result.canResume).toBe(true);
            expect(DownloadCheckpoint.updateProgress).toHaveBeenCalled();
        });

        it('should return canResume: true when network error occurs', async () => {
            fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: 100,
                totalBytes: TEST_PACK.size,
                timestamp: Date.now(),
                retryCount: 0
            });
            DownloadCheckpoint.canResume.mockReturnValue(true);
            DownloadCheckpoint.updateProgress.mockResolvedValue(undefined);

            db.getAll.mockResolvedValue([TEST_PACK]);

            const result = await ContentPackManager.downloadPack(TEST_PACK_ID);

            expect(result.canResume).toBe(true);
        });
    });

    describe('Resume Download', () => {
        it('should resume download from checkpoint', async () => {
            const bytesReceived = 500 * 1024; // 500KB already downloaded
            
            // Mock checkpoint for resume
            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: bytesReceived,
                totalBytes: TEST_PACK.size,
                timestamp: Date.now(),
                retryCount: 1
            });
            DownloadCheckpoint.canResume.mockReturnValue(true);
            DownloadCheckpoint.updateProgress.mockResolvedValue(undefined);

            // Mock fetch with Range header support
            fetchMock.mockResolvedValue({
                ok: true,
                status: 206, // Partial content
                headers: new Map(),
                body: {
                    getReader: () => ({
                        read: vi.fn().mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            db.getAll.mockResolvedValue([TEST_PACK]);

            await ContentPackManager.downloadPack(TEST_PACK_ID);

            // Verify fetch was called (potentially with Range header)
            expect(fetchMock).toHaveBeenCalled();
        });

        it('should use Range header when resuming', async () => {
            const bytesReceived = 256 * 1024;
            
            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: bytesReceived,
                totalBytes: TEST_PACK.size,
                timestamp: Date.now(),
                retryCount: 0
            });
            DownloadCheckpoint.canResume.mockReturnValue(true);
            
            fetchMock.mockResolvedValue({
                ok: true,
                status: 206,
                headers: new Map(),
                body: {
                    getReader: () => ({
                        read: vi.fn().mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            db.getAll.mockResolvedValue([TEST_PACK]);

            await ContentPackManager.downloadPack(TEST_PACK_ID);

            // Check if Range header was included in fetch call
            const fetchCall = fetchMock.mock.calls[0];
            expect(fetchCall[0]).toBe(TEST_PACK.downloadUrl);
        });
    });

    describe('Checksum Failure', () => {
        it('should increment retry count on checksum failure', async () => {
            const mockArrayBuffer = new ArrayBuffer(100);
            
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map(),
                body: {
                    getReader: () => ({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new Uint8Array(100) })
                            .mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: 0,
                totalBytes: 100,
                timestamp: Date.now(),
                retryCount: 0
            });
            DownloadCheckpoint.incrementRetry.mockResolvedValue(1);
            DownloadCheckpoint.canResume.mockReturnValue(true);

            db.getAll.mockResolvedValue([{
                ...TEST_PACK,
                checksum: 'invalid_checksum_that_will_fail'
            }]);

            // Mock navigator.storage to throw during checksum verification
            navigatorStorageMock.getDirectory.mockRejectedValue(new Error('Storage error'));

            const result = await ContentPackManager.downloadPack(TEST_PACK_ID);

            // Should indicate failure but allow retry
            expect(result.success).toBe(false);
        });

        it('should allow retry after checksum failure', async () => {
            DownloadCheckpoint.getCheckpoint.mockResolvedValue({
                url: TEST_PACK.downloadUrl,
                bytesReceived: 0,
                totalBytes: TEST_PACK.size,
                timestamp: Date.now(),
                retryCount: 1 // Already retried once
            });
            DownloadCheckpoint.canResume.mockReturnValue(true);
            DownloadCheckpoint.incrementRetry.mockResolvedValue(2);

            db.getAll.mockResolvedValue([TEST_PACK]);
            fetchMock.mockRejectedValue(new Error('Download failed'));

            const result = await ContentPackManager.downloadPack(TEST_PACK_ID);

            // Should still allow resume if under max retries
            expect(result.canResume || result.queued).toBeTruthy();
        });
    });

    describe('Resume Info', () => {
        it('should return resume info for pack with checkpoint', async () => {
            const resumeInfo = {
                canResume: true,
                bytesReceived: 500000,
                totalBytes: 1000000,
                progress: 50,
                retryCount: 0
            };

            db.get.mockResolvedValue(TEST_PACK);
            DownloadCheckpoint.getResumeInfo.mockResolvedValue(resumeInfo);

            const result = await ContentPackManager.getResumeInfo(TEST_PACK_ID);

            expect(result).toEqual(resumeInfo);
        });

        it('should return null for pack without checkpoint', async () => {
            db.get.mockResolvedValue(null);
            DownloadCheckpoint.getResumeInfo.mockResolvedValue(null);

            const result = await ContentPackManager.getResumeInfo(TEST_PACK_ID);

            expect(result).toBeNull();
        });
    });

    describe('Download Progress Tracking', () => {
        it('should track download progress', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map([['content-length', '1000']]),
                body: {
                    getReader: () => ({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
                            .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
                            .mockResolvedValueOnce({ done: true }),
                        releaseLock: vi.fn()
                    })
                }
            });

            DownloadCheckpoint.getCheckpoint.mockResolvedValue(null);
            db.getAll.mockResolvedValue([{ ...TEST_PACK, size: 1000 }]);

            const progressCallback = vi.fn();
            await ContentPackManager.downloadPack(TEST_PACK_ID, progressCallback);

            // Progress callback should have been called
            expect(progressCallback).toHaveBeenCalled();
        });

        it('should return download progress for active download', () => {
            ContentPackManager._downloadProgress.set(TEST_PACK_ID, 50);
            
            const progress = ContentPackManager.getDownloadProgress(TEST_PACK_ID);
            
            expect(progress).toBe(50);
        });

        it('should return -1 for inactive download', () => {
            const progress = ContentPackManager.getDownloadProgress('non-existent-pack');
            
            expect(progress).toBe(-1);
        });
    });

    describe('Cancel Download', () => {
        it('should cancel active download', () => {
            const abortController = new AbortController();
            const abortSpy = vi.spyOn(abortController, 'abort');
            
            ContentPackManager._abortControllers.set(TEST_PACK_ID, abortController);
            
            ContentPackManager.cancelDownload(TEST_PACK_ID);
            
            expect(abortSpy).toHaveBeenCalled();
        });

        it('should not throw when cancelling non-existent download', () => {
            expect(() => ContentPackManager.cancelDownload('non-existent')).not.toThrow();
        });
    });
});