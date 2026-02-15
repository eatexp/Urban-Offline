
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CapacitorPMTilesSource } from './CapacitorPMTilesSource';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        convertFileSrc: vi.fn(uri => `https://localhost/_capacitor_file_${uri}`)
    }
}));

describe('CapacitorPMTilesSource', () => {
    let source;
    const TEST_URI = 'file:///path/to/map.pmtiles';

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        source = new CapacitorPMTilesSource(TEST_URI);
    });

    it('should initialize with converted URL', () => {
        expect(source.networkUrl).toContain('https://localhost/_capacitor_file_');
    });

    it('should make Range request', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 206,
            arrayBuffer: async () => new ArrayBuffer(100)
        });

        await source.getBytes(0, 100);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://localhost'),
            expect.objectContaining({
                headers: { 'Range': 'bytes=0-99' }
            })
        );
    });

    it('should handle 206 Partial Content correctly', async () => {
        const buffer = new Uint8Array(100).fill(1).buffer;
        global.fetch.mockResolvedValue({
            ok: true,
            status: 206,
            arrayBuffer: async () => buffer
        });

        const result = await source.getBytes(0, 100);
        expect(result.byteLength).toBe(100);
    });

    it('should accept small 200 OK responses', async () => {
        // 1KB buffer
        const buffer = new ArrayBuffer(1024);
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Map([['Content-Length', '1024']]),
            arrayBuffer: async () => buffer
        });

        const result = await source.getBytes(0, 100);
        // Should slice the result
        expect(result.byteLength).toBe(100);
    });

    it('should REJECT large 200 OK responses (OOM Protection)', async () => {
        // Mock large Content-Length header
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: {
                get: (name) => name === 'Content-Length' ? String(20 * 1024 * 1024) : null // 20MB
            },
            arrayBuffer: async () => new ArrayBuffer(0) // Won't be called
        });

        await expect(source.getBytes(0, 100))
            .rejects
            .toThrow('OOM Protection');
    });

    it('should throw on error status', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        });

        await expect(source.getBytes(0, 100)).rejects.toThrow('Failed to fetch bytes: 404');
    });
});
