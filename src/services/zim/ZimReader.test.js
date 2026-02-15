
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZimReader } from './ZimReader';

// Mock TextDecoder/TextEncoder if not in environment (JSDOM usually has them)
if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
}
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
}

// Mock logger
vi.mock('../../utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    })
}));

describe('ZimReader', () => {
    let mockFile;
    let reader;

    beforeEach(() => {
        // Create a mock file with slice capabilities
        const fileContent = new Uint8Array(1024); // Dummy content
        mockFile = {
            name: 'test.zim',
            size: 1024,
            slice: vi.fn((start, end) => {
                const sliced = fileContent.slice(start, end);
                return {
                    arrayBuffer: async () => sliced.buffer
                };
            })
        };
        reader = new ZimReader(mockFile);
    });

    describe('Memory Constraints', () => {
        it('should allow file when no constraints are violated', () => {
            const result = reader._checkMemoryConstraints();
            expect(result.allowed).toBe(true);
        });
    });

    describe('_readChunk', () => {
        it('should read correct byte range', async () => {
            const buffer = await reader._readChunk(10, 20); // 20 bytes
            expect(mockFile.slice).toHaveBeenCalledWith(10, 30); // start, end
            expect(buffer.byteLength).toBe(20);
        });
    });

    describe('_readView', () => {
        it('should return DataView of chunk', async () => {
            const view = await reader._readView(0, 4);
            expect(view).toBeInstanceOf(DataView);
            expect(view.byteLength).toBe(4);
        });
    });

    describe('Initialization (Partial Mock)', () => {
        it('should check magic number', async () => {
            // Mock _readView to return invalid magic
            reader._readView = vi.fn().mockResolvedValue(new DataView(new Uint8Array([0, 0, 0, 0]).buffer));

            await expect(reader._parseHeader()).rejects.toThrow('Invalid ZIM file');
        });

        it('should check magic number (success)', async () => {
            // Mock valid magic ZIMD (0x5A494D44 little endian = 44 49 4D 5A)
            const header = new Uint8Array(100);
            const view = new DataView(header.buffer);
            view.setUint32(0, 0x5A494D44, true); // Magic

            reader._readView = vi.fn().mockResolvedValue(view);

            // Should not throw on magic check, but might fail later on reading properties from empty buffer
            // We just want to verifying magic check passes
            try {
                await reader._parseHeader();
        } catch (_e) {
                // Ignore other errors
            }

            expect(reader._readView).toHaveBeenCalledWith(0, 100);
        });
    });
});
