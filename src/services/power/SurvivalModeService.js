/**
 * SurvivalModeService
 * 
 * Orchestrates the full "Survival Mode" experience (Blackout Protocol).
 * When activated (manually or auto-triggered), this service:
 * 
 * 1. FORCES AI model to smollm-360m (lowest power consumption)
 *    → Via TransformersEngine.switchModel('smollm-360m')
 * 
 * 2. DISABLES haptics and tactical audio
 *    → Via TactileSignatureEngine.setEnabled(false)
 *    → Via TacticalAudioService.setEnabled(false)
 * 
 * 3. REDUCES map rendering quality
 *    → Lower tile resolution
 *    → Disable pitch/3D view (force pitch: 0)
 *    → Reduce max zoom level
 * 
 * 4. DIMS screen brightness to 20%
 *    → Via @capacitor/screen-brightness (native only)
 *    → Stores original brightness for restoration
 * 
 * 5. EMITS survivalMode state to ContextManager
 *    → All UI components can react to this flag
 * 
 * 6. STRIPS non-essential UI elements
 *    → Disables animations/transitions
 *    → Reduces AmbientStatusBar to minimal mode
 *    → Hides decorative elements
 * 
 * Activation:
 *   - Manual: User toggles in Settings or AmbientStatusBar
 *   - Auto: BatteryManager detects CRITICAL threshold (≤10%)
 *   - Auto requires user confirmation via modal
 * 
 * Deactivation:
 *   - Manual toggle off
 *   - Auto when battery rises above LOW threshold while charging
 */

import ContextManager from '../context/ContextManager';
import { createLogger } from '../../utils/logger';

const log = createLogger('SurvivalModeService');

const SURVIVAL_CONFIG = {
    targetModel: 'smollm-360m',     // SmolLM-360M for lowest power
    screenBrightness: 0.2,          // 20% brightness
    maxMapZoom: 14,                 // Reduced from 18
    mapPitch: 0,                    // Flat 2D view only
    disableAnimations: true,
    disableHaptics: true,
    disableAudio: true,
    reducedTileQuality: true
};

/**
 * SurvivalModeService Singleton
 * Manages Blackout Protocol activation and deactivation
 */
class SurvivalModeService {
    static _instance = null;

    constructor() {
        if (SurvivalModeService._instance) {
            return SurvivalModeService._instance;
        }
        SurvivalModeService._instance = this;

        this._isActive = false;
        this._previousState = {
            modelId: null,
            brightness: null,
            hapticsEnabled: true,
            audioEnabled: true
        };
        this._listeners = new Set();
        this._isProcessing = false;  // Guard against concurrent operations
    }

    /**
     * Get singleton instance
     * @returns {SurvivalModeService}
     */
    static getInstance() {
        if (!SurvivalModeService._instance) {
            SurvivalModeService._instance = new SurvivalModeService();
        }
        return SurvivalModeService._instance;
    }

    /**
     * Activate Survival Mode (Blackout Protocol)
     * Orchestrates all power-saving measures
     */
    async activate() {
        // Guard: Prevent concurrent activation
        if (this._isProcessing) {
            log.warn('Survival mode operation already in progress');
            throw new Error('Survival mode operation already in progress');
        }

        // Guard: Already active
        if (this._isActive) {
            log.debug('Survival mode already active');
            return { success: true, alreadyActive: true };
        }

        this._isProcessing = true;

        try {
            log.info('Activating Survival Mode (Blackout Protocol)');

            // Step 1: Store current state for restoration
            await this._storeCurrentState();

            // Step 2: Switch AI model to low-power option
            await this._switchToLowPowerModel();

            // Step 3: Disable haptics
            await this._disableHaptics();

            // Step 4: Disable audio
            await this._disableAudio();

            // Step 5: Dim screen brightness (native only)
            await this._dimBrightness();

            // Step 6: Update ContextManager
            this._updateContextManager(true);

            // Step 7: Apply CSS attribute for global style changes
            this._applySurvivalModeStyles();

            // Step 8: Fire entry signature (before disabling haptics completely)
            await this._fireEntrySignature();

            // Set active state
            this._isActive = true;
            this._notifyListeners({ active: true });

            log.info('Survival Mode activated successfully');
            return { success: true };

        } catch (error) {
            log.error('Failed to activate Survival Mode', error);
            // Attempt partial rollback on failure
            await this._rollbackActivation();
            throw error;
        } finally {
            this._isProcessing = false;
        }
    }

