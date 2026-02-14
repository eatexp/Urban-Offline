/**
 * Unit Tests for DownloadCheckpoint Service
 * 
 * Tests resume capability for large downloads via IndexedDB checkpoint persistence.
 * Ensures "Blackout Protocol" resilience through verified checkpoint operations.
 *
 * Compliance: .clinerules §1 - Progressive download with resume capability
 */

// Using vitest globals - vite.config.js has globals: true
// describe, it, expect, vi, beforeEach, afterEach are available globally

// Mock the db module with factory function (hoisted)
vi.mock('./db', () => {
    const mockDb = {
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn()
    };
    return { db: mockDb };
});

// Mock the logger
vi.mock('../utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    })
}));

// Import after mocks are defined
import { DownloadCheckpoint } from './DownloadCheckpoint';
import { db } from './db';

describe('DownloadCheckpoint Service', () => {
    const TEST_URL = 'https://example.com/model.onnx';
    const TEST_CHECKPOINT = {
        url: TEST_URL,
        bytesReceived: 1024,
        totalBytes: 2048,
        checksum: 'a'.repeat(64),
        modelId: 'test-model',
        type: 'model',
        retryCount: 0
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveCheckpoint', () => {
        it('should save checkpoint with generated ID', async () => {
            db.put.mockResolvedValue(undefined);

            await DownloadCheckpoint.saveCheckpoint(TEST_CHECKPOINT);

            expect(db.put).toHaveBeenCalledWith(
                'download_checkpoints',
                expect.objectContaining({
                    id: expect.stringContaining('checkpoint-'),
                    url: TEST_URL,
                    bytesReceived: 1024,
                    totalBytes: 2048,
                    checksum: 'a'.repeat(64),
                    modelId: 'test-model',
                    type: 'model',
                    retryCount: 0,
                    timestamp: expect.any(Number),
                    version: 1
                })
            );
        });

        it('should throw error for missing URL', async () => {
            const invalidCheckpoint = {
                bytesReceived: 1024
            };

            await expect(DownloadCheckpoint.saveCheckpoint(invalidCheckpoint))
                .rejects.toThrow('Invalid checkpoint: url and bytesRequired required');
        });

        it('should throw error for missing bytesReceived', async () => {
            const invalidCheckpoint = {
                url: TEST_URL
            };

            await expect(DownloadCheckpoint.saveCheckpoint(invalidCheckpoint))
                .rejects.toThrow('Invalid checkpoint: url and bytesRequired required');
        });

        it('should set default values for optional fields', async () => {
            db.put.mockResolvedValue(undefined);

            const minimalCheckpoint = {
                url: TEST_URL,
                bytesReceived: 1024
            };

            await DownloadCheckpoint.saveCheckpoint(minimalCheckpoint);

            const savedData = db.put.mock.calls[0][1];
            expect(savedData.checksum).toBeNull();
            expect(savedData.etag).toBeNull();
            expect(savedData.lastModified).toBeNull();
            expect(savedData.type).toBe('unknown');
            expect(savedData.retryCount).toBe(0);
        });
    });

    describe('getCheckpoint', () => {
        it('should retrieve checkpoint by URL', async () => {
            const storedCheckpoint = {
                id: 'checkpoint-abc123',
                url: TEST_URL,
                bytesReceived: 1024,
                totalBytes: 2048,
                timestamp: Date.now()
            };

            db.get.mockResolvedValue(storedCheckpoint);

            const result = await DownloadCheckpoint.getCheckpoint(TEST_URL);

            expect(db.get).toHaveBeenCalledWith('download_checkpoints', expect.any(String));
            expect(result).toEqual(storedCheckpoint);
        });

        it('should return null for non-existent checkpoint', async () => {
            db.get.mockResolvedValue(null);

            const result = await DownloadCheckpoint.getCheckpoint('https://example.com/nonexistent');

            expect(result).toBeNull();
        });

        it('should return null on database error', async () => {
            db.get.mockRejectedValue(new Error('Database error'));

            const result = await DownloadCheckpoint.getCheckpoint(TEST_URL);

            expect(result).toBeNull();
        });
    });

    describe('deleteCheckpoint', () => {
        it('should delete checkpoint by URL', async () => {
            db.delete.mockResolvedValue(undefined);

            await DownloadCheckpoint.deleteCheckpoint(TEST_URL);

            expect(db.delete).toHaveBeenCalledWith('download_checkpoints', expect.any(String));
        });

        it('should not throw on delete error', async () => {
            db.delete.mockRejectedValue(new Error('Delete failed'));

            await expect(DownloadCheckpoint.deleteCheckpoint(TEST_URL))
                .resolves.not.toThrow();
        });
    });

    describe('listCheckpoints', () => {
        it('should return all checkpoints', async () => {
            const checkpoints = [
                { id: 'checkpoint-1', url: 'https://example.com/1' },
                { id: 'checkpoint-2', url: 'https://example.com/2' }
            ];

            db.getAll.mockResolvedValue(checkpoints);

            const result = await DownloadCheckpoint.listCheckpoints();

            expect(db.getAll).toHaveBeenCalledWith('download_checkpoints');
            expect(result).toEqual(checkpoints);
        });

        it('should return empty array on error', async () => {
            db.getAll.mockRejectedValue(new Error('Database error'));

            const result = await DownloadCheckpoint.listCheckpoints();

            expect(result).toEqual([]);
        });
    });

    describe('isStale', () => {
        const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

        it('should return false for fresh checkpoint', () => {
            const freshCheckpoint = {
                timestamp: Date.now() - 1000 // 1 second ago
            };

            const result = DownloadCheckpoint.isStale(freshCheckpoint, DEFAULT_MAX_AGE_MS);

            expect(result).toBe(false);
        });

        it('should return true for stale checkpoint', () => {
            const staleCheckpoint = {
                timestamp: Date.now() - DEFAULT_MAX_AGE_MS - 1000 // 7 days + 1 second ago
            };

            const result = DownloadCheckpoint.isStale(staleCheckpoint, DEFAULT_MAX_AGE_MS);

            expect(result).toBe(true);
        });

        it('should return true for checkpoint without timestamp', () => {
            const checkpointWithoutTimestamp = {};

            const result = DownloadCheckpoint.isStale(checkpointWithoutTimestamp, DEFAULT_MAX_AGE_MS);

            expect(result).toBe(true);
        });

        it('should return true for null checkpoint', () => {
            const result = DownloadCheckpoint.isStale(null, DEFAULT_MAX_AGE_MS);

            expect(result).toBe(true);
        });

        it('should use default max age when not specified', () => {
            const staleCheckpoint = {
                timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago
            };

            const result = DownloadCheckpoint.isStale(staleCheckpoint);

            expect(result).toBe(true);
        });
    });

    describe('canResume', () => {
        const NOW = Date.now();

        it('should return true for valid resumable checkpoint', () => {
            const validCheckpoint = {
                timestamp: NOW - 1000,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 0
            };

            const result = DownloadCheckpoint.canResume(validCheckpoint);

            expect(result).toBe(true);
        });

        it('should return false for null checkpoint', () => {
            const result = DownloadCheckpoint.canResume(null);

            expect(result).toBe(false);
        });

        it('should return false for stale checkpoint', () => {
            const staleCheckpoint = {
                timestamp: NOW - (8 * 24 * 60 * 60 * 1000), // 8 days ago
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 0
            };

            const result = DownloadCheckpoint.canResume(staleCheckpoint);

            expect(result).toBe(false);
        });

        it('should return false for completed download', () => {
            const completedCheckpoint = {
                timestamp: NOW - 1000,
                bytesReceived: 2048,
                totalBytes: 2048,
                retryCount: 0
            };

            const result = DownloadCheckpoint.canResume(completedCheckpoint);

            expect(result).toBe(false);
        });

        it('should return false when retry count exceeded', () => {
            const maxRetriesCheckpoint = {
                timestamp: NOW - 1000,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 3 // MAX_RETRY_COUNT
            };

            const result = DownloadCheckpoint.canResume(maxRetriesCheckpoint);

            expect(result).toBe(false);
        });

        it('should return false when retry count greater than max', () => {
            const exceededCheckpoint = {
                timestamp: NOW - 1000,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 5
            };

            const result = DownloadCheckpoint.canResume(exceededCheckpoint);

            expect(result).toBe(false);
        });
    });

    describe('incrementRetry', () => {
        it('should increment retry count', async () => {
            const existingCheckpoint = {
                id: 'checkpoint-abc123',
                url: TEST_URL,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 1,
                timestamp: Date.now() - 1000
            };

            db.get.mockResolvedValue(existingCheckpoint);
            db.put.mockResolvedValue(undefined);

            const newRetryCount = await DownloadCheckpoint.incrementRetry(TEST_URL);

            expect(newRetryCount).toBe(2);
            expect(db.put).toHaveBeenCalledWith(
                'download_checkpoints',
                expect.objectContaining({
                    retryCount: 2,
                    timestamp: expect.any(Number)
                })
            );
        });

        it('should return 1 for non-existent checkpoint', async () => {
            db.get.mockResolvedValue(null);

            const newRetryCount = await DownloadCheckpoint.incrementRetry(TEST_URL);

            expect(newRetryCount).toBe(1);
        });

        it('should update timestamp on retry', async () => {
            const oldTimestamp = Date.now() - 10000;
            const existingCheckpoint = {
                id: 'checkpoint-abc123',
                url: TEST_URL,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 0,
                timestamp: oldTimestamp
            };

            db.get.mockResolvedValue(existingCheckpoint);
            db.put.mockResolvedValue(undefined);

            await DownloadCheckpoint.incrementRetry(TEST_URL);

            const savedData = db.put.mock.calls[0][1];
            expect(savedData.timestamp).toBeGreaterThan(oldTimestamp);
        });

        it('should return 1 on error (treats as new checkpoint)', async () => {
            db.get.mockRejectedValue(new Error('Database error'));

            const result = await DownloadCheckpoint.incrementRetry(TEST_URL);

            // Implementation returns 1 when checkpoint doesn't exist (treats as first retry)
            expect(result).toBe(1);
        });
    });

    describe('updateProgress', () => {
        it('should update bytes received', async () => {
            const existingCheckpoint = {
                id: 'checkpoint-abc123',
                url: TEST_URL,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 0,
                timestamp: Date.now()
            };

            db.get.mockResolvedValue(existingCheckpoint);
            db.put.mockResolvedValue(undefined);

            await DownloadCheckpoint.updateProgress(TEST_URL, 1536);

            expect(db.put).toHaveBeenCalledWith(
                'download_checkpoints',
                expect.objectContaining({
                    bytesReceived: 1536
                })
            );
        });

        it('should not update if checkpoint does not exist', async () => {
            db.get.mockResolvedValue(null);

            await DownloadCheckpoint.updateProgress(TEST_URL, 1536);

            expect(db.put).not.toHaveBeenCalled();
        });

        it('should not throw on database error', async () => {
            db.get.mockRejectedValue(new Error('Database error'));

            await expect(DownloadCheckpoint.updateProgress(TEST_URL, 1536))
                .resolves.not.toThrow();
        });
    });

    describe('cleanupStale', () => {
        it('should delete stale checkpoints', async () => {
            const now = Date.now();
            const staleUrl = 'https://example.com/stale';
            const freshUrl = 'https://example.com/fresh';
            
            // Use real checkpoint objects (implementation generates IDs from URLs)
            const staleCheckpoint = {
                id: DownloadCheckpoint._generateId(staleUrl),
                url: staleUrl,
                timestamp: now - (8 * 24 * 60 * 60 * 1000) // 8 days ago
            };
            const freshCheckpoint = {
                id: DownloadCheckpoint._generateId(freshUrl),
                url: freshUrl,
                timestamp: now - 1000 // 1 second ago
            };

            db.getAll.mockResolvedValue([staleCheckpoint, freshCheckpoint]);
            db.delete.mockResolvedValue(undefined);

            const deletedCount = await DownloadCheckpoint.cleanupStale();

            expect(deletedCount).toBe(1);
            expect(db.delete).toHaveBeenCalledWith('download_checkpoints', staleCheckpoint.id);
            expect(db.delete).not.toHaveBeenCalledWith('download_checkpoints', freshCheckpoint.id);
        });

        it('should return 0 when no stale checkpoints', async () => {
            const freshCheckpoint = {
                id: 'checkpoint-fresh',
                url: 'https://example.com/fresh',
                timestamp: Date.now() - 1000
            };

            db.getAll.mockResolvedValue([freshCheckpoint]);

            const deletedCount = await DownloadCheckpoint.cleanupStale();

            expect(deletedCount).toBe(0);
        });

        it('should return 0 on error', async () => {
            db.getAll.mockRejectedValue(new Error('Database error'));

            const deletedCount = await DownloadCheckpoint.cleanupStale();

            expect(deletedCount).toBe(0);
        });
    });

    describe('getResumeInfo', () => {
        it('should return resume info for valid checkpoint', async () => {
            const checkpoint = {
                url: TEST_URL,
                timestamp: Date.now() - 1000,
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 1
            };

            db.get.mockResolvedValue(checkpoint);

            const result = await DownloadCheckpoint.getResumeInfo(TEST_URL);

            expect(result).toEqual({
                canResume: true,
                bytesReceived: 1024,
                totalBytes: 2048,
                progress: 50,
                retryCount: 1,
                lastAttempt: checkpoint.timestamp
            });
        });

        it('should return null for non-resumable checkpoint', async () => {
            const staleCheckpoint = {
                url: TEST_URL,
                timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000),
                bytesReceived: 1024,
                totalBytes: 2048,
                retryCount: 0
            };

            db.get.mockResolvedValue(staleCheckpoint);

            const result = await DownloadCheckpoint.getResumeInfo(TEST_URL);

            expect(result).toBeNull();
        });

        it('should return null for non-existent checkpoint', async () => {
            db.get.mockResolvedValue(null);

            const result = await DownloadCheckpoint.getResumeInfo(TEST_URL);

            expect(result).toBeNull();
        });

        it('should calculate progress correctly', async () => {
            const checkpoint = {
                url: TEST_URL,
                timestamp: Date.now() - 1000,
                bytesReceived: 500,
                totalBytes: 1000,
                retryCount: 0
            };

            db.get.mockResolvedValue(checkpoint);

            const result = await DownloadCheckpoint.getResumeInfo(TEST_URL);

            expect(result.progress).toBe(50);
        });

        it('should return null when totalBytes is unknown (not resumable)', async () => {
            // A checkpoint with unknown totalBytes is considered not resumable
            // because we can't calculate progress or verify completion
            const checkpoint = {
                url: TEST_URL,
                timestamp: Date.now() - 1000,
                bytesReceived: 1024,
                totalBytes: null,
                retryCount: 0
            };

            db.get.mockResolvedValue(checkpoint);

            const result = await DownloadCheckpoint.getResumeInfo(TEST_URL);

            // When totalBytes is unknown, canResume returns false, so getResumeInfo returns null
            expect(result).toBeNull();
        });
    });

    describe('URL ID generation', () => {
        it('should generate consistent IDs for the same URL', async () => {
            db.get.mockResolvedValue(null);

            // Call twice with same URL
            await DownloadCheckpoint.getCheckpoint('https://example.com/test');
            await DownloadCheckpoint.getCheckpoint('https://example.com/test');

            // Both calls should use the same ID
            const firstId = db.get.mock.calls[0][1];
            const secondId = db.get.mock.calls[1][1];
            expect(firstId).toBe(secondId);
        });

        it('should generate different IDs for different URLs', async () => {
            db.get.mockResolvedValue(null);

            await DownloadCheckpoint.getCheckpoint('https://example.com/test1');
            await DownloadCheckpoint.getCheckpoint('https://example.com/test2');

            const firstId = db.get.mock.calls[0][1];
            const secondId = db.get.mock.calls[1][1];
            expect(firstId).not.toBe(secondId);
        });
    });
});