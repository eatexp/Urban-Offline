/**
 * Platform Parity Utilities
 * 
 * Ensures consistent behavior between iOS and Android platforms
 * with feature parity and native-feel optimizations.
 * 
 * Compliance: .clinerules §3 - iOS/Android Feature Parity
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Battery } from '@capacitor/battery';
import { createLogger } from './logger';

const log = createLogger('PlatformParity');

/**
 * Platform feature detection and configuration
 */
export const PlatformParity = {
  // Cache platform info
  _platformInfo: null,
  _deviceInfo: null,

  /**
   * Initialize platform detection
   */
  async initialize() {
    if (this._platformInfo) return this._platformInfo;

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    let deviceInfo = null;
    let batteryInfo = null;

    if (isNative) {
      try {
        deviceInfo = await Device.getInfo();
        batteryInfo = await Battery.getStatus();
      } catch (error) {
        log.warn('Failed to get native device info', error);
      }
    }

    this._platformInfo = {
      platform, // 'ios', 'android', 'web'
      isNative,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
      deviceInfo,
      batteryInfo
    };

    log.info('Platform initialized', {
      platform,
      isNative,
      model: deviceInfo?.model
    });

    return this._platformInfo;
  },

  /**
   * Get storage directory - consistent for both platforms
   * Uses Directory.Documents for both iOS and Android
   */
  async getStorageDirectory() {
    const { Directory } = await import('@capacitor/filesystem');
    return Directory.Documents;
  },

  /**
   * Get platform-specific UI configurations
   */
  getUIConfig() {
    const { isIOS, isAndroid: _isAndroid } = this._platformInfo || {};

    return {
      // Touch feedback
      touchFeedback: {
        // iOS: Subtle opacity change
        // Android: Ripple effect (if supported)
        duration: isIOS ? 100 : 150,
        scale: isIOS ? 1 : 0.98,
      },

      // Scroll behavior
      scroll: {
        // iOS: Momentum scrolling
        // Android: Standard scrolling
        momentum: isIOS !== false, // Default true
        bounce: isIOS !== false,
      },

      // Status bar
      statusBar: {
        style: 'dark', // Both platforms
        overlay: true,  // Both platforms
      },

      // Navigation
      navigation: {
        // Both platforms use bottom tab bar
        type: 'bottom-tabs',
        height: 56, // px
      },

      // Animation preferences
      animation: {
        // Consistent across platforms
        enabled: true,
        duration: 150,
        easing: 'ease-out',
      }
    };
  },

  /**
   * Get AI model recommendations based on platform
   */
  getAIConfig() {
    const { deviceInfo: _deviceInfo, isIOS, isAndroid } = this._platformInfo || {};

    // Base configuration
    const config = {
      enabled: true,
      backend: 'transformersjs',
      preferredDevice: 'gpu',
      cacheSizeMB: 500,
    };

    // Platform-specific optimizations
    if (isIOS) {
      // iOS WebGL/WebGPU performance characteristics
      config.preferredDevice = 'webgl';
      config.cacheSizeMB = 400; // More conservative on iOS
      config.memoryLimitMB = 1800; // iOS Safari memory limits
    } else if (isAndroid) {
      // Android typically has more memory available
      config.preferredDevice = 'webgl';
      config.cacheSizeMB = 800;
      config.memoryLimitMB = 3000;
    }

    return config;
  },

  /**
   * Check if feature is available on current platform
   */
  isFeatureAvailable(feature) {
    const { isNative, isIOS, isAndroid } = this._platformInfo || {};

    const features = {
      // Storage features
      'persistent-storage': isNative,
      'background-download': isNative,

      // UI features
      'haptics': isNative,
      'status-bar-control': isNative,

      // AI features
      'local-ai': true, // WebGL available on both
      'webgpu': typeof navigator !== 'undefined' && 'gpu' in navigator,

      // Platform-specific
      'ios-specific': isIOS,
      'android-specific': isAndroid,

      // Parity features (available on both)
      'share-sheet': isNative,
      'file-picker': isNative,
    };

    return features[feature] || false;
  },

  /**
   * Execute platform-specific code with fallback
   */
  async executePlatform({ ios, android, web, fallback }) {
    const { isIOS, isAndroid, isWeb } = this._platformInfo || {};

    try {
      if (isIOS && ios) return await ios();
      if (isAndroid && android) return await android();
      if (isWeb && web) return await web();
      if (fallback) return await fallback();
    } catch (error) {
      log.error('Platform execution failed', error);
      if (fallback) return await fallback();
      throw error;
    }
  },

  /**
   * Get device capability tier
   */
  getDeviceTier() {
    const { deviceInfo } = this._platformInfo || {};

    if (!deviceInfo) return 'standard';

    // Memory-based tier detection
    const mem = deviceInfo.memUsed || 0;

    if (mem > 6000) return 'advanced'; // 6GB+ RAM
    if (mem > 4000) return 'standard';  // 4GB+ RAM
    return 'essential';                 // <4GB RAM
  },

  /**
   * Request platform permissions
   */
  async requestPermissions(permissions) {
    const results = {};

    for (const permission of permissions) {
      try {
        switch (permission) {
          case 'storage': {
            // Both platforms handle storage similarly
            results[permission] = true;
            break;
          }
          case 'notifications': {
            // Request notification permission
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const { display } = await LocalNotifications.requestPermissions();
            results[permission] = display === 'granted';
            break;
          }
          default:
            results[permission] = true;
        }
      } catch (error) {
        log.warn(`Permission request failed: ${permission}`, error);
        results[permission] = false;
      }
    }

    return results;
  }
};

export default PlatformParity;