    /**
     * Deactivate Survival Mode
     * Restores all settings to pre-activation state
     */
    async deactivate() {
        // Guard: Prevent concurrent deactivation
        if (this._isProcessing) {
            log.warn('Survival mode operation already in progress');
            throw new Error('Survival mode operation already in progress');
        }

        // Guard: Not active
        if (!this._isActive) {
            log.debug('Survival mode not active');
            return { success: true, alreadyInactive: true };
        }

        this._isProcessing = true;

        try {
            log.info('Deactivating Survival Mode');

            // Step 1: Restore AI model
            await this._restoreModel();

            // Step 2: Re-enable haptics
            await this._enableHaptics();

            // Step 3: Re-enable audio
            await this._enableAudio();

            // Step 4: Restore brightness
            await this._restoreBrightness();

            // Step 5: Update ContextManager
            this._updateContextManager(false);

            // Step 6: Remove CSS attribute
            this._removeSurvivalModeStyles();

            // Clear state
            this._isActive = false;
            this._previousState = {
                modelId: null,
                brightness: null,
                hapticsEnabled: true,
                audioEnabled: true
            };
            this._notifyListeners({ active: false });

            log.info('Survival Mode deactivated successfully');
            return { success: true };

        } catch (error) {
            log.error('Failed to deactivate Survival Mode', error);
            throw error;
        } finally {
            this._isProcessing = false;
        }
    }

    /**
     * Toggle Survival Mode on/off
     */
    async toggle() {
        if (this._isActive) {
            return this.deactivate();
        } else {
            return this.activate();
        }
    }

    /**
     * Store current system state for later restoration
     */
    async _storeCurrentState() {
        try {
            // Get current AI model
            const TransformersEngine = (await import('../ai/TransformersEngine.js')).default;
            const currentModel = TransformersEngine.getInstance().getCurrentModel();
            this._previousState.modelId = currentModel?.id || null;

            // Get haptics state
            const TactileSignatureEngine = (await import('../haptics/TactileSignatureEngine.js')).default;
            this._previousState.hapticsEnabled = TactileSignatureEngine.getInstance().isEnabled();

            // Get audio state
            const TacticalAudioService = (await import('../audio/TacticalAudioService.js')).default;
            this._previousState.audioEnabled = TacticalAudioService.getInstance()._enabled;

            // Get current brightness (native only)
            if (this._isNativePlatform()) {
                try {
                    const capacitor = window.Capacitor;
                    if (capacitor && capacitor.Plugins && capacitor.Plugins.ScreenBrightness) {
                        const brightnessInfo = await capacitor.Plugins.ScreenBrightness.getBrightness();
                        this._previousState.brightness = brightnessInfo.brightness;
                    } else {
                        log.debug('ScreenBrightness plugin not available');
                        this._previousState.brightness = null;
                    }
                } catch (e) {
                    log.warn('Could not get current brightness', e);
                    this._previousState.brightness = null;
                }
            }

            log.debug('Stored current state', this._previousState);

        } catch (error) {
            log.error('Failed to store current state', error);
            // Continue with defaults
            this._previousState = {
                modelId: null,
                brightness: null,
                hapticsEnabled: true,
                audioEnabled: true
            };
        }
    }

    /**
     * Switch AI model to low-power SmolLM-360M
     */
    async _switchToLowPowerModel() {
        try {
            const TransformersEngine = (await import('../ai/TransformersEngine.js')).default;
            const engine = TransformersEngine.getInstance();

            // Check if already on target model
            const currentModel = engine.getCurrentModel();
            if (currentModel?.id === SURVIVAL_CONFIG.targetModel) {
                log.debug('Already on target model');
                return;
            }

            log.info('Switching to low-power model', { target: SURVIVAL_CONFIG.targetModel });

            // Switch model with progress callback
            await engine.switchModel(SURVIVAL_CONFIG.targetModel, (progress, status) => {
                log.debug('Model switch progress', { progress, status });
            });

        } catch (error) {
            log.error('Failed to switch to low-power model', error);
            // Don't throw - survival mode can work with current model
        }
    }

    /**
     * Restore previous AI model
     */
    async _restoreModel() {
        if (!this._previousState.modelId) {
            log.debug('No previous model to restore');
            return;
        }

        try {
            const TransformersEngine = (await import('../ai/TransformersEngine.js')).default;
            const engine = TransformersEngine.getInstance();

            const currentModel = engine.getCurrentModel();
            if (currentModel?.id === this._previousState.modelId) {
                log.debug('Already on restored model');
                return;
            }

            log.info('Restoring previous model', { model: this._previousState.modelId });

            await engine.switchModel(this._previousState.modelId, (progress, status) => {
                log.debug('Model restore progress', { progress, status });
            });

        } catch (error) {
            log.error('Failed to restore previous model', error);
            // Don't throw - app can continue with current model
        }
    }

    /**
     * Disable haptics
     */
    async _disableHaptics() {
        try {
            const TactileSignatureEngine = (await import('../haptics/TactileSignatureEngine.js')).default;
            TactileSignatureEngine.getInstance().setEnabled(false);
            log.debug('Haptics disabled');
        } catch (error) {
            log.error('Failed to disable haptics', error);
        }
    }

    /**
     * Enable haptics
     */
    async _enableHaptics() {
        if (!this._previousState.hapticsEnabled) {
            log.debug('Haptics were already disabled before survival mode');
            return;
        }

        try {
            const TactileSignatureEngine = (await import('../haptics/TactileSignatureEngine.js')).default;
            TactileSignatureEngine.getInstance().setEnabled(true);
            log.debug('Haptics re-enabled');
        } catch (error) {
            log.error('Failed to enable haptics', error);
        }
    }

