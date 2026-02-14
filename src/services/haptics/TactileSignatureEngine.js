/**
 * TactileSignatureEngine
 * 
 * Maps application-level events to distinct haptic and audio patterns.
 * Each pattern is a named "signature" — a sequence of impacts,
 * pauses, and intensities that create a recognizable feel.
 * 
 * Coordinates both HapticsService (native) and TacticalAudioService (web audio).
 * Safe across all platforms: haptics skip on web, audio skips on mute.
 */
class TactileSignatureEngine {
    constructor() {
        if (TactileSignatureEngine._instance) {
            return TactileSignatureEngine._instance;
        }
        TactileSignatureEngine._instance = this;
        
        this._enabled = true;
        this._activeLoops = new Map(); // signatureName -> { hapticInterval, audioLoop }
        this._loopIntervals = new Map();
        this._hapticsService = null;
        this._audioService = null;
        
        // Lazy imports to avoid circular dependencies
        this._loadHaptics = async () => {
            if (!this._hapticsService) {
                const { HapticsService } = await import('../HapticsService.js');
                this._hapticsService = HapticsService;
            }
            return this._hapticsService;
        };
        
        this._loadAudio = async () => {
            if (!this._audioService) {
                const TacticalAudioService = (await import('../audio/TacticalAudioService.js')).default;
                this._audioService = TacticalAudioService.getInstance();
            }
            return this._audioService;
        };
    }
    
    static getInstance() {
        if (!TactileSignatureEngine._instance) {
            TactileSignatureEngine._instance = new TactileSignatureEngine();
        }
        return TactileSignatureEngine._instance;
    }

    /**
     * Fire a signature once
     * @param {string} signature - Signature name (e.g., 'ai:complete', 'map:jump')
     */
    async fire(signature) {
        if (!this._enabled) return;
        
        const signatureConfig = this._getSignature(signature);
        if (!signatureConfig) {
            console.warn(`[TactileSignatureEngine] Unknown signature: ${signature}`);
            return;
        }
        
        // Execute haptic pattern
        if (signatureConfig.haptic) {
            try {
                const haptics = await this._loadHaptics();
                await this._executeHapticPattern(haptics, signatureConfig.haptic);
            } catch (_e) {
                // Silent fail - non-critical
            }
        }
        
        // Play audio sound
        if (signatureConfig.audio) {
            try {
                const audio = await this._loadAudio();
                audio.play(signatureConfig.audio);
            } catch (_e) {
                // Silent fail
            }
        }
    }

    /**
     * Start a looping signature
     * @param {string} signature - Loop signature name
     */
    async startLoop(signature) {
        if (!this._enabled || this._activeLoops.has(signature)) return;
        
        const signatureConfig = this._getSignature(signature);
        if (!signatureConfig || !signatureConfig.loop) return;
        
        const loopConfig = signatureConfig.loop;
        const loopId = { haptic: null, audio: null };
        this._activeLoops.set(signature, loopId);
        
        // Haptic loop
        if (loopConfig.haptic) {
            try {
                const haptics = await this._loadHaptics();
                let count = 0;
                const hapticInterval = setInterval(async () => {
                    if (loopConfig.haptic.repeat !== Infinity && count >= loopConfig.haptic.repeat) {
                        this.stopLoop(signature);
                        return;
                    }
                    await this._executeHapticPattern(haptics, loopConfig.haptic.pattern);
                    count++;
                }, loopConfig.haptic.interval);
                loopId.haptic = hapticInterval;
            } catch (_e) {
                // Silent fail
            }
        }
        
        // Audio loop
        if (loopConfig.audio) {
            try {
                const audio = await this._loadAudio();
                audio.startLoop(loopConfig.audio);
                loopId.audio = loopConfig.audio;
            } catch (_e) {
                // Silent fail
            }
        }
    }

