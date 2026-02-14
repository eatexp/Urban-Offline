/**
 * ContextManager.js
 * 
 * "The Eyes of the AI"
 * 
 * A Singleton service that aggregates the device's current state:
 * - Active Map Sector (Center, Zoom, Name)
 * - Device Status (Battery, Time, Connection)
 * - Active Cartridges (Memory)
 * 
 * This context is injected into the LLM system prompt ("HUD Block")
 * so the AI knows "where" and "when" it is.
 */

import TactileSignatureEngine from '../haptics/TactileSignatureEngine.js';

class ContextManager {
    static instance = null;

    constructor() {
        this.state = {
            map: {
                center: [0, 0],
                zoom: 0,
                activeSector: 'Unknown',
                lastUpdate: 0
            },
            device: {
                battery: 'Unknown',
                charging: false,
                connection: typeof navigator !== 'undefined' ? (navigator.onLine ? 'Online' : 'Offline') : 'Unknown',
                storage: {
                    used: 0,
                    quota: 0,
                    available: 0
                },
                batteryState: 'normal'  // 'critical' | 'low' | 'normal'
            },
            system: {
                activeCartridge: null
            },
            survivalMode: {
                active: false,
                activatedAt: null,
                estimatedEndTime: null
            }
        };

        this.listeners = new Set();
        this._initDeviceListeners();
    }

    static getInstance() {
        if (!ContextManager.instance) {
            ContextManager.instance = new ContextManager();
        }
        return ContextManager.instance;
    }

    /**
     * Start listening to device events (Battery, Network, Storage)
     */
    async _initDeviceListeners() {
        if (typeof navigator === 'undefined') return;

        // Battery
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                this._updateBattery(battery);

                battery.addEventListener('levelchange', () => this._updateBattery(battery));
                battery.addEventListener('chargingchange', () => this._updateBattery(battery));
            } catch (_e) {
                console.warn('Battery API not supported');
            }
        }

        // Network
        window.addEventListener('online', () => this.updateDevice({ connection: 'Online' }));
        window.addEventListener('offline', () => this.updateDevice({ connection: 'Offline' }));

        // Storage - Initial check and periodic polling
        this._updateStorage();
        this._storageInterval = setInterval(() => this._updateStorage(), 30000); // Poll every 30 seconds
    }

    _updateBattery(battery) {
        this.updateDevice({
            battery: `${Math.round(battery.level * 100)}%`,
            charging: battery.charging
        });
    }

    /**
     * Update storage metrics using Storage API
     * ENHANCED: [Phase 3a] Real storage metrics via navigator.storage.estimate()
     * Polls every 30 seconds to keep status bar updated with actual device storage.
     */
    async _updateStorage() {
        if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
            // Fallback for unsupported environments
            this.updateDevice({
                storage: {
                    used: 0,
                    quota: 0,
                    available: 0
                }
            });
            return;
        }

        try {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const available = quota - used;

            this.updateDevice({
                storage: {
                    used,
                    quota,
                    available
                }
            });
        } catch (e) {
            console.warn('Storage API not supported or failed', e);
            // Set to zero on error to avoid showing stale data
            this.updateDevice({
                storage: {
                    used: 0,
                    quota: 0,
                    available: 0
                }
            });
        }
    }

    /**
     * Cleanup intervals (useful for testing or unmounting)
     */
    cleanup() {
        if (this._storageInterval) {
            clearInterval(this._storageInterval);
            this._storageInterval = null;
        }
    }

    /**
     * Update Map State (Called by OfflineMap)
     */
    updateMapState(viewState) {
        // viewState: { center: [lng, lat], zoom, activeSector }
        this.state.map = {
            ...this.state.map,
            ...viewState,
            lastUpdate: Date.now()
        };
        this._notify();
    }

    /**
     * Update Device State
     */
    updateDevice(deviceState) {
        this.state.device = {
            ...this.state.device,
            ...deviceState
        };
        this._notify();
    }

    /**
     * Update Active Map Cartridge
     * @param {Object|null} cartridge 
     */
    updateActiveCartridge(cartridge) {
        // Only update if changed to prevent thrashing
        if (this.state.system.activeCartridge?.id !== cartridge?.id) {
            // Play load signature when cartridge becomes active (not when unloading)
            if (cartridge) {
                TactileSignatureEngine.getInstance().fire('cartridge:load');
            }
            
            this.state.system.activeCartridge = cartridge;
            this._notify();
        }
    }

    /**
     * Set Survival Mode state
     * @param {boolean} active - Whether survival mode is active
     */
    setSurvivalMode(active) {
        this.state.survivalMode = {
            active,
            activatedAt: active ? Date.now() : null,
            estimatedEndTime: active ? this._estimateBatteryEnd() : null
        };
        this._notify();
    }

    /**
     * Get Survival Mode state
     * @returns {Object} Survival mode state object
     */
    getSurvivalMode() {
        return { ...this.state.survivalMode };
    }

    /**
     * Estimate battery end time (rough calculation)
     * @private
     * @returns {number|null} Timestamp or null
     */
    _estimateBatteryEnd() {
        const batteryLevel = parseInt(this.state.device.battery) || 100;
        const isCharging = this.state.device.charging;
        
        // If charging, no end time
        if (isCharging) return null;
        
        // Rough estimate: 1% per 3 minutes of active use
        // This is highly variable but gives a rough idea
        const minutesRemaining = batteryLevel * 3;
        return Date.now() + (minutesRemaining * 60 * 1000);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Get a frozen snapshot of current state
     * Prevents accidental mutation by consumers
     * @returns {Object} - Deep-frozen state object
     */
    getState() {
        return this._deepFreeze({ ...this.state });
    }

    /**
     * Deep freeze an object and all nested objects
     * @private
     */
    _deepFreeze(obj) {
        Object.freeze(obj);
        
        Object.getOwnPropertyNames(obj).forEach(prop => {
            if (obj[prop] !== null
                && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
                && !Object.isFrozen(obj[prop])) {
                this._deepFreeze(obj[prop]);
            }
        });
        
        return obj;
    }

    _notify() {
        // Create frozen snapshot for listeners
        const frozenState = this._deepFreeze({ ...this.state });
        
        for (const listener of this.listeners) {
            listener(frozenState);
        }
    }

    /**
     * Get the "HUD Block" for the AI
     * Returns a formatted string describing the current context.
     */
    getSystemContext() {
        const { map, device, survivalMode } = this.state;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Format coordinates nicely
        const coords = map.center
            ? `${map.center[1].toFixed(4)}, ${map.center[0].toFixed(4)}`
            : 'Unknown';

        // Construct the HUD block
        const block = `
[SYSTEM CONTEXT]
- TIME: ${time}
- BATTERY: ${device.battery} (${device.charging ? 'Charging' : 'Discharging'})
- BATTERY_STATE: ${device.batteryState}
- CONNECTION: ${device.connection}
- VIEWPORT_COORDS: ${coords}
- ACTIVE_SECTOR: ${map.activeSector || 'Global'}
- ZOOM_LEVEL: ${map.zoom.toFixed(1)}
- SURVIVAL_MODE: ${survivalMode.active ? 'ACTIVE' : 'Inactive'}
`.trim();

        return block;
    }
}


export default ContextManager;
