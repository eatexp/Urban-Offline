/**
 * HapticsService - Premium Haptic Feedback System
 * 
 * Provides platform-specific haptic feedback with fallbacks for web.
 * Optimized for iOS and Android native experiences.
 * 
 * Compliance: .clinerules §6 - Native haptics
 *             DESIGN_SYSTEM.md §4 - Haptic Feedback Map
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { isIOSNative, isAndroidNative, isNativeMobile } from '../utils/platform';
import { createLogger } from '../utils/logger';

const log = createLogger('HapticsService');

// Platform-specific vibration patterns (Android)
const VIBRATION_PATTERNS = {
  // Selection: Short, precise
  selection: [0, 20],
  
  // Light impact: Subtle feedback
  light: [0, 30],
  
  // Medium impact: Standard feedback
  medium: [0, 50],
  
  // Heavy impact: Emphasis
  heavy: [0, 80],
  
  // Success: Positive confirmation
  success: [0, 50, 100, 50],
  
  // Warning: Caution alert
  warning: [0, 100, 50, 100, 50, 100],
  
  // Error: Negative feedback
  error: [0, 150, 50, 150],
  
  // Emergency: Urgent attention
  emergency: [0, 200, 100, 200, 100, 200]
};

// iOS-specific haptic styles
const IOS_PATTERNS = {
  selection: ImpactStyle.Light,
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error
};

/**
 * Haptics Service - Unified interface for all platforms
 */
