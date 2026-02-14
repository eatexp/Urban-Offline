/**
 * RangeFetcher Utility - HTTP Range request support for resumable downloads
 *
 * Provides fetch with HTTP Range header support for resuming interrupted downloads.
 * Falls back to full download if Range requests are not supported by the server.
 *
 * Compliance: .clinerules §1 - "Implement progressive download with resume capability"
 */

import { createLogger } from './logger';

const log = createLogger('RangeFetcher');

/**
 * Check if a server supports HTTP Range requests
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} - True if Range requests are supported
 */
export async function supportsRangeRequests(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            // Don't follow redirects for HEAD request
            redirect: 'manual'
        });

        // Check for Accept-Ranges header
        const acceptRanges = response.headers.get('accept-ranges');
        if (acceptRanges && acceptRanges.includes('bytes')) {
            log.debug('Server supports Range requests', { url });
            return true;
        }

        // Some servers don't send Accept-Ranges but still support it
        // Check if it's a 200 OK (implies might support range)
        if (response.status === 200) {
            log.debug('Server may support Range requests (no Accept-Ranges header)', { url });
            return true; // Optimistically assume support
        }

        log.debug('Server does not support Range requests', {
            url,
            status: response.status,
            acceptRanges
        });
        return false;

    } catch (error) {
        log.warn('Failed to check Range support, assuming not supported', { url, error: error.message });
        return false;
    }
}

/**
 * Fetch with HTTP Range header
 * @param {string} url - URL to fetch
 * @param {number} startByte - Start byte position (inclusive)
 * @param {number} [endByte] - End byte position (inclusive), null for end of file
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithRange(url, startByte, endByte = null) {
    const rangeHeader = endByte !== null
        ? `bytes=${startByte}-${endByte}`
        : `bytes=${startByte}-`;

    log.debug('Fetching with Range header', { url, range: rangeHeader });

    const response = await fetch(url, {
        headers: {
            'Range': rangeHeader
        }
    });

    // Check if server accepted the Range request
    if (response.status === 206) {
        log.debug('Range request successful (206 Partial Content)', {
            url,
            range: response.headers.get('content-range')
        });
        return response;
    }

    if (response.status === 200) {
        // Server ignored Range header and sent full content
        log.warn('Server ignored Range header, received full content', { url });
        return response;
    }

    if (response.status === 416) {
        // Range Not Satisfiable - likely means file changed or range is invalid
        log.error('Range Not Satisfiable (416)', { url, startByte, endByte });
        throw new RangeError('Range Not Satisfiable - file may have changed');
    }

    // Other error
    throw new Error(`Range request failed: ${response.status} ${response.statusText}`);
}

/**
 * Fetch with automatic resume support
 *
 * If a checkpoint exists, attempts to resume from that position using Range requests.
 * Falls back to full download if resume is not possible.
 *
 * @param {string} url - URL to fetch
 * @param {Object} [checkpoint] - Checkpoint data from DownloadCheckpoint service
 * @param {number} checkpoint.bytesReceived - Bytes already downloaded
 * @param {string} [checkpoint.etag] - ETag for consistency check
 * @param {string} [checkpoint.lastModified] - Last-Modified for consistency check
 * @param {Object} options - Additional options
 * @param {Function} options.onProgress - Progress callback (bytesReceived, totalBytes)
 * @returns {Promise<Response>} - Fetch response (may be partial or full)
 */
