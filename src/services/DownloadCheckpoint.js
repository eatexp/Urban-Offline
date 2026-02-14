/**
 * DownloadCheckpoint Service - Resume capability for large downloads
 *
 * Persists download progress to IndexedDB for resume after interruption.
 * Supports both AI models and content packs with checkpoint metadata.
 *
 * Compliance: .clinerules §1 - "Implement progressive download with resume capability"
 */

import { db } from './db';
import { createLogger } from '../utils/logger';

const log = createLogger('DownloadCheckpoint');

// IndexedDB store name
const CHECKPOINT_STORE = 'download_checkpoints';

// Default checkpoint expiry (7 days)
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Maximum retry attempts before giving up
const MAX_RETRY_COUNT = 3;

/**
 * Download Checkpoint Service
 */
export const DownloadCheckpoint = {
    /**
     * Save a download checkpoint
     * @param {Object} checkpoint - Checkpoint data
     * @param {string} checkpoint.url - Download URL
     * @param {number} checkpoint.bytesReceived - Bytes downloaded so far
     * @param {number} checkpoint.totalBytes - Total expected bytes
     * @param {string} [checkpoint.checksum] - Expected SHA-256 checksum
     * @param {string} [checkpoint.etag] - HTTP ETag header
     * @param {string} [checkpoint.lastModified] - HTTP Last-Modified header
     * @param {string} checkpoint.modelId - Associated model/content ID
     * @param {string} checkpoint.type - 'model' | 'content_pack'
     * @returns {Promise<void>}
     */
    async saveCheckpoint(checkpoint) {
        try {
            // Validate required fields
            if (!checkpoint.url || typeof checkpoint.bytesReceived !== 'number') {
                throw new Error('Invalid checkpoint: url and bytesRequired required');
            }

            const id = this._generateId(checkpoint.url);
            const data = {
                id,
                url: checkpoint.url,
                bytesReceived: checkpoint.bytesReceived,
                totalBytes: checkpoint.totalBytes || null,
                checksum: checkpoint.checksum || null,
                etag: checkpoint.etag || null,
                lastModified: checkpoint.lastModified || null,
                modelId: checkpoint.modelId,
                type: checkpoint.type || 'unknown',
                retryCount: checkpoint.retryCount || 0,
                timestamp: Date.now(),
                version: 1 // For future migration support
            };

            await db.put(CHECKPOINT_STORE, data);
            log.debug('Checkpoint saved', {
                id,
                bytesReceived: data.bytesReceived,
                totalBytes: data.totalBytes
            });

        } catch (error) {
            log.error('Failed to save checkpoint', error);
            throw error;
        }
    },

    /**
     * Retrieve a checkpoint by URL
     * @param {string} url - Download URL
     * @returns {Promise<Object|null>} - Checkpoint data or null if not found
     */
    async getCheckpoint(url) {
        try {
            const id = this._generateId(url);
            const checkpoint = await db.get(CHECKPOINT_STORE, id);

            if (!checkpoint) {
                return null;
            }

            log.debug('Checkpoint retrieved', {
                id,
                bytesReceived: checkpoint.bytesReceived,
                age: Date.now() - checkpoint.timestamp
            });

            return checkpoint;

        } catch (error) {
            log.error('Failed to retrieve checkpoint', error);
            return null;
        }
    },

    /**
     * Delete a checkpoint after successful download
     * @param {string} url - Download URL
     * @returns {Promise<void>}
     */
    async deleteCheckpoint(url) {
        try {
            const id = this._generateId(url);
            await db.delete(CHECKPOINT_STORE, id);
            log.debug('Checkpoint deleted', { id });

        } catch (error) {
            log.error('Failed to delete checkpoint', error);
            // Non-critical error, don't throw
        }
    },

    /**
     * List all active checkpoints
     * @returns {Promise<Array>} - Array of checkpoint objects
     */
    async listCheckpoints() {
        try {
            const checkpoints = await db.getAll(CHECKPOINT_STORE);
            return checkpoints || [];

        } catch (error) {
            log.error('Failed to list checkpoints', error);
            return [];
        }
    },

    /**
     * Check if a checkpoint is stale (expired)
     * @param {Object} checkpoint - Checkpoint data
     * @param {number} maxAgeMs - Maximum age in milliseconds
     * @returns {boolean} - True if checkpoint is stale
     */
    isStale(checkpoint, maxAgeMs = DEFAULT_MAX_AGE_MS) {
        if (!checkpoint || !checkpoint.timestamp) {
            return true;
        }

        const age = Date.now() - checkpoint.timestamp;
        const isExpired = age > maxAgeMs;

        if (isExpired) {
            log.info('Checkpoint is stale', {
                id: checkpoint.id,
                age: Math.round(age / 1000 / 60) + ' minutes',
                maxAge: Math.round(maxAgeMs / 1000 / 60) + ' minutes'
            });
        }

        return isExpired;
    },

    /**
     * Check if a checkpoint can be resumed
     * @param {Object} checkpoint - Checkpoint data
     * @returns {boolean} - True if resume is possible
     */
    canResume(checkpoint) {
        if (!checkpoint) {
            return false;
        }

        // Check if stale
        if (this.isStale(checkpoint)) {
            return false;
        }

        // Check if already complete
        if (checkpoint.bytesReceived >= checkpoint.totalBytes) {
            return false;
        }

        // Check retry count
        if (checkpoint.retryCount >= MAX_RETRY_COUNT) {
            log.warn('Max retry count exceeded', {
                id: checkpoint.id,
                retryCount: checkpoint.retryCount
            });
            return false;
        }

        return true;
    },

    /**
     * Increment retry count for a checkpoint
     * @param {string} url - Download URL
     * @returns {Promise<number>} - New retry count
     */
    async incrementRetry(url) {
        try {
            const checkpoint = await this.getCheckpoint(url);
            if (!checkpoint) {
                return 1;
            }

            checkpoint.retryCount = (checkpoint.retryCount || 0) + 1;
            checkpoint.timestamp = Date.now(); // Update timestamp on retry
            await this.saveCheckpoint(checkpoint);

            log.info('Retry count incremented', {
                id: checkpoint.id,
                retryCount: checkpoint.retryCount
            });

            return checkpoint.retryCount;

        } catch (error) {
            log.error('Failed to increment retry count', error);
            return 0;
        }
    },

    /**
     * Update checkpoint bytes received
     * @param {string} url - Download URL
     * @param {number} bytesReceived - New byte count
     * @returns {Promise<void>}
     */
    async updateProgress(url, bytesReceived) {
        try {
            const checkpoint = await this.getCheckpoint(url);
            if (!checkpoint) {
                return;
            }

            checkpoint.bytesReceived = bytesReceived;
            // Don't update timestamp on progress (only on retry/save)
            await this.saveCheckpoint(checkpoint);

        } catch (error) {
            log.error('Failed to update checkpoint progress', error);
            // Non-critical, don't throw
        }
    },

    /**
     * Clean up stale checkpoints
     * @param {number} maxAgeMs - Maximum age before cleanup
     * @returns {Promise<number>} - Number of checkpoints deleted
     */
    async cleanupStale(maxAgeMs = DEFAULT_MAX_AGE_MS) {
        try {
            const checkpoints = await this.listCheckpoints();
            let deleted = 0;

            for (const checkpoint of checkpoints) {
                if (this.isStale(checkpoint, maxAgeMs)) {
                    await this.deleteCheckpoint(checkpoint.url);
                    deleted++;
                }
            }

            log.info('Stale checkpoint cleanup complete', { deleted });
            return deleted;

        } catch (error) {
            log.error('Failed to cleanup stale checkpoints', error);
            return 0;
        }
    },

    /**
     * Get resume information for UI display
     * @param {string} url - Download URL
     * @returns {Promise<Object|null>} - Resume info or null
     */
    async getResumeInfo(url) {
        const checkpoint = await this.getCheckpoint(url);

        if (!this.canResume(checkpoint)) {
            return null;
        }

        const progress = checkpoint.totalBytes
            ? Math.round((checkpoint.bytesReceived / checkpoint.totalBytes) * 100)
            : 0;

        return {
            canResume: true,
            bytesReceived: checkpoint.bytesReceived,
            totalBytes: checkpoint.totalBytes,
            progress,
            retryCount: checkpoint.retryCount,
            lastAttempt: checkpoint.timestamp
        };
    },

    /**
     * Generate a unique ID for a URL
     * @private
     */
    _generateId(url) {
        // Simple hash for URL to ID
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `checkpoint-${Math.abs(hash).toString(16)}`;
    }
};

export default DownloadCheckpoint;