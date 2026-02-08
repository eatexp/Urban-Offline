/**
 * Haptic feedback utility for emergency UI interactions
 * Provides consistent haptic/vibration feedback across platforms
 * 
 * Usage:
 *   import { triggerHaptic } from '../utils/haptics';
 *   await triggerHaptic('heavy');
 */

const VIBRATION_PATTERNS = {
    light: 10,
    medium: 20,
    heavy: [50, 30, 50], // Pattern: on, off, on
    error: [50, 100, 50, 100, 50]
};

/**
 * Trigger haptic feedback
 * Uses Capacitor Haptics on native platforms, falls back to navigator.vibrate on web
 * 
 * @param {'light' | 'medium' | 'heavy' | 'error'} type - Haptic intensity type
 * @returns {Promise<void>}
 */
export const triggerHaptic = async (type = 'heavy') => {
    try {
        // Try Capacitor Haptics first (native iOS/Android)
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

        const styleMap = {
            light: ImpactStyle.Light,
            medium: ImpactStyle.Medium,
            heavy: ImpactStyle.Heavy
        };

        // For 'error' type, use notification instead of impact
        if (type === 'error') {
            await Haptics.notification({ type: 'ERROR' });
        } else {
            await Haptics.impact({ style: styleMap[type] || ImpactStyle.Heavy });
        }
    } catch (_e) {
        // Capacitor not available - use web fallback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(VIBRATION_PATTERNS[type] || VIBRATION_PATTERNS.heavy);
        }
        // Silently fail on platforms without vibration support (desktop)
    }
};

/**
 * Handle an action with haptic feedback
 * Wraps any action function with haptic feedback before execution
 * 
 * @param {Function} action - The action to perform after haptic feedback
 * @param {'light' | 'medium' | 'heavy'} type - Haptic intensity type
 * @returns {Promise<void>}
 */
export const withHapticFeedback = async (action, type = 'heavy') => {
    await triggerHaptic(type);
    return action();
};
