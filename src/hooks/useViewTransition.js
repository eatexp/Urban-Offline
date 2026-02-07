import { useCallback } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useViewTransition');

/**
 * Hook to safely use the View Transitions API with a fallback and timeout.
 * @returns {Function} startViewTransition(callback)
 *
 * =============================================================================
 * BROWSER COMPATIBILITY
 * =============================================================================
 * - Chrome 111+: Full support
 * - Edge 111+: Full support
 * - Safari: No support (uses fallback - callback runs directly)
 * - Firefox: Behind flag only (uses fallback)
 * =============================================================================
 */

/**
 * Check if View Transitions should be used on current platform
 * Accounts for Windows Electron issues and accessibility preferences
 */
const shouldUseViewTransitions = () => {
    // Check for API availability
    if (typeof document === 'undefined' || !document.startViewTransition) {
        return false;
    }
    
    // Windows native (Electron) has inconsistent support - skip for safety
    const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isWindows = platform.includes('Win') || userAgent.includes('Windows');
    const isElectron = typeof window !== 'undefined' && !!(window.electron || window.process?.versions?.electron);
    
    if (isWindows && isElectron) {
        return false;
    }
    
    // Respect user's motion preferences (accessibility)
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }
    
    // iOS Safari doesn't support View Transitions
    if (/iPad|iPhone|iPod/.test(userAgent)) {
        return false;
    }
    
    return true;
};

export const useViewTransition = () => {
    return useCallback((callback) => {
        // Fallback if API not supported or platform doesn't handle it well
        if (!shouldUseViewTransitions()) {
            callback();
            return;
        }

        // Track callback invocation to prevent double execution and enable timeout forcing
        let callbackInvoked = false;

        const transitionTimeout = setTimeout(() => {
            if (!callbackInvoked) {
                log.warn('View transition timed out after 2s, forcing callback to prevent UI freeze');
                callbackInvoked = true;
                try {
                    callback();
                } catch (err) {
                    log.error('Error during forced timeout callback', err);
                }
            }
        }, 2000);

        try {
            const transition = document.startViewTransition(async () => {
                // Guard against double invocation (timeout may have fired)
                if (callbackInvoked) {
                    log.debug('Callback already invoked by timeout, skipping transition callback');
                    return;
                }
                callbackInvoked = true;
                clearTimeout(transitionTimeout);

                try {
                    await callback();
                } catch (err) {
                    log.error('Error during view transition callback', err);
                }
            });

            transition.finished.catch(err => {
                log.warn('View transition finished with error', err);
            }).finally(() => {
                clearTimeout(transitionTimeout);
            });
        } catch (error) {
            clearTimeout(transitionTimeout);
            log.error('View transition failed synchronously', error);
            if (!callbackInvoked) {
                callbackInvoked = true;
                callback(); // Ensure callback runs if startViewTransition fails synchronously
            }
        }
    }, []);
};

export default useViewTransition;
