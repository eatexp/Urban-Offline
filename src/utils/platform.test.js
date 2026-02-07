import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isWindowsNative, checkAIAvailability } from './platform';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: vi.fn(() => false),
        getPlatform: vi.fn(() => 'web')
    }
}));

describe('Platform Utilities', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('should detect Windows Native (Electron)', () => {
        vi.stubGlobal('window', {
            electron: true,
            navigator: { platform: 'Win32', userAgent: 'Windows' }
        });

        expect(isWindowsNative()).toBe(true);

        const aiCheck = checkAIAvailability();
        expect(aiCheck.available).toBe(false);
        expect(aiCheck.reason).toContain('not available in the Windows desktop app');
    });

    it('should return false for isWindowsNative on Web', () => {
        vi.stubGlobal('window', {
            navigator: { platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh)' }
        });

        expect(isWindowsNative()).toBe(false);
    });
});
