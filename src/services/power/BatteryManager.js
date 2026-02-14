/**
 * BatteryManager
 * 
 * Monitors device battery level and charging state.
 * Emits updates to ContextManager for UI consumption.
 * 
 * Data Sources:
 *   - Web: navigator.getBattery() (Battery Status API)
 *   - Native: @capacitor-community/battery-status plugin
 * 
 * Thresholds:
 *   CRITICAL: ≤10% — Auto-trigger Survival Mode recommendation
 *   LOW:     ≤20% — Warning in AmbientStatusBar
 *   NORMAL:  >20% — Standard operation
 * 
 * Events emitted to ContextManager:
 *   battery.level    — 0-100 integer
 *   battery.charging — boolean
 *   battery.state    — 'critical' | 'low' | 'normal'
 */

import ContextManager from '../context/ContextManager';
import { createLogger } from '../../utils/logger';

const log = createLogger('BatteryManager');

const THRESHOLDS = {
    CRITICAL: 10,
    LOW: 20,
    NORMAL: 100
};

/**
 * BatteryManager Singleton
 * Manages battery monitoring across web and native platforms
 */
class BatteryManager {
    static _instance = null;

    constructor() {
        if (BatteryManager._instance) {
            return BatteryManager._instance;
        }
        BatteryManager._instance = this;

        this._level = 100;           // 0-100
        this._charging = false;      // boolean
        this._state = 'normal';      // 'critical' | 'low' | 'normal'
        this._battery = null;        // Battery API object (web)
        this._plugin = null;         // Capacitor plugin (native)
        this._isNative = false;      // Platform detection
        this._initialized = false;   // Init state
        this._listeners = [];        // Cleanup functions
    }

    /**
     * Get singleton instance
     * @returns {BatteryManager}
     */
    static getInstance() {
        if (!BatteryManager._instance) {
            BatteryManager._instance = new BatteryManager();
        }
        return BatteryManager._instance;
    }

    /**
     * Initialize battery monitoring
     * Detects platform and sets up appropriate data source
     */
    async initialize() {
        if (this._initialized) {
            log.debug('BatteryManager already initialized');
            return;
        }

        try {
            // Detect if running on native platform
            this._isNative = this._detectNativePlatform();

            if (this._isNative) {
                await this._initNativeBattery();
            } else {
                await this._initWebBattery();
            }

            this._initialized = true;
            log.info('BatteryManager initialized', {
                platform: this._isNative ? 'native' : 'web',
                level: this._level,
                charging: this._charging,
                state: this._state
            });

        } catch (error) {
            log.error('Failed to initialize BatteryManager', error);
            // Graceful degradation - set unknown state
            this._setBatteryState(100, false);
        }
    }

    /**
     * Detect if running on native platform (iOS/Android via Capacitor)
     * @returns {boolean}
     */
    _detectNativePlatform() {
        if (typeof window === 'undefined') return false;
        
        // Check for Capacitor bridge
        const hasCapacitor = window.Capacitor && window.Capacitor.isNativePlatform;
        
        // Check for native-specific indicators
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        return hasCapacitor || (isIOS || isAndroid && window.Capacitor);
    }

    /**
     * Initialize using Web Battery API
     */
    async _initWebBattery() {
        if (!navigator.getBattery) {
            log.warn('Battery API not supported on this browser');
            this._setBatteryState(100, false);
            return;
        }

        try {
            // Get battery object
            this._battery = await navigator.getBattery();

            // Set initial state
            this._updateFromBatteryObject(this._battery);

            // Add event listeners
            const levelListener = () => this._updateFromBatteryObject(this._battery);
            const chargingListener = () => this._updateFromBatteryObject(this._battery);

            this._battery.addEventListener('levelchange', levelListener);
            this._battery.addEventListener('chargingchange', chargingListener);

            // Store cleanup functions
            this._listeners.push(() => {
                this._battery.removeEventListener('levelchange', levelListener);
                this._battery.removeEventListener('chargingchange', chargingListener);
            });

        } catch (error) {
            log.error('Failed to initialize Web Battery API', error);
            this._setBatteryState(100, false);
        }
    }

