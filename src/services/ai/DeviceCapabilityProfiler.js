/**
 * DeviceCapabilityProfiler - Intelligent device analysis for AI optimization
 * 
 * Analyzes hardware capabilities, runtime context, and environmental factors
 * to provide intelligent AI model recommendations and runtime adaptations.
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 *             .clinerules §2 - Battery-aware AI disable
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
// import { Battery } from '@capacitor/battery'; // Replaced by Device.getBatteryInfo()
import { createLogger } from '../../utils/logger';
import { isNativeMobile } from '../../utils/platform';

const log = createLogger('DeviceCapabilityProfiler');

// Performance tier thresholds
const PERFORMANCE_TIERS = {
  GPU: {
    NONE: 0,      // No WebGL/WebGPU
    BASIC: 1,     // WebGL only
    ADVANCED: 2   // WebGPU available
  },
  MEMORY: {
    LOW: 0,       // < 4GB
    MEDIUM: 1,    // 4-8GB
    HIGH: 2       // > 8GB
  },
  CPU: {
    LOW: 0,       // < 4 cores, no SIMD
    MEDIUM: 1,    // 4+ cores or SIMD
    HIGH: 2       // 6+ cores with SIMD
  }
};

// Model size recommendations per tier
const MODEL_SIZE_LIMITS = {
  'essential': 300 * 1024 * 1024,   // 300MB - Very low-end devices
  'standard': 600 * 1024 * 1024,    // 600MB - Mid-range devices
  'advanced': 1200 * 1024 * 1024,   // 1.2GB - High-end devices
  'pro': 2400 * 1024 * 1024         // 2.4GB - Premium devices
};

/**
 * Device Capability Profiler Service
 * Provides intelligent device analysis for optimal AI experience
 */
