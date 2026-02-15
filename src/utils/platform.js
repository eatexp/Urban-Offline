/**
 * Platform Detection Utilities
 * 
 * Centralized platform detection for cross-platform compatibility.
 * Used to handle platform-specific behaviors and feature availability.
 * 
 * All functions are wrapped in try-catch blocks to gracefully handle
 * unexpected environments and default to web mode (false) on errors.
 */

import { Capacitor } from '@capacitor/core';
import { createLogger } from './logger';

const log = createLogger('platform');

/**
 * Check if running in a native mobile environment (iOS/Android)
 * @returns {boolean}
 */
export const isNativeMobile = () => {
    try {
        return Capacitor.isNativePlatform() && !isWindowsNative();
    } catch (error) {
        log.warn('isNativeMobile detection failed, defaulting to web', error);
        return false;
    }
};

/**
 * Check if running in Windows native environment (Electron)
 * @returns {boolean}
 */
export const isWindowsNative = () => {
    try {
        // Check for Electron/Windows specific indicators
        if (typeof window === 'undefined') return false;
        
        // Electron sets window.electron or process.versions.electron
        const hasElectronAPI = !!(window.electron || window.process?.versions?.electron);
        
        // Windows platform check
        const isWindows = window.navigator?.platform?.includes('Win') || 
                          window.navigator?.userAgent?.includes('Windows');
        
        // Node.js context in renderer (Electron specific)
        const hasNodeContext = typeof window.require !== 'undefined';
        
        return hasElectronAPI || (isWindows && hasNodeContext);
    } catch (error) {
        log.warn('isWindowsNative detection failed, defaulting to web', error);
        return false;
    }
};

/**
 * Check if running in iOS native app
 * @returns {boolean}
 */
export const isIOSNative = () => {
    try {
        return Capacitor.getPlatform() === 'ios';
    } catch (error) {
        log.warn('isIOSNative detection failed, defaulting to web', error);
        return false;
    }
};

/**
 * Check if running in Android native app
 * @returns {boolean}
 */
export const isAndroidNative = () => {
    try {
        return Capacitor.getPlatform() === 'android';
    } catch (error) {
        log.warn('isAndroidNative detection failed, defaulting to web', error);
        return false;
    }
};

/**
 * Check if running in a WebView (iOS/Android WebView)
 * @returns {boolean}
 */
export const isWebView = () => {
    try {
        const userAgent = window.navigator?.userAgent || '';
        const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent);
        const isAndroidWebView = userAgent.includes('wv') || userAgent.includes('WebView');
        return isIOSWebView || isAndroidWebView;
    } catch (error) {
        log.warn('isWebView detection failed, defaulting to web', error);
        return false;
    }
};

/**
 * Check if running in a browser (not native)
 * @returns {boolean}
 */
export const isWeb = () => {
    try {
        return !Capacitor.isNativePlatform();
    } catch (error) {
        log.warn('isWeb detection failed, defaulting to true', error);
        return true;
    }
};

/**
 * Check if View Transitions API is supported and should be used
 * @returns {boolean}
 */
export const supportsViewTransitions = () => {
    try {
        // Windows native/Electron has inconsistent support
        if (isWindowsNative()) return false;
        
        // iOS Safari doesn't support View Transitions
        if (isIOSNative() || (isWeb() && /iPad|iPhone|iPod/.test(navigator.userAgent))) {
            return false;
        }
        
        // Android WebView has partial support that may flicker
        if (isWebView() && isAndroidNative()) return false;
        
        // Check for API availability
        return typeof document !== 'undefined' && !!document.startViewTransition;
    } catch (error) {
        log.warn('supportsViewTransitions detection failed, defaulting to false', error);
        return false;
    }
};

/**
 * Check if AI/ML features are available on current platform
 * @returns {{ available: boolean, reason: string|null }}
 */
export const checkAIAvailability = () => {
    try {
        // Windows native doesn't support transformers.js
        if (isWindowsNative()) {
            return {
                available: false,
                reason: 'AI features are not available in the Windows desktop app. Please use the web version at urbanoffline.app for AI-powered assistance.'
            };
        }
        
        // WebGL/WebGPU required for transformers.js
        if (typeof window === 'undefined') {
            return { available: false, reason: 'Server-side rendering not supported' };
        }
        
        const hasWebGL = !!window.WebGLRenderingContext;
        const hasWebGPU = 'gpu' in navigator;
        
        if (!hasWebGL && !hasWebGPU) {
            return {
                available: false,
                reason: 'Your device does not support the required graphics capabilities for AI features.'
            };
        }
        
        return { available: true, reason: null };
    } catch (error) {
        log.warn('checkAIAvailability failed, defaulting to unavailable', error);
        return { available: false, reason: 'Platform detection error' };
    }
};

/**
 * Get the best storage directory for current platform
 * @returns {string} Directory constant from @capacitor/filesystem
 */
export const getStorageDirectory = async () => {
    try {
        // Dynamically import to avoid issues in web environment
        const { Directory } = await import('@capacitor/filesystem');
        
        // Windows native works better with Data directory
        if (isWindowsNative()) {
            return Directory.Data;
        }
        
        // iOS/Android use Documents
        if (isNativeMobile()) {
            return Directory.Documents;
        }
        
        // Web doesn't use filesystem
        return null;
    } catch (error) {
        log.warn('getStorageDirectory failed, returning null', error);
        return null;
    }
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
    try {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
        log.warn('prefersReducedMotion detection failed, defaulting to false', error);
        return false;
    }
};

/**
 * Get platform information for debugging
 * @returns {Object}
 */
export const getPlatformInfo = () => {
    try {
        return {
            isNativeMobile: isNativeMobile(),
            isWindowsNative: isWindowsNative(),
            isIOSNative: isIOSNative(),
            isAndroidNative: isAndroidNative(),
            isWebView: isWebView(),
            isWeb: isWeb(),
            supportsViewTransitions: supportsViewTransitions(),
            aiAvailable: checkAIAvailability(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
        };
    } catch (error) {
        log.error('getPlatformInfo failed, returning safe defaults', error);
        return {
            isNativeMobile: false,
            isWindowsNative: false,
            isIOSNative: false,
            isAndroidNative: false,
            isWebView: false,
            isWeb: true,
            supportsViewTransitions: false,
            aiAvailable: { available: false, reason: 'Platform detection error' },
            userAgent: 'unknown',
            platform: 'unknown'
        };
    }
};

// Default export
export default {
    isNativeMobile,
    isWindowsNative,
    isIOSNative,
    isAndroidNative,
    isWebView,
    isWeb,
    supportsViewTransitions,
    checkAIAvailability,
    getStorageDirectory,
    prefersReducedMotion,
    getPlatformInfo
};