export const HapticsService = {
  _isSupported: null,
  _hasNativeHaptics: false,
  _lastVibrationTime: 0,
  _vibrationDebounceMs: 50,

  /**
   * Initialize haptics service
   */
  async init() {
    if (this._isSupported !== null) return this._isSupported;

    try {
      if (!isNativeMobile()) {
        log.debug('Haptics not available - web platform');
        this._isSupported = false;
        return false;
      }

      // Check if haptics plugin is available
      await Haptics.impact({ style: ImpactStyle.Light });
      this._hasNativeHaptics = true;
      this._isSupported = true;
      
      log.info('Haptics initialized', { 
        platform: isIOSNative() ? 'iOS' : 'Android',
        native: true 
      });
      
      return true;
    } catch (error) {
      // Fall back to vibration API
      if ('vibrate' in navigator) {
        this._hasNativeHaptics = false;
        this._isSupported = true;
        
        log.info('Haptics initialized', { 
          platform: isIOSNative() ? 'iOS' : 'Android',
          native: false,
          fallback: 'vibration'
        });
        
        return true;
      }
      
      log.debug('Haptics not supported');
      this._isSupported = false;
      return false;
    }
  },

  /**
   * Check if haptics are supported
   */
  isSupported() {
    return this._isSupported ?? false;
  },

  /**
   * Light impact - Button press, selection
   */
  async impact(style = 'medium') {
    if (!await this.init()) return;

    const now = Date.now();
    if (now - this._lastVibrationTime < this._vibrationDebounceMs) return;
    this._lastVibrationTime = now;

    try {
      if (isIOSNative() && this._hasNativeHaptics) {
        const iosStyle = IOS_PATTERNS[style] || IOS_PATTERNS.medium;
        await Haptics.impact({ style: iosStyle });
      } else if (isAndroidNative()) {
        const pattern = VIBRATION_PATTERNS[style] || VIBRATION_PATTERNS.medium;
        await this._vibrate(pattern);
      } else {
        // Web fallback - minimal vibration
        await this._vibrate(VIBRATION_PATTERNS[style] || VIBRATION_PATTERNS.light);
      }
    } catch (error) {
      log.debug('Impact failed', { style, error: error.message });
    }
  },

  /**
   * Selection feedback - Picker changes, tabs
   */
  async selection() {
    return this.impact('selection');
  },

  /**
   * Success feedback - Action completed
   */
  async success() {
    if (!await this.init()) return;

    try {
      if (isIOSNative() && this._hasNativeHaptics) {
        await Haptics.notification({ type: NotificationType.Success });
      } else {
        await this._vibrate(VIBRATION_PATTERNS.success);
      }
    } catch (error) {
      log.debug('Success haptic failed', error);
    }
  },

  /**
   * Warning feedback - Caution needed
   */
  async warning() {
    if (!await this.init()) return;

    try {
      if (isIOSNative() && this._hasNativeHaptics) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else {
        await this._vibrate(VIBRATION_PATTERNS.warning);
      }
    } catch (error) {
      log.debug('Warning haptic failed', error);
    }
  },

  /**
   * Error feedback - Something went wrong
   */
  async error() {
    if (!await this.init()) return;

    try {
      if (isIOSNative() && this._hasNativeHaptics) {
        await Haptics.notification({ type: NotificationType.Error });
      } else {
        await this._vibrate(VIBRATION_PATTERNS.error);
      }
    } catch (error) {
      log.debug('Error haptic failed', error);
    }
  },

  /**
   * Emergency feedback - Critical alert
   */
  async emergency() {
    if (!await this.init()) return;

    try {
      await this._vibrate(VIBRATION_PATTERNS.emergency);
    } catch (error) {
      log.debug('Emergency haptic failed', error);
    }
  },

  /**
   * Custom vibration pattern
   * @param {number[]} pattern - Vibration pattern in ms: [pause, vibrate, pause, vibrate, ...]
   */
  async vibratePattern(pattern) {
    if (!await this.init()) return;
    return this._vibrate(pattern);
  },

  /**
   * Internal vibration method with fallback
   * @private
   */
  async _vibrate(pattern) {
    if (!navigator.vibrate) return;

    try {
      // Capacitor vibration for Android
      if (isAndroidNative() && window.Capacitor?.Plugins?.Haptics) {
        await Haptics.vibrate({ duration: pattern.reduce((a, b) => a + b, 0) });
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      log.debug('Vibration failed', error);
    }
  },

  /**
   * Predefined haptic sequences for complex interactions
   */
  sequence: {
    /**
     * Download complete sequence
     */
    async downloadComplete() {
      if (isIOSNative()) {
        await HapticsService.success();
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        await HapticsService._vibrate([0, 50, 100, 100, 50, 50]);
      }
    },

    /**
     * Delete confirmation sequence
     */
    async delete() {
      if (isIOSNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
        await new Promise(r => setTimeout(r, 50));
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        await HapticsService._vibrate([0, 100, 50, 200]);
      }
    },

    /**
     * Card selection sequence
     */
    async cardSelect() {
      await HapticsService.impact('medium');
    },

    /**
     * Pull-to-refresh trigger
     */
    async refresh() {
      await HapticsService.impact('medium');
    },

    /**
     * Scroll snap (when list snaps to item)
     */
    async scrollSnap() {
      await HapticsService.impact('light');
    },

    /**
     * Toggle switch
     */
    async toggle(on) {
      if (on) {
        await HapticsService.success();
      } else {
        await HapticsService.impact('light');
      }
    },

    /**
     * Long press activation
     */
    async longPress() {
      await HapticsService.impact('heavy');
    },

    /**
     * Edge swipe (navigation gesture)
     */
    async edgeSwipe() {
      await HapticsService.impact('light');
    },

    /**
     * Page transition
     */
    async pageTransition() {
      await HapticsService.impact('light');
    },

    /**
     * Model loading progress ticks
     */
    async progressTick() {
      await HapticsService.impact('selection');
    },

    /**
     * Search result tap
     */
    async searchResult() {
      await HapticsService.impact('light');
    },

    /**
     * Keyboard key press
     */
    async keyPress() {
      await HapticsService.impact('selection');
    },

    /**
     * Tab switch
     */
    async tabSwitch() {
      await HapticsService.impact('light');
    },

    /**
     * Modal open/close
     */
    async modal() {
      await HapticsService.impact('medium');
    }
  }
};

// Re-export for convenience
export { ImpactStyle, NotificationType };
export default HapticsService;