import { Capacitor } from '@capacitor/core';

/**
 * CapacitorPMTilesSource
 * 
 * A custom Source adapter for the PMTiles library.
 * Adapts local filesystem paths to HTTP Range requests via the Capacitor Bridge.
 * 
 * CRITICAL PERFORMANCE NOTE:
 * We do NOT use Filesystem.readFile() because it loads the entire file into memory.
 * Instead, we use fetch() with the 'Range' header against the internal 
 * '/_capacitor_file_/' server. This allows the WebView to stream only the 
 * required bytes (header, directory, or tile) directly from disk.
 */
export class CapacitorPMTilesSource {
    constructor(uri) {
        this.uri = uri;
        // Check if we need to convert the path for the Capacitor Bridge
        // Capacitor.convertFileSrc handles the 'file://' -> 'https://.../_capacitor_file_/' conversion
        this.networkUrl = Capacitor.convertFileSrc(uri);
    }

    /**
     * Fetch a specific byte range from the archive.
     * @param {number} offset - Start byte
     * @param {number} length - Number of bytes to read
     * @returns {Promise<Uint8Array>}
     */
    async getBytes(offset, length) {
        const response = await fetch(this.networkUrl, {
            method: 'GET',
            headers: {
                'Range': `bytes=${offset}-${offset + length - 1}`
            }
        });

        if (!response.ok) {
            // 206 Partial Content is success for Range requests
            // 200 OK means the server ignored Range and sent the whole file (bad, but handles small files)
            if (response.status !== 206 && response.status !== 200) {
                throw new Error(`Failed to fetch bytes: ${response.status} ${response.statusText}`);
            }
        }

        const buffer = await response.arrayBuffer();

        // Safety Check: If server ignored Range and sent 200 OK (full file),
        // or sent more than requested, we MUST slice to the expected length.
        // The PMTiles decoder expects exact byte counts.
        if (buffer.byteLength > length) {
            // If we got the whole file (status 200), the offset might be 0 in the buffer
            // but we requested 'offset'. 
            // However, fetch(200) returns the WHOLE file starting at 0.
            // So we need to slice from 'offset' (if the buffer represents the whole file)
            // OR if it's just a chunk that's too large, we slice 0..length?

            // Case A: 206 Partial Content but too long fallback
            // Case B: 200 OK (Whole File)

            if (response.status === 200) {
                // We possess the entire file in memory (expensive, but we are here now).
                // We must return the slice requested.
                return new Uint8Array(buffer.slice(offset, offset + length));
            }

            // Case C: 206 but slightly larger (unlikely but possible with some servers)
            return new Uint8Array(buffer.slice(0, length));
        }

        return new Uint8Array(buffer);
    }

    /**
     * Unique key for caching (PMTiles internal)
     */
    getKey() {
        return this.uri;
    }
}
