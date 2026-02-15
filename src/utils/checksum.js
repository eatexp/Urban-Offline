/**
 * Checksum Utility - SHA-256 hashing for data integrity verification
 *
 * Provides streaming and non-streaming checksum computation for browser environments.
 * Used by AIModelManager and ContentPackManager to validate downloaded assets.
 *
 * Compliance: .clinerules §1 - "Always validate model checksums before activation (SHA-256 verification)"
 */

import { createLogger } from './logger';

const log = createLogger('Checksum');

/**
 * Compute SHA-256 checksum of a Blob/File/ArrayBuffer
 * @param {Blob|File|ArrayBuffer|Uint8Array} data - Data to hash
 * @returns {Promise<string>} - Hex-encoded SHA-256 hash
 */
export async function computeChecksum(data) {
    try {
        let buffer;

        // Normalize input to ArrayBuffer
        // Use Object.prototype.toString for robust type checking that works in jsdom
        const objectType = Object.prototype.toString.call(data);
        const isArrayBuffer = objectType === '[object ArrayBuffer]';
        const isUint8Array = objectType === '[object Uint8Array]';
        
        // Check for Blob-like objects (including jsdom's Blob)
        const isBlobLike = data && 
            typeof data === 'object' && 
            (objectType === '[object Blob]' || 
             (typeof data.arrayBuffer === 'function' && typeof data.size === 'number'));
        
        // Check for File-like objects
        const isFileLike = isBlobLike && data.name !== undefined;

        if (isBlobLike || isFileLike) {
            // Handle both native Blob.arrayBuffer() and jsdom's implementation
            if (typeof data.arrayBuffer === 'function') {
                buffer = await data.arrayBuffer();
            } else if (data._buffer) {
                // jsdom internal buffer access
                buffer = data._buffer;
            } else {
                throw new Error('Blob/File object does not support arrayBuffer()');
            }
        } else if (isUint8Array) {
            buffer = data.buffer;
        } else if (isArrayBuffer) {
            buffer = data;
        } else {
            throw new Error('Unsupported data type. Expected Blob, File, ArrayBuffer, or Uint8Array');
        }

        // Use Web Crypto API for SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        log.debug('Checksum computed', { length: buffer.byteLength, hash: hashHex.slice(0, 16) + '...' });
        return hashHex;

    } catch (error) {
        log.error('Checksum computation failed', error);
        throw error;
    }
}

/**
 * Verify data against expected checksum
 * @param {Blob|File|ArrayBuffer|Uint8Array} data - Data to verify
 * @param {string} expectedHash - Expected SHA-256 hash (hex string)
 * @returns {Promise<boolean>} - True if checksum matches
 */
export async function verifyChecksum(data, expectedHash) {
    if (!expectedHash) {
        log.warn('No expected checksum provided, skipping verification');
        return true; // Allow if no checksum specified (backward compatibility)
    }

    // Normalize expected hash (remove 'sha256:' prefix if present)
    const normalizedExpected = expectedHash.replace(/^sha256:/i, '').toLowerCase().trim();

    if (!/^[a-f0-9]{64}$/.test(normalizedExpected)) {
        log.error('Invalid checksum format', { expected: expectedHash });
        return false;
    }

    const actualHash = await computeChecksum(data);
    const matches = actualHash === normalizedExpected;

    log.info('Checksum verification result', {
        matches,
        expected: normalizedExpected.slice(0, 16) + '...',
        actual: actualHash.slice(0, 16) + '...'
    });

    return matches;
}

/**
 * Create a streaming checksum calculator for large files
 * Allows incremental hashing without loading entire file into memory
 *
 * @param {Function} onProgress - Optional progress callback (bytesProcessed, totalBytes)
 * @returns {Object} - Streaming checksum interface
 */
export function createStreamingChecksum(onProgress = null) {
    // Use a simple chunk-based approach since Web Crypto doesn't support streaming digest
    const chunks = [];
    let totalBytes = 0;
    let isFinalized = false;

    return {
        /**
         * Add a chunk of data to the checksum computation
         * @param {Uint8Array} chunk - Data chunk
         */
        update(chunk) {
            if (isFinalized) {
                throw new Error('Cannot update after finalization');
            }
            chunks.push(chunk);
            totalBytes += chunk.length;

            if (onProgress) {
                try {
                    onProgress(totalBytes, null); // Total unknown in streaming mode
                } catch (_e) {
                    // Ignore progress callback errors
                }
            }
        },

        /**
         * Finalize and compute the checksum
         * @returns {Promise<string>} - Hex-encoded SHA-256 hash
         */
        async finalize() {
            if (isFinalized) {
                throw new Error('Already finalized');
            }
            isFinalized = true;

            // Concatenate all chunks
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            return computeChecksum(combined);
        },

        /**
         * Get current byte count
         * @returns {number} - Bytes processed so far
         */
        getBytesProcessed() {
            return totalBytes;
        },

        /**
         * Reset the calculator for reuse
         */
        reset() {
            chunks.length = 0;
            totalBytes = 0;
            isFinalized = false;
        }
    };
}

/**
 * Compute checksum of a fetch Response stream
 * Processes the stream chunk by chunk to avoid memory issues with large files
 *
 * @param {Response} response - Fetch response object
 * @param {Function} onProgress - Progress callback (bytesProcessed, totalBytes)
 * @returns {Promise<{hash: string, blob: Blob}>} - Hash and collected blob
 */
export async function computeChecksumFromStream(response, onProgress = null) {
    const reader = response.body.getReader();
    const streamingHash = createStreamingChecksum(onProgress);
    const chunks = [];

    // Get total size if available
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Add to checksum calculation
            streamingHash.update(value);

            // Collect for blob creation
            chunks.push(value);

            // Report progress
            if (onProgress && totalBytes) {
                try {
                    onProgress(streamingHash.getBytesProcessed(), totalBytes);
                } catch (_e) {
                    // Ignore progress callback errors
                }
            }
        }

        // Finalize checksum
        const hash = await streamingHash.finalize();

        // Reconstruct blob
        const blob = new Blob(chunks);

        log.info('Stream checksum complete', {
            hash: hash.slice(0, 16) + '...',
            bytes: streamingHash.getBytesProcessed()
        });

        return { hash, blob };

    } catch (error) {
        log.error('Stream checksum failed', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}

/**
 * Format a checksum with optional prefix
 * @param {string} hash - Hex hash string
 * @param {boolean} includePrefix - Whether to include 'sha256:' prefix
 * @returns {string} - Formatted checksum
 */
export function formatChecksum(hash, includePrefix = false) {
    const cleanHash = hash.replace(/^sha256:/i, '').toLowerCase().trim();
    return includePrefix ? `sha256:${cleanHash}` : cleanHash;
}

/**
 * Validate checksum format
 * @param {string} checksum - Checksum string to validate
 * @returns {boolean} - True if valid SHA-256 format
 */
export function isValidChecksumFormat(checksum) {
    if (!checksum || typeof checksum !== 'string') {
        return false;
    }
    const clean = checksum.replace(/^sha256:/i, '').trim();
    return /^[a-f0-9]{64}$/i.test(clean);
}

export default {
    computeChecksum,
    verifyChecksum,
    createStreamingChecksum,
    computeChecksumFromStream,
    formatChecksum,
    isValidChecksumFormat
};