export const DeviceCapabilityProfiler = {
  _cachedProfile: null,
  _lastProfileTime: 0,
  _profileCacheDuration: 30000, // 30 seconds

  /**
   * Get comprehensive device profile
   * @param {boolean} forceRefresh - Skip cache and re-analyze
   * @returns {Promise<DeviceProfile>}
   */
  async getProfile(forceRefresh = false) {
    const now = Date.now();

    // Return cached profile if fresh
    if (!forceRefresh &&
      this._cachedProfile &&
      (now - this._lastProfileTime) < this._profileCacheDuration) {
      log.debug('Returning cached device profile');
      return this._cachedProfile;
    }

    try {
      log.info('Analyzing device capabilities...');

      const [
        hardwareProfile,
        runtimeContext,
        thermalState
      ] = await Promise.all([
        this._analyzeHardware(),
        this._analyzeRuntimeContext(),
        this._analyzeThermalState()
      ]);

      const profile = {
        // Timestamp for cache management
        timestamp: now,

        // Hardware capabilities
        hardware: hardwareProfile,

        // Runtime environment
        runtime: runtimeContext,

        // Thermal state (performance throttling indicator)
        thermal: thermalState,

        // Derived recommendations
        recommendations: this._generateRecommendations(hardwareProfile, runtimeContext, thermalState),

        // Feature flags
        features: this._generateFeatureFlags(hardwareProfile, runtimeContext)
      };

      // Cache the profile
      this._cachedProfile = profile;
      this._lastProfileTime = now;

      log.info('Device profile complete', {
        tier: profile.recommendedTier,
        gpu: hardwareProfile.gpu.tier,
        memory: hardwareProfile.memory.tier,
        battery: runtimeContext.battery.level
      });

      return profile;

    } catch (error) {
      log.error('Failed to analyze device', error);
      // Return safe fallback profile
      return this._getFallbackProfile();
    }
  },

  /**
   * Analyze hardware capabilities
   * @private
   */
  async _analyzeHardware() {
    // GPU Analysis
    const gpuProfile = await this._analyzeGPU();

    // Memory Analysis
    const memoryProfile = await this._analyzeMemory();

    // CPU Analysis
    const cpuProfile = this._analyzeCPU();

    // Storage Analysis
    const storageProfile = await this._analyzeStorage();

    return {
      gpu: gpuProfile,
      memory: memoryProfile,
      cpu: cpuProfile,
      storage: storageProfile
    };
  },

  /**
   * Analyze GPU capabilities
   * @private
   */
  async _analyzeGPU() {
    let webgpu = false;
    let webgl = false;
    let tier = PERFORMANCE_TIERS.GPU.NONE;

    // Check WebGPU
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          webgpu = true;
          tier = PERFORMANCE_TIERS.GPU.ADVANCED;

          // Get adapter info if available
          const info = await adapter.requestAdapterInfo?.();
          log.debug('WebGPU adapter detected', {
            vendor: info?.vendor,
            architecture: info?.architecture
          });
        }
      } catch (e) {
        log.debug('WebGPU check failed', e);
      }
    }

    // Check WebGL as fallback
    if (!webgpu && typeof window !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          webgl = true;
          tier = PERFORMANCE_TIERS.GPU.BASIC;

          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            log.debug('WebGL renderer detected', { vendor, renderer });
          }
        }
      } catch (e) {
        log.debug('WebGL check failed', e);
      }
    }

    return { webgpu, webgl, tier };
  },

  /**
   * Analyze memory capabilities
   * @private
   */
  async _analyzeMemory() {
    let total = null;
    let available = null;
    let tier = PERFORMANCE_TIERS.MEDIUM;

    // Device Memory API
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      total = navigator.deviceMemory * 1024 * 1024 * 1024; // Convert GB to bytes
      tier = total >= 8 * 1024 * 1024 * 1024 ? PERFORMANCE_TIERS.MEMORY.HIGH :
        total >= 4 * 1024 * 1024 * 1024 ? PERFORMANCE_TIERS.MEMORY.MEDIUM :
          PERFORMANCE_TIERS.MEMORY.LOW;
    }

    // Storage estimate for available space
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      try {
        const estimate = await navigator.storage.estimate();
        available = estimate.quota - estimate.usage;
      } catch (e) {
        log.debug('Storage estimate failed', e);
      }
    }

    // Native device info (more accurate on mobile)
    if (isNativeMobile()) {
      try {
        const info = await Device.getInfo();
        if (info.memUsed && info.realDiskFree) {
          // Use native values if more accurate
          log.debug('Native device info', {
            memUsed: info.memUsed,
            diskFree: info.realDiskFree
          });
        }
      } catch (e) {
        log.debug('Native device info failed', e);
      }
    }

    return { total, available, tier };
  },

  /**
   * Analyze CPU capabilities
   * @private
   */
  _analyzeCPU() {
    const cores = navigator.hardwareConcurrency || 4;
    let simd = false;
    let tier = PERFORMANCE_TIERS.CPU.MEDIUM;

    // Check WASM SIMD support
    try {
      simd = WebAssembly.validate(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
      ]));
    } catch (e) {
      log.debug('SIMD check failed', e);
    }

    // Determine tier
    if (cores >= 6 && simd) {
      tier = PERFORMANCE_TIERS.CPU.HIGH;
    } else if (cores >= 4 || simd) {
      tier = PERFORMANCE_TIERS.CPU.MEDIUM;
    } else {
      tier = PERFORMANCE_TIERS.CPU.LOW;
    }

    return { cores, simd, tier };
  },

  /**
   * Analyze storage capabilities
   * @private
   */
  async _analyzeStorage() {
    let total = null;
    let available = null;
    let persistent = false;

    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      try {
        const estimate = await navigator.storage.estimate();
        total = estimate.quota;
        available = estimate.quota - estimate.usage;

        // Check persistent storage permission
        if (navigator.storage.persist) {
          persistent = await navigator.storage.persisted();
        }
      } catch (e) {
        log.debug('Storage analysis failed', e);
      }
    }

    return { total, available, persistent };
  },

  /**
   * Analyze runtime context (battery, network, etc.)
   * @private
   */
  async _analyzeRuntimeContext() {
    const context = {
      battery: { level: 1.0, charging: true, isLowPower: false },
      network: { type: 'unknown', effectiveType: '4g', downlink: 10 },
      time: new Date(),
      isNative: isNativeMobile()
    };

    // Battery status
    if (isNativeMobile()) {
      try {
        const batteryInfo = await Device.getBatteryInfo();
        context.battery.level = batteryInfo.batteryLevel ?? 1.0;
        context.battery.charging = batteryInfo.isCharging ?? true;
        context.battery.isLowPower = (batteryInfo.batteryLevel ?? 1.0) < 0.2 && !(batteryInfo.isCharging ?? true);
      } catch (e) {
        log.debug('Battery info failed', e);
      }
    } else if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        context.battery.level = battery.level;
        context.battery.charging = battery.charging;
        context.battery.isLowPower = battery.level < 0.2 && !battery.charging;
      } catch (e) {
        log.debug('Battery API failed', e);
      }
    }

    // Network status
    if ('connection' in navigator) {
      const conn = navigator.connection;
      context.network.type = conn.type || 'unknown';
      context.network.effectiveType = conn.effectiveType || '4g';
      context.network.downlink = conn.downlink || 10;
      context.network.saveData = conn.saveData || false;
    }

    // Online/offline
    context.network.online = navigator.onLine;

    return context;
  },

  /**
   * Analyze thermal state (if available)
   * @private
   */
  async _analyzeThermalState() {
    // Thermal API is experimental and not widely supported
    // Return nominal as default, update if API becomes available
    let state = 'nominal';
    let reason = null;

    // Check for thermal API (future-proofing)
    if ('thermal' in navigator) {
      try {
        const thermal = await navigator.thermal.getCurrentState();
        state = thermal.state; // 'nominal', 'fair', 'serious', 'critical'
        reason = thermal.reason;
      } catch (e) {
        log.debug('Thermal API not available', e);
      }
    }

    // Infer thermal state from battery and performance
    const profile = this._cachedProfile;
    if (profile?.runtime.battery.isLowPower) {
      state = 'fair'; // Conservative when battery low
    }

    return { state, reason };
  },

  /**
   * Generate AI model recommendations
   * @private
   */
  _generateRecommendations(hardware, runtime, thermal) {
    // Calculate overall performance score
    const gpuScore = hardware.gpu.tier;
    const memoryScore = hardware.memory.tier;
    const cpuScore = hardware.cpu.tier;

    // Thermal penalty
    const thermalPenalty = {
      'nominal': 0,
      'fair': 0.5,
      'serious': 1,
      'critical': 2
    }[thermal.state] || 0;

    // Calculate raw capability score
    const rawScore = (gpuScore + memoryScore + cpuScore) / 3 - thermalPenalty;

    // Battery constraint
    const batteryConstraint = runtime.battery.isLowPower ? 1 : 0;

    // Final score
    const score = Math.max(0, rawScore - batteryConstraint);

    // Map to tier
    let recommendedTier;
    let maxModelSize;
    let inferencePriority;

    if (score >= 1.5) {
      recommendedTier = 'pro';
      maxModelSize = MODEL_SIZE_LIMITS.pro;
      inferencePriority = 'quality';
    } else if (score >= 1.0) {
      recommendedTier = 'advanced';
      maxModelSize = MODEL_SIZE_LIMITS.advanced;
      inferencePriority = 'balanced';
    } else if (score >= 0.5) {
      recommendedTier = 'standard';
      maxModelSize = MODEL_SIZE_LIMITS.standard;
      inferencePriority = 'speed';
    } else {
      recommendedTier = 'essential';
      maxModelSize = MODEL_SIZE_LIMITS.essential;
      inferencePriority = 'speed';
    }

    // Override if battery critical
    if (runtime.battery.level < 0.1) {
      recommendedTier = 'essential';
      maxModelSize = MODEL_SIZE_LIMITS.essential;
      inferencePriority = 'speed';
    }

    return {
      tier: recommendedTier,
      maxModelSize,
      inferencePriority,
      score: Math.round(score * 100) / 100,
      canRunAI: hardware.gpu.tier > PERFORMANCE_TIERS.GPU.NONE,
      optimalBatchSize: this._calculateOptimalBatchSize(hardware)
    };
  },

  /**
   * Calculate optimal batch size for inference
   * @private
   */
  _calculateOptimalBatchSize(hardware) {
    if (hardware.gpu.tier === PERFORMANCE_TIERS.GPU.ADVANCED) {
      return hardware.memory.tier === PERFORMANCE_TIERS.MEMORY.HIGH ? 4 : 2;
    }
    return 1; // Sequential for WebGL/WASM
  },

  /**
   * Generate feature flags based on capabilities
   * @private
   */
  _generateFeatureFlags(hardware, runtime) {
    return {
      aiEnabled: hardware.gpu.tier > PERFORMANCE_TIERS.GPU.NONE,
      streamingEnabled: hardware.gpu.tier >= PERFORMANCE_TIERS.GPU.BASIC,
      embeddingsEnabled: hardware.memory.tier >= PERFORMANCE_TIERS.MEMORY.MEDIUM,
      backgroundDownload: runtime.isNative && runtime.battery.level > 0.3,
      aggressiveCaching: hardware.storage.available > 5 * 1024 * 1024 * 1024, // 5GB free
      highQualityImages: hardware.memory.tier >= PERFORMANCE_TIERS.MEMORY.MEDIUM,
      animationsEnabled: !runtime.battery.isLowPower,
      hapticsEnabled: runtime.isNative
    };
  },

  /**
   * Get fallback profile for error cases
   * @private
   */
  _getFallbackProfile() {
    return {
      timestamp: Date.now(),
      hardware: {
        gpu: { webgpu: false, webgl: false, tier: PERFORMANCE_TIERS.GPU.NONE },
        memory: { total: null, available: null, tier: PERFORMANCE_TIERS.MEDIUM },
        cpu: { cores: 4, simd: false, tier: PERFORMANCE_TIERS.MEDIUM },
        storage: { total: null, available: null, persistent: false }
      },
      runtime: {
        battery: { level: 1.0, charging: true, isLowPower: false },
        network: { type: 'unknown', effectiveType: '4g', downlink: 10, online: true },
        time: new Date(),
        isNative: false
      },
      thermal: { state: 'nominal', reason: null },
      recommendations: {
        tier: 'essential',
        maxModelSize: MODEL_SIZE_LIMITS.essential,
        inferencePriority: 'speed',
        score: 0,
        canRunAI: false,
        optimalBatchSize: 1
      },
      features: {
        aiEnabled: false,
        streamingEnabled: false,
        embeddingsEnabled: false,
        backgroundDownload: false,
        aggressiveCaching: false,
        highQualityImages: false,
        animationsEnabled: true,
        hapticsEnabled: false
      }
    };
  },

  /**
   * Check if a specific model is optimal for this device
   * @param {Object} model - Model configuration
   * @returns {Promise<boolean>}
   */
  async isOptimalForDevice(model) {
    const profile = await this.getProfile();

    // Must be able to run AI
    if (!profile.recommendations.canRunAI) return false;

    // Model must fit in memory constraints
    if (model.size > profile.recommendations.maxModelSize) return false;

    // Model tier should match device tier
    const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };
    const deviceTier = tierPriority[profile.recommendations.tier];
    const modelTier = tierPriority[model.tier] ?? 1;

    // Optimal if model tier <= device tier + 1 (allow slight over-provisioning)
    return modelTier <= deviceTier + 1;
  },

  /**
   * Check if a model can run on this device (even if not optimal)
   * @param {Object} model - Model configuration
   * @returns {Promise<boolean>}
   */
  async canRunOnDevice(model) {
    const profile = await this.getProfile();

    // Must be able to run AI
    if (!profile.recommendations.canRunAI) return false;

    // Model must fit in absolute maximum (2x recommended)
    const absoluteMax = profile.recommendations.maxModelSize * 2;
    if (model.size > absoluteMax) return false;

    // Must have enough storage
    if (profile.hardware.storage.available &&
      model.size > profile.hardware.storage.available * 0.8) {
      return false;
    }

    return true;
  },

  /**
   * Get real-time performance warning for a model
   * @param {Object} model - Model configuration
   * @returns {Promise<{canRun: boolean, warning: string|null, severity: 'none'|'info'|'warning'|'critical'}>}
   */
  async getPerformanceWarning(model) {
    const profile = await this.getProfile();

    // Can't run AI at all
    if (!profile.recommendations.canRunAI) {
      return {
        canRun: false,
        warning: 'AI features are not available on this device.',
        severity: 'critical'
      };
    }

    // Model too large
    if (model.size > profile.recommendations.maxModelSize * 2) {
      return {
        canRun: false,
        warning: `This model requires ${Math.round(model.size / 1024 / 1024)}MB. Your device supports up to ${Math.round(profile.recommendations.maxModelSize * 2 / 1024 / 1024)}MB.`,
        severity: 'critical'
      };
    }

    // Model larger than recommended
    if (model.size > profile.recommendations.maxModelSize) {
      return {
        canRun: true,
        warning: 'This model may run slowly on your device. Consider a smaller model for better performance.',
        severity: 'warning'
      };
    }

    // Battery warning
    if (profile.runtime.battery.isLowPower) {
      return {
        canRun: true,
        warning: 'Battery is low. AI performance may be reduced to save power.',
        severity: 'info'
      };
    }

    // Thermal warning
    if (profile.thermal.state === 'serious' || profile.thermal.state === 'critical') {
      return {
        canRun: true,
        warning: 'Device is warm. AI performance may be reduced to prevent overheating.',
        severity: 'info'
      };
    }

    return { canRun: true, warning: null, severity: 'none' };
  },

  /**
   * Watch for capability changes (battery, thermal)
   * @param {Function} callback - Called when significant changes occur
   * @returns {Function} Unsubscribe function
   */
  watchCapabilities(callback) {
    const checkInterval = setInterval(async () => {
      const newProfile = await this.getProfile(true); // Force refresh

      // Check for significant changes
      if (this._hasSignificantChange(this._cachedProfile, newProfile)) {
        log.info('Significant capability change detected', {
          oldTier: this._cachedProfile?.recommendations?.tier,
          newTier: newProfile.recommendations.tier
        });
        callback(newProfile);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  },

  /**
   * Check if profile change is significant
   * @private
   */
  _hasSignificantChange(oldProfile, newProfile) {
    if (!oldProfile) return true;

    // Tier change
    if (oldProfile.recommendations.tier !== newProfile.recommendations.tier) {
      return true;
    }

    // Battery critical state change
    const oldCritical = oldProfile.runtime.battery.level < 0.2;
    const newCritical = newProfile.runtime.battery.level < 0.2;
    if (oldCritical !== newCritical) return true;

    // Thermal state change
    if (oldProfile.thermal.state !== newProfile.thermal.state) {
      return true;
    }

    // Online/offline change
    if (oldProfile.runtime.network.online !== newProfile.runtime.network.online) {
      return true;
    }

    return false;
  },

  /**
   * Clear cached profile (useful after major system changes)
   */
  clearCache() {
    this._cachedProfile = null;
    this._lastProfileTime = 0;
    log.debug('Device profile cache cleared');
  }
};

export default DeviceCapabilityProfiler;

/**
 * @typedef {Object} DeviceProfile
 * @property {number} timestamp
 * @property {Object} hardware
 * @property {Object} runtime
 * @property {Object} thermal
 * @property {Object} recommendations
 * @property {Object} features
 */