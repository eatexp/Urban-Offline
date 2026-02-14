/**
 * HapticsService - Centralized haptic feedback controller
 * 
 * Provides safe wrappers around Capacitor Haptics with platform checks.
 * Ensures haptics only run on supported devices to avoid console warnings
 * or unwanted behavior on desktop.
 */

// Re-export Capacitor Haptics types directly for proper bundler support
import {
    Haptics as CapacitorHaptics,
    ImpactStyle,
    NotificationType
} from '@capacitor/haptics';
import { isNativeMobile } from '../utils/platform';

// Re-export types directly from Capacitor
export { ImpactStyle, NotificationType };

export const Haptics = CapacitorHaptics;

// Create a safe wrapper that checks platform before executing
const safeHaptics = async (fn) => {
    try {
        if (isNativeMobile()) {
            await fn();
        }
    } catch (error) {
        // Silently fail for haptics - non-critical feature
        console.warn('Haptics error:', error);
    }
};

export const HapticsService = {
    // Re-export constants for easy access
    ImpactStyle,
    NotificationType,

    /**
     * Trigger a physical impact sensation
     * @param {ImpactStyle} style - Light, Medium, or Heavy
     */
    async impact(style = ImpactStyle.Medium) {
        await safeHaptics(() => Haptics.impact({ style }));
    },

    /**
     * Trigger a notification vibration (Success, Warning, Error)
     * @param {NotificationType} type
     */
    async notification(type = NotificationType.Success) {
        await safeHaptics(() => Haptics.notification({ type }));
    },

    /**
     * Trigger a selection/changed sensation
     * Good for sliders, toggles, scroll pickers
     */
    async selection() {
        await safeHaptics(() => Haptics.selectionStart());
    },

    /**
     * Manual vibration (simpler devices)
     * @param {number} duration - ms (default 300)
     */
    async vibrate(duration = 300) {
        await safeHaptics(() => Haptics.vibrate({ duration }));
    },

    /**
     * Emergency SOS Pattern
     * SOS: ... --- ... (3 short, 3 long, 3 short)
     */
    async emergencyPattern() {
        if (!isNativeMobile()) return;

        try {
            // Short
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(r => setTimeout(r, 200));
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(r => setTimeout(r, 200));
            await Haptics.impact({ style: ImpactStyle.Heavy });

            await new Promise(r => setTimeout(r, 500));

            // Long (simulated with vibration)
            await Haptics.vibrate({ duration: 400 });
            await new Promise(r => setTimeout(r, 500));
            await Haptics.vibrate({ duration: 400 });
            await new Promise(r => setTimeout(r, 500));
            await Haptics.vibrate({ duration: 400 });

            await new Promise(r => setTimeout(r, 500));

            // Short
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(r => setTimeout(r, 200));
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(r => setTimeout(r, 200));
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            console.warn('Emergency haptics failed', e);
        }
    }
};

export default HapticsService;