    /**
     * Disable audio
     */
    async _disableAudio() {
        try {
            const TacticalAudioService = (await import('../audio/TacticalAudioService.js')).default;
            TacticalAudioService.getInstance().setEnabled(false);
            log.debug('Audio disabled');
        } catch (error) {
            log.error('Failed to disable audio', error);
        }
    }

    /**
     * Enable audio
     */
    async _enableAudio() {
        if (!this._previousState.audioEnabled) {
            log.debug('Audio was already disabled before survival mode');
            return;
        }

        try {
            const TacticalAudioService = (await import('../audio/TacticalAudioService.js')).default;
            TacticalAudioService.getInstance().setEnabled(true);
            log.debug('Audio re-enabled');
        } catch (error) {
            log.error('Failed to enable audio', error);
        }
    }

    /**
     * Dim screen brightness to 20% (native only)
     */
    async _dimBrightness() {
        if (!this._isNativePlatform()) {
            log.debug('Skipping brightness dim on web platform');
            return;
        }

        try {
            // Use runtime access to avoid static import issues
            const capacitor = window.Capacitor;
            if (!capacitor || !capacitor.Plugins) {
                throw new Error('Capacitor plugins not available');
            }

            const ScreenBrightness = capacitor.Plugins.ScreenBrightness;
            if (!ScreenBrightness) {
                throw new Error('ScreenBrightness plugin not installed');
            }

            await ScreenBrightness.setBrightness({ brightness: SURVIVAL_CONFIG.screenBrightness });
            log.info('Screen brightness dimmed to 20%');
        } catch (error) {
            log.warn('Failed to dim brightness (plugin may not be installed)', error.message);
            // Don't throw - survival mode works without brightness control
        }
    }

    /**
     * Restore original screen brightness (native only)
     */
    async _restoreBrightness() {
        if (!this._isNativePlatform()) {
            return;
        }

        if (this._previousState.brightness === null) {
            log.debug('No previous brightness to restore');
            return;
        }

        try {
            // Use runtime access to avoid static import issues
            const capacitor = window.Capacitor;
            if (!capacitor || !capacitor.Plugins) {
                throw new Error('Capacitor plugins not available');
            }

            const ScreenBrightness = capacitor.Plugins.ScreenBrightness;
            if (!ScreenBrightness) {
                throw new Error('ScreenBrightness plugin not installed');
            }

            await ScreenBrightness.setBrightness({ brightness: this._previousState.brightness });
            log.info('Screen brightness restored', { brightness: this._previousState.brightness });
        } catch (error) {
            log.warn('Failed to restore brightness (plugin may not be installed)', error.message);
        }
    }

    /**
     * Update ContextManager with survival mode state
     */
    _updateContextManager(active) {
        try {
            const contextManager = ContextManager.getInstance();
            contextManager.setSurvivalMode(active);
        } catch (error) {
            log.error('Failed to update ContextManager', error);
        }
    }

    /**
     * Apply CSS attribute for global survival mode styles
     */
    _applySurvivalModeStyles() {
        if (typeof document !== 'undefined') {
            document.body.setAttribute('data-survival-mode', 'true');
            log.debug('Applied survival mode CSS attribute');
        }
    }

    /**
     * Remove CSS attribute
     */
    _removeSurvivalModeStyles() {
        if (typeof document !== 'undefined') {
            document.body.removeAttribute('data-survival-mode');
            log.debug('Removed survival mode CSS attribute');
        }
    }

    /**
     * Fire entry haptic signature
     */
    async _fireEntrySignature() {
        try {
            const TactileSignatureEngine = (await import('../haptics/TactileSignatureEngine.js')).default;
            // Fire signature before disabling haptics
            await TactileSignatureEngine.getInstance().fire('survival:enter');
        } catch (error) {
            log.warn('Failed to fire entry signature', error);
        }
    }

    /**
     * Rollback partial activation on failure
     */
    async _rollbackActivation() {
        log.warn('Rolling back partial activation');
        try {
            await this._enableHaptics();
            await this._enableAudio();
            await this._restoreBrightness();
            this._removeSurvivalModeStyles();
        } catch (error) {
            log.error('Rollback failed', error);
        }
    }

    /**
     * Check if running on native platform
     */
    _isNativePlatform() {
        if (typeof window === 'undefined') return false;
        return window.Capacitor && window.Capacitor.isNativePlatform;
    }

    /**
     * Check if Survival Mode is currently active
     * @returns {boolean}
     */
    isActive() {
        return this._isActive;
    }

    /**
     * Get survival mode configuration
     * @returns {Object}
     */
    getConfig() {
        return { ...SURVIVAL_CONFIG };
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Called with { active: boolean }
     * @returns {Function} Unsubscribe function
     */
    onStateChange(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Notify all listeners of state change
     */
    _notifyListeners(data) {
        this._listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                log.error('Error in state change listener', error);
            }
        });
    }
}

export default SurvivalModeService;