    /**
     * Stop a looping signature
     * @param {string} signature - Loop signature name
     */
    async stopLoop(signature) {
        const loopId = this._activeLoops.get(signature);
        if (!loopId) return;
        
        // Clear haptic interval
        if (loopId.haptic) {
            clearInterval(loopId.haptic);
        }
        
        // Stop audio loop
        if (loopId.audio) {
            try {
                const audio = await this._loadAudio();
                audio.stopLoop(loopId.audio);
            } catch (_e) {
                // Silent fail
            }
        }
        
        this._activeLoops.delete(signature);
    }

    /**
     * Get signature definition
     * @param {string} signatureName - Signature name
     * @returns {Object|null} Signature configuration
     */
    _getSignature(signatureName) {
        const signatures = {
            // AI Thinking - soft rhythmic pulse during generation
            'ai:thinking': {
                loop: {
                    haptic: {
                        pattern: [{ type: 'impact', style: 'Light', delay: 0 }],
                        interval: 1500,
                        repeat: Infinity
                    },
                    audio: 'scan-sweep'
                }
            },
            
            // AI Complete - success notification burst
            'ai:complete': {
                haptic: [
                    { type: 'impact', style: 'Heavy', delay: 0 },
                    { type: 'notification', notificationType: 'Success', delay: 200 },
                    { type: 'impact', style: 'Light', delay: 100 }
                ],
                audio: 'confirm-tone'
            },
            
            // Map Jump - heavy impact on "Initiate Jump"
            'map:jump': {
                haptic: [
                    { type: 'impact', style: 'Heavy', delay: 0 },
                    { type: 'vibrate', duration: 300, delay: 100 }
                ],
                audio: 'lock-on'
            },
            
            // Alert Emergency - sustained warning pattern (3× heavy)
            'alert:emergency': {
                haptic: [
                    { type: 'impact', style: 'Heavy', delay: 0 },
                    { type: 'vibrate', duration: 500, delay: 200 },
                    { type: 'impact', style: 'Heavy', delay: 300 },
                    { type: 'vibrate', duration: 500, delay: 200 },
                    { type: 'impact', style: 'Heavy', delay: 300 }
                ],
                audio: 'alert-ping'
            },
            
            // Cartridge Load - sequential snap pattern
            'cartridge:load': {
                haptic: [
                    { type: 'impact', style: 'Medium', delay: 0 },
                    { type: 'impact', style: 'Light', delay: 80 },
                    { type: 'impact', style: 'Medium', delay: 80 }
                ],
                audio: 'confirm-tone'
            },
            
            // Navigation Select - light selection feedback
            'nav:select': {
                haptic: [{ type: 'selection', delay: 0 }],
                audio: null
            },
            
            // Survival Mode Enter - double heavy impact (mode shift)
            'survival:enter': {
                haptic: [
                    { type: 'impact', style: 'Heavy', delay: 0 },
                    { type: 'pause', duration: 150 },
                    { type: 'impact', style: 'Heavy', delay: 0 }
                ],
                audio: 'alert-ping'
            }
        };
        
        return signatures[signatureName];
    }

    /**
     * Execute a haptic pattern
     * @param {Object} haptics - HapticsService instance
     * @param {Array} pattern - Pattern steps
     */
    async _executeHapticPattern(haptics, pattern) {
        for (const step of pattern) {
            await new Promise(resolve => setTimeout(resolve, step.delay || 0));
            
            try {
                switch (step.type) {
                    case 'impact':
                        await haptics.impact(haptics.ImpactStyle[step.style]);
                        break;
                    case 'notification':
                        await haptics.notification(haptics.NotificationType[step.notificationType]);
                        break;
                    case 'selection':
                        await haptics.selection();
                        break;
                    case 'vibrate':
                        await haptics.vibrate(step.duration);
                        break;
                    case 'emergency':
                        await haptics.emergencyPattern();
                        break;
                }
            } catch (_e) {
                // Silent fail - haptics not critical
            }
        }
    }

    /**
     * Enable or disable all signatures
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) {
            // Stop all active loops
            for (const signature of this._activeLoops.keys()) {
                this.stopLoop(signature);
            }
        }
    }

    /**
     * Check if engine is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this._enabled;
    }
}

export default TactileSignatureEngine;
