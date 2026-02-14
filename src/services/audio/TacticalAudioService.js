/**
 * TacticalAudioService
 * 
 * Procedural UI sounds using Web Audio API (OscillatorNode).
 * Zero audio files, pure synthesis.
 * 
 * Sounds:
 *   scan-sweep   — Frequency ramp 200→800Hz (loop)
 *   lock-on      — Two quick 880Hz pips
 *   alert-ping   — 1kHz triangle wave
 *   confirm-tone — 660→880Hz sine glide
 *   error-buzz   — 150Hz sawtooth
 * 
 * AudioContext created lazily on first user gesture (autoplay policy).
 * Suspended/resumed to save battery.
 */
class TacticalAudioService {
    constructor() {
        if (TacticalAudioService._instance) {
            return TacticalAudioService._instance;
        }
        TacticalAudioService._instance = this;
        
        this._audioContext = null;
        this._enabled = true;
        this._activeLoops = new Map(); // soundName -> { oscillator, gainNode, interval }
        this._volume = 0.3; // 0-1
        
        // Bind to Capacitor App lifecycle
        this._setupAppListeners();
    }
    
    static getInstance() {
        if (!TacticalAudioService._instance) {
            TacticalAudioService._instance = new TacticalAudioService();
        }
        return TacticalAudioService._instance;
    }

    /**
     * Get or create AudioContext
     * Must be called after user gesture to satisfy autoplay policy
     */
    async _getAudioContext() {
        if (this._audioContext && this._audioContext.state !== 'closed') {
            // Resume if suspended
            if (this._audioContext.state === 'suspended') {
                await this._audioContext.resume();
            }
            return this._audioContext;
        }
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this._audioContext = new AudioContext();
            
            // Auto-suspend on page hide (save battery)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this._audioContext && this._audioContext.state === 'running') {
                    this._audioContext.suspend();
                }
            });
            
            return this._audioContext;
        } catch (e) {
            console.warn('[TacticalAudioService] AudioContext creation failed:', e);
            return null;
        }
    }

    /**
     * Play a sound once
     * @param {string} soundName - Sound name (e.g., 'confirm-tone', 'alert-ping')
     */
    async play(soundName) {
        if (!this._enabled) return;
        
        const ctx = await this._getAudioContext();
        if (!ctx) return;
        
        const now = ctx.currentTime;
        
        switch (soundName) {
            case 'lock-on':
                this._createLockOn(ctx, now);
                break;
                
            case 'alert-ping':
                this._createAlertPing(ctx, now);
                break;
                
            case 'confirm-tone':
                this._createConfirmTone(ctx, now);
                break;
                
            case 'error-buzz':
                this._createErrorBuzz(ctx, now);
                break;
                
            default:
                console.warn(`[TacticalAudioService] Unknown sound: ${soundName}`);
        }
    }

    /**
     * Start a looping sound
     * @param {string} soundName - Loop sound name (e.g., 'scan-sweep')
     */
    async startLoop(soundName) {
        if (!this._enabled || this._activeLoops.has(soundName)) return;
        
        const ctx = await this._getAudioContext();
        if (!ctx) return;
        
        if (soundName === 'scan-sweep') {
            this._createScanSweepLoop(ctx);
        }
    }

    /**
     * Stop a looping sound
     * @param {string} soundName - Loop sound name to stop
     */
    async stopLoop(soundName) {
        const loop = this._activeLoops.get(soundName);
        if (!loop) return;
        
        const ctx = await this._getAudioContext();
        if (!ctx) return;
        
        // Fade out gain
        loop.gainNode.gain.setValueAtTime(loop.gainNode.gain.value, ctx.currentTime);
        loop.gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        // Stop after fade
        setTimeout(() => {
            if (loop.oscillator) {
                loop.oscillator.stop();
                loop.oscillator.disconnect();
            }
            if (loop.gainNode) {
                loop.gainNode.disconnect();
            }
            if (loop.interval) {
                clearInterval(loop.interval);
            }
        }, 100);
        
        this._activeLoops.delete(soundName);
    }

    /**
     * Create lock-on sound (two quick 880Hz pips)
     */
    _createLockOn(ctx, startTime) {
        // First pip
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        
        osc1.frequency.setValueAtTime(880, startTime);
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(this._volume, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
        
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(startTime);
        osc1.stop(startTime + 0.05);
        
        // Second pip
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        
        osc2.frequency.setValueAtTime(880, startTime + 0.13);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(this._volume, startTime + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
        
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(startTime + 0.13);
        osc2.stop(startTime + 0.18);
    }

    /**
     * Create alert ping (1kHz triangle wave)
     */
    _createAlertPing(ctx, startTime) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(1000, startTime);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this._volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
    }

    /**
     * Create confirm tone (660→880Hz sine glide)
     */
    _createConfirmTone(ctx, startTime) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(660, startTime);
        osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.15);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this._volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
    }

    /**
     * Create error buzz (150Hz sawtooth with tremolo)
     */
    _createErrorBuzz(ctx, startTime) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(150, startTime);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this._volume * 0.7, startTime + 0.05);
        
        // Add tremolo for buzz effect
        const tremolo = ctx.createGain();
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(10, startTime);
        lfo.connect(tremolo.gain);
        tremolo.gain.setValueAtTime(0.5, startTime);
        
        osc.connect(tremolo).connect(gain).connect(ctx.destination);
        lfo.start(startTime);
        osc.start(startTime);
        
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        setTimeout(() => {
            osc.stop();
            lfo.stop();
        }, 300);
    }

    /**
     * Create scan-sweep loop (200→800Hz sine sweep over 1.5s, repeating)
     */
    _createScanSweepLoop(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
        osc.type = 'sine';
        gain.gain.setValueAtTime(this._volume * 0.3, ctx.currentTime);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime);
        
        // Restart sweep every 1.5s
        const restart = () => {
            if (this._activeLoops.has('scan-sweep')) {
                osc.frequency.cancelScheduledValues(ctx.currentTime);
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
            }
        };
        
        const interval = setInterval(restart, 1500);
        
        this._activeLoops.set('scan-sweep', {
            oscillator: osc,
            gainNode: gain,
            interval: interval
        });
    }

    /**
     * Enable or disable all audio
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) {
            // Stop all active loops
            for (const soundName of this._activeLoops.keys()) {
                this.stopLoop(soundName);
            }
        }
    }

    /**
     * Set volume (0-1)
     * @param {number} volume
     */
    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Setup Capacitor app lifecycle listeners
     */
    _setupAppListeners() {
        // Listen for Capacitor App state changes
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
                if (!this._audioContext) return;
                
                if (state.isActive) {
                    this._audioContext.resume();
                } else {
                    this._audioContext.suspend();
                }
            });
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }
        this._activeLoops.clear();
    }
}

export default TacticalAudioService;