export async function fetchResumable(url, checkpoint = null, options = {}) {
    const { onProgress = null } = options;

    // No checkpoint or can't resume - do full fetch
    if (!checkpoint || checkpoint.bytesReceived <= 0) {
        log.debug('No checkpoint or zero bytes, performing full fetch', { url });
        return fetch(url);
    }

    // Check if we should attempt resume
    const canResume = await supportsRangeRequests(url);
    if (!canResume) {
        log.info('Server does not support Range requests, performing full fetch', { url });
        return fetch(url);
    }

    try {
        // Attempt to resume from checkpoint position
        const startByte = checkpoint.bytesReceived;
        log.info('Attempting to resume download', {
            url,
            startByte,
            totalBytes: checkpoint.totalBytes
        });

        const response = await fetchWithRange(url, startByte);

        // Verify we got partial content
        if (response.status === 206) {
            // Check Content-Range header for sanity
            const contentRange = response.headers.get('content-range');
            const contentLength = response.headers.get('content-length');

            log.info('Resume successful', {
                url,
                contentRange,
                contentLength
            });

            // Wrap response with progress tracking
            if (onProgress) {
                return wrapResponseWithProgress(response, startByte, checkpoint.totalBytes, onProgress);
            }

            return response;
        }

        // Server sent full content instead of partial
        log.warn('Resume failed - server sent full content, restarting download', { url });
        return response;

    } catch (error) {
        if (error instanceof RangeError) {
            // 416 Range Not Satisfiable - file likely changed
            log.warn('Resume failed - file changed, restarting download', { url, error: error.message });
            return fetch(url);
        }

        // Other error - try full fetch as fallback
        log.error('Resume failed, falling back to full fetch', { url, error: error.message });
        return fetch(url);
    }
}

/**
 * Wrap a response with progress tracking
 * @private
 */
function wrapResponseWithProgress(response, startByte, totalBytes, onProgress) {
    const reader = response.body.getReader();
    let receivedBytes = startByte;

    const stream = new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }

                    receivedBytes += value.length;

                    // Report progress
        try {
            onProgress(receivedBytes, totalBytes);
        } catch (_e) {
            // Ignore progress callback errors
        }

                    controller.enqueue(value);
                    push();
                }).catch(error => {
                    controller.error(error);
                });
            }

            push();
        },

        cancel() {
            reader.cancel();
        }
    });

    // Return new response with wrapped stream
    return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
}

/**
 * Create a download stream with checkpoint saving
 *
 * Automatically saves checkpoint progress during download for resume capability.
 *
 * @param {string} url - URL to download
 * @param {Object} checkpoint - Checkpoint object from DownloadCheckpoint service
 * @param {Object} options - Options
 * @param {Function} options.onProgress - Progress callback (received, total)
 * @param {Function} options.onCheckpoint - Callback to save checkpoint (bytesReceived) => Promise
 * @param {number} options.checkpointInterval - Bytes between checkpoints (default: 1MB)
 * @returns {Promise<Response>} - Response with checkpoint-aware stream
 */
export async function createCheckpointedStream(url, checkpoint, options = {}) {
    const {
        onProgress = null,
        onCheckpoint = null,
        checkpointInterval = 1024 * 1024 // 1MB
    } = options;

    const response = await fetchResumable(url, checkpoint, { onProgress });

    if (!onCheckpoint) {
        return response;
    }

    // Wrap stream with checkpoint saving
    const reader = response.body.getReader();
    const startByte = checkpoint?.bytesReceived || 0;
    let receivedBytes = startByte;
    let lastCheckpoint = startByte;

    const stream = new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(async ({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }

                    receivedBytes += value.length;

                    // Save checkpoint at intervals
                    if (receivedBytes - lastCheckpoint >= checkpointInterval) {
                        try {
                            await onCheckpoint(receivedBytes);
                            lastCheckpoint = receivedBytes;
                        } catch (e) {
                            log.warn('Failed to save checkpoint', e);
                            // Continue download even if checkpoint fails
                        }
                    }

                    controller.enqueue(value);
                    push();
                }).catch(error => {
                    controller.error(error);
                });
            }

            push();
        },

        cancel() {
            reader.cancel();
        }
    });

    return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
}

/**
 * Get Content-Length from URL (if available)
 * @param {string} url - URL to check
 * @returns {Promise<number|null>} - Content length or null
 */
export async function getContentLength(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const length = response.headers.get('content-length');
        return length ? parseInt(length, 10) : null;
    } catch (error) {
        log.warn('Failed to get content length', { url, error: error.message });
        return null;
    }
}

export default {
    supportsRangeRequests,
    fetchWithRange,
    fetchResumable,
    createCheckpointedStream,
    getContentLength
};