    /**
     * Initialize using Capacitor Battery Status plugin
     */
    async _initNativeBattery() {
        try {
            // Dynamic import to avoid errors on web
            // Use window.Capacitor.Plugins to access plugin without static import
            const capacitor = window.Capacitor;
            if (!capacitor || !capacitor.Plugins) {
                throw new Error('Capacitor plugins not available');
            }

            const Battery = capacitor.Plugins.Battery || capacitor.Plugins.BatteryStatus;
            if (!Battery) {
                throw new Error('Battery plugin not installed');
            }

            this._plugin = Battery;

            // Get initial battery info
            let info;
            if (Battery.getBatteryInfo) {
                info = await Battery.getBatteryInfo();
            } else if (Battery.getStatus) {
                info = await Battery.getStatus();
            } else {
                throw new Error('Battery plugin API not recognized');
            }

            this._setBatteryState(
                Math.round((info.batteryLevel || info.level || 0) * 100),
                info.isCharging || info.charging || false
            );

            // Add event listener for battery changes
            const eventName = 'batteryStatusChange' in Battery ? 'batteryStatusChange' : 'batteryStateChanged';
            const listener = await Battery.addListener(eventName, (info) => {
                this._setBatteryState(
                    Math.round((info.batteryLevel || info.level || 0) * 100),
                    info.isCharging || info.charging || false
                );
            });

            // Store cleanup function
            this._listeners.push(() => {
                if (listener && listener.remove) {
                    listener.remove();
                }
            });

        } catch (error) {
            log.error('Failed to initialize native battery plugin', error);
            // Fall back to web API if available, otherwise unknown state
            if (navigator.getBattery) {
                log.info('Falling back to Web Battery API');
                await this._initWebBattery();
            } else {
                this._setBatteryState(100, false);
            }
        }
    }

    /**
     * Update state from Web Battery API object
     * @param {BatteryManager} battery 
     */
    _updateFromBatteryObject(battery) {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        this._setBatteryState(level, charging);
    }

    /**
     * Set battery state and emit to ContextManager
     * @param {number} level - 0-100
     * @param {boolean} charging 
     */
    _setBatteryState(level, charging) {
        this._level = level;
        this._charging = charging;
        this._state = this._calculateState(level);

        // Emit to ContextManager
        this._emitToContextManager();
    }

    /**
     * Calculate battery state from level
     * @param {number} level - 0-100
     * @returns {'critical' | 'low' | 'normal'}
     */
    _calculateState(level) {
        if (level <= THRESHOLDS.CRITICAL) return 'critical';
        if (level <= THRESHOLDS.LOW) return 'low';
        return 'normal';
    }

    /**
     * Emit battery state to ContextManager
     */
    _emitToContextManager() {
        try {
            const contextManager = ContextManager.getInstance();
            contextManager.updateDevice({
                battery: `${this._level}%`,
                charging: this._charging,
                batteryState: this._state
            });
        } catch (error) {
            log.error('Failed to emit to ContextManager', error);
        }
    }

    /**
     * Get current battery level (0-100)
     * @returns {number}
     */
    getCurrentLevel() {
        return this._level;
    }

    /**
     * Check if device is charging
     * @returns {boolean}
     */
    isCharging() {
        return this._charging;
    }

    /**
     * Get battery state ('critical' | 'low' | 'normal')
     * @returns {string}
     */
    getBatteryState() {
        return this._state;
    }

    /**
     * Check if battery is at critical level (≤10%)
     * @returns {boolean}
     */
    isCritical() {
        return this._state === 'critical';
    }

    /**
     * Check if battery is at low level (≤20%)
     * @returns {boolean}
     */
    isLow() {
        return this._state === 'low' || this._state === 'critical';
    }

    /**
     * Stop battery monitoring and cleanup listeners
     */
    stop() {
        log.info('Stopping BatteryManager');
        
        // Run all cleanup functions
        this._listeners.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                log.warn('Error during cleanup', error);
            }
        });
        
        this._listeners = [];
        this._initialized = false;
        this._battery = null;
        this._plugin = null;
    }

    /**
     * Get threshold constants
     * @returns {Object}
     */
    static getThresholds() {
        return { ...THRESHOLDS };
    }
}

export default BatteryManager;