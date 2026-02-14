# Phase 8: Production Hardening — Complete Implementation Specifications

**Status**: 🔴 READY FOR EXECUTION  
**Priority**: CRITICAL (Execute First)  
**Estimated Effort**: 1 week  
**Dependencies**: None

---

## 📋 Overview

Phase 8 adds the foundational infrastructure that all other phases depend on:
1. **EventBus** for cross-service communication
2. **`switchModel()`** method for atomic AI model switching
3. **State freeze** for ContextManager immutability
4. **Schema validation** for map cartridges
5. **Error boundaries** for generative UI components
6. **AudioContext bootstrap** for Web Audio lifecycle

---

## 🔧 Task 1: Add EventBus to ContextManager

### File: `src/services/context/ContextManager.js`

**Add after line 15 (after the class declaration starts):**

```javascript
/**
 * EventBus - Lightweight pub/sub for cross-service communication
 * Integrated into ContextManager since it's already the central nervous system
 */
class EventBus {
    constructor() {
        this.listeners = new Map(); // eventName → Set<callback>
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event identifier (e.g., 'ai:thinking', 'battery:critical')
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(eventName);
                }
            }
        };
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventName - Event identifier
     * @param {*} data - Event payload
     */
    emit(eventName, data) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus: Error in listener for "${eventName}"`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Event identifier
     */
    off(eventName) {
        this.listeners.delete(eventName);
    }

    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
    }
}
```

**Add to ContextManager constructor (after `this.listeners = [];`):**

```javascript
this.eventBus = new EventBus();
```

**Add public methods to ContextManager class (before `cleanup()`):**

```javascript
/**
 * Subscribe to application events
 * @param {string} eventName - Event identifier
 * @param {Function} callback - Handler function
 * @returns {Function} Unsubscribe function
 */
onEvent(eventName, callback) {
    return this.eventBus.on(eventName, callback);
}

/**
 * Emit an application event
 * @param {string} eventName - Event identifier
 * @param {*} data - Event payload
 */
emitEvent(eventName, data) {
    this.eventBus.emit(eventName, data);
}
```

**Add to `cleanup()` method (before existing cleanup code):**

```javascript
this.eventBus.clear();
```

---

## 🔧 Task 2: Add State Freeze to ContextManager

### File: `src/services/context/ContextManager.js`

**Replace the `getSnapshot()` method:**

```javascript
/**
 * Get immutable snapshot of current state
 * @returns {Object} Deep-frozen state snapshot
 */
getSnapshot() {
    const snapshot = {
        map: { ...this.state.map },
        device: { ...this.state.device },
        system: { ...this.state.system },
        timestamp: Date.now()
    };
    
    // Deep freeze to prevent mutation
    return Object.freeze({
        map: Object.freeze(snapshot.map),
        device: Object.freeze(snapshot.device),
        system: Object.freeze(snapshot.system),
        timestamp: snapshot.timestamp
    });
}
```

---

## 🔧 Task 3: Add `switchModel()` to TransformersEngine

### File: `src/services/ai/TransformersEngine.js`

**Add after the constructor:**

```javascript
constructor() {
    this.generator = null;
    this.currentModelId = null;
    this.isInitializing = false;
    this.isReady = false;
    this.abortController = null;
    this.isSwitching = false; // NEW: Mutex for model switching
}
```

**Add new method after `initialize()` method:**

```javascript
/**
 * Atomically switch to a different model
 * Unloads current model and loads new one with mutex guard
 * @param {string} newModelId - Target model ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<boolean>} Success status
 */
async switchModel(newModelId, onProgress = () => {}) {
    // Prevent concurrent switches
    if (this.isSwitching) {
        log.warn('Model switch already in progress');
        throw new Error('Model switch already in progress');
    }

    // Already on this model
    if (this.currentModelId === newModelId && this.isReady) {
        log.info('Already using target model', { modelId: newModelId });
        onProgress(100, 'Model ready');
        return true;
    }

    this.isSwitching = true;

    try {
        log.info('Switching model', {
            from: this.currentModelId,
            to: newModelId
        });

        // Step 1: Unload current model
        if (this.currentModelId) {
            onProgress(10, 'Unloading current model...');
            await this.unload();
        }

        // Step 2: Initialize new model
        onProgress(20, 'Loading new model...');
        const success = await this.initialize(newModelId, (progress, status) => {
            // Map 0-100 to 20-100 range
            const adjustedProgress = 20 + (progress * 0.8);
            onProgress(adjustedProgress, status);
        });

        this.isSwitching = false;
        return success;

    } catch (error) {
        this.isSwitching = false;
        log.error('Model switch failed', error);
        throw error;
    }
}
```

---

## 🔧 Task 4: Add AudioContext Bootstrap to Layout.jsx

### File: `src/components/Layout.jsx`

**Add import at top:**

```javascript
import { useEffect, useRef } from 'react';
```

**Add inside the Layout component function (before the return statement):**

```javascript
const audioContextInitialized = useRef(false);

useEffect(() => {
    // Bootstrap AudioContext on first user interaction
    // Required for Web Audio API to work on mobile browsers
    const initAudioContext = () => {
        if (!audioContextInitialized.current) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    // Store globally for TacticalAudioService to use
                    window.__urbanOfflineAudioContext = ctx;
                    audioContextInitialized.current = true;
                    
                    // Resume if suspended (iOS requirement)
                    if (ctx.state === 'suspended') {
                        ctx.resume();
                    }
                }
            } catch (error) {
                console.warn('AudioContext initialization failed', error);
            }
        }
    };

    // Listen for first user interaction
    const events = ['touchstart', 'click', 'keydown'];
    events.forEach(event => {
        document.addEventListener(event, initAudioContext, { once: true });
    });

    return () => {
        events.forEach(event => {
            document.removeEventListener(event, initAudioContext);
        });
    };
}, []);
```

---

## 🔧 Task 5: Add Cartridge Schema Validation

### File: `src/services/maps/MapCartridgeService.js`

**Add at the top of the file (after imports):**

```javascript
/**
 * Cartridge schema definition
 */
const CARTRIDGE_SCHEMA = {
    required: ['id', 'title', 'category', 'payload'],
    payload_required: ['center', 'zoom'],
    coordinate_bounds: {
        lat: { min: -90, max: 90 },
        lon: { min: -180, max: 180 },
    },
    zoom_bounds: { min: 0, max: 22 },
    id_pattern: /^[a-z0-9-]+$/,
};

/**
 * Validate a cartridge object against schema
 * @param {Object} cartridge - Cartridge to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCartridge(cartridge) {
    const errors = [];

    // Check required top-level fields
    for (const field of CARTRIDGE_SCHEMA.required) {
        if (!(field in cartridge)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Check ID format
    if (cartridge.id && !CARTRIDGE_SCHEMA.id_pattern.test(cartridge.id)) {
        errors.push(`Invalid ID format: ${cartridge.id} (must be lowercase alphanumeric with hyphens)`);
    }

    // Check payload fields
    if (cartridge.payload) {
        for (const field of CARTRIDGE_SCHEMA.payload_required) {
            if (!(field in cartridge.payload)) {
                errors.push(`Missing required payload field: ${field}`);
            }
        }

        // Validate coordinates
        if (cartridge.payload.center) {
            const [lon, lat] = cartridge.payload.center;
            const { lat: latBounds, lon: lonBounds } = CARTRIDGE_SCHEMA.coordinate_bounds;

            if (typeof lat !== 'number' || lat < latBounds.min || lat > latBounds.max) {
                errors.push(`Invalid latitude: ${lat} (must be between ${latBounds.min} and ${latBounds.max})`);
            }

            if (typeof lon !== 'number' || lon < lonBounds.min || lon > lonBounds.max) {
                errors.push(`Invalid longitude: ${lon} (must be between ${lonBounds.min} and ${lonBounds.max})`);
            }
        }

        // Validate zoom
        if (cartridge.payload.zoom !== undefined) {
            const { min, max } = CARTRIDGE_SCHEMA.zoom_bounds;
            if (cartridge.payload.zoom < min || cartridge.payload.zoom > max) {
                errors.push(`Invalid zoom: ${cartridge.payload.zoom} (must be between ${min} and ${max})`);
            }
        }
    }

    // Check tags array
    if (!cartridge.tags || !Array.isArray(cartridge.tags) || cartridge.tags.length === 0) {
        errors.push('Tags array must be non-empty');
    }

    // Validate POI coordinates if present
    if (cartridge.pois && Array.isArray(cartridge.pois)) {
        cartridge.pois.forEach((poi, index) => {
            if (poi.coords) {
                const [lon, lat] = poi.coords;
                const { lat: latBounds, lon: lonBounds } = CARTRIDGE_SCHEMA.coordinate_bounds;

                if (typeof lat !== 'number' || lat < latBounds.min || lat > latBounds.max) {
                    errors.push(`POI[${index}] invalid latitude: ${lat}`);
                }

                if (typeof lon !== 'number' || lon < lonBounds.min || lon > lonBounds.max) {
                    errors.push(`POI[${index}] invalid longitude: ${lon}`);
                }
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate all installed cartridges on startup
 * Logs warnings for invalid cartridges but doesn't crash
 */
function validateAllCartridges() {
    const results = INSTALLED_CARTRIDGES.map(cartridge => {
        const validation = validateCartridge(cartridge);
        return { cartridge, validation };
    });

    const invalid = results.filter(r => !r.validation.valid);

    if (invalid.length > 0) {
        console.warn(`⚠️ Found ${invalid.length} invalid cartridge(s):`);
        invalid.forEach(({ cartridge, validation }) => {
            console.warn(`  - ${cartridge.id}:`, validation.errors);
        });
    } else {
        console.log(`✅ All ${INSTALLED_CARTRIDGES.length} cartridges validated successfully`);
    }

    // Return only valid cartridges
    return results
        .filter(r => r.validation.valid)
        .map(r => r.cartridge);
}

// Run validation on module load
const VALID_CARTRIDGES = validateAllCartridges();
```

**Replace `INSTALLED_CARTRIDGES` references in the export with `VALID_CARTRIDGES`:**

```javascript
export const MapCartridgeService = {
    /**
     * Search available map cartridges
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return [];

        return VALID_CARTRIDGES.filter(cartridge => {
            // Title match
            if (cartridge.title.toLowerCase().includes(normalizedQuery)) return true;
            // Tag match
            if (cartridge.tags.some(tag => tag.includes(normalizedQuery))) return true;
            return false;
        }).map(cartridge => ({
            ...cartridge,
            displayTitle: `SECTOR: ${cartridge.title.toUpperCase()}`,
            type: 'map_sector'
        }));
    },

    /**
     * Get a specific cartridge by ID
     */
    getCartridge(id) {
        return VALID_CARTRIDGES.find(c => c.id === id);
    },

    /**
     * Validate a cartridge object
     * Exposed for testing and dynamic cartridge registration
     */
    validateCartridge
};
```

---

## 🔧 Task 6: Create MiniMapCardBoundary

### New File: `src/components/chat/MiniMapCardBoundary.jsx`

```jsx
import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * MiniMapCardBoundary - Error boundary for MiniMapCard
 * 
 * Prevents a single broken map card from crashing the entire chat thread.
 * Shows fallback UI with location name and coordinates.
 */
class MiniMapCardBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('MiniMapCard error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            const { query } = this.props;

            return (
                <div className="w-full rounded-lg bg-slate-950 border border-red-900/30 mt-3 mb-1 p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-950/30 flex items-center justify-center flex-shrink-0 border border-red-900/50">
                            <AlertTriangle className="w-5 h-5 text-red-500/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-red-400 font-mono tracking-wide">
                                MAP CARD FAILED TO RENDER
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                                Location: <span className="text-white">{query || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {this.state.error?.message || 'Unknown error'}
                            </p>

                            <button
                                onClick={this.handleRetry}
                                className="mt-3 flex items-center gap-2 text-xs text-red-400/80 hover:text-red-300 transition-colors uppercase font-mono tracking-wider"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MiniMapCardBoundary;
```

---

## 🔧 Task 7: Create AmbientStatusBarBoundary

### New File: `src/components/AmbientStatusBarBoundary.jsx`

```jsx
import React from 'react';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

/**
 * AmbientStatusBarBoundary - Error boundary for AmbientStatusBar
 * 
 * Ensures the status bar never takes down the entire layout.
 * Shows minimal fallback with basic connectivity status.
 */
class AmbientStatusBarBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            isOnline: navigator.onLine
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('AmbientStatusBar error:', error, errorInfo);
    }

    componentDidMount() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    componentWillUnmount() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }

    handleOnline = () => {
        this.setState({ isOnline: true });
    };

    handleOffline = () => {
        this.setState({ isOnline: false });
    };

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            const { isOnline } = this.state;

            return (
                <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isOnline ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                            ) : (
                                <WifiOff className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-xs font-mono text-slate-400">
                                Status bar unavailable
                            </span>
                        </div>
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AmbientStatusBarBoundary;
```

---

## 🔧 Task 8: Wrap Components with Error Boundaries

### File: `src/components/MessageBubble.jsx`

**Add import at top:**

```javascript
import MiniMapCardBoundary from './chat/MiniMapCardBoundary';
```

**Wrap MiniMapCard in the render (around line 80):**

```javascript
if (mapMatch) {
    const mapQuery = mapMatch[1];
    return (
        <div key={`map-${index}`} className="my-2">
            <MiniMapCardBoundary query={mapQuery}>
                <MiniMapCard query={mapQuery} />
            </MiniMapCardBoundary>
        </div>
    );
}
```

### File: `src/components/Layout.jsx`

**Add import at top:**

```javascript
import AmbientStatusBarBoundary from './AmbientStatusBarBoundary';
```

**Wrap AmbientStatusBar (if it exists in Layout):**

```javascript
<AmbientStatusBarBoundary>
    <AmbientStatusBar />
</AmbientStatusBarBoundary>
```

---

## 🔧 Task 9: Add Input Sanitization to MapCartridgeService

### File: `src/services/maps/MapCartridgeService.js`

**Add sanitization function at top:**

```javascript
/**
 * Sanitize search query to prevent injection attacks
 * @param {string} query - Raw user input
 * @returns {string} Sanitized query
 */
function sanitizeQuery(query) {
    if (typeof query !== 'string') return '';
    
    // Remove control characters and trim
    return query
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
        .trim()
        .slice(0, 200); // Max length 200 chars
}
```

**Update search method:**

```javascript
async search(query) {
    const sanitized = sanitizeQuery(query);
    const normalizedQuery = sanitized.toLowerCase();
    if (!normalizedQuery) return [];

    // ... rest of search logic
}
```

---

## 🔧 Task 10: Add Render Guards to MiniMapCard

### File: `src/components/chat/MiniMapCard.jsx`

**Add validation at the start of the component:**

```javascript
const MiniMapCard = ({ query }) => {
    const navigate = useNavigate();
    const [mapData, setMapData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Render guard: validate props
    if (!query || typeof query !== 'string') {
        console.warn('MiniMapCard: Invalid query prop', { query });
        return null;
    }

    // ... rest of component
```

---

## ✅ Acceptance Criteria Checklist

- [ ] EventBus integrated into ContextManager with `onEvent()` and `emitEvent()`
- [ ] ContextManager `getSnapshot()` returns deep-frozen objects
- [ ] TransformersEngine has `switchModel()` method with mutex guard
- [ ] AudioContext bootstraps on first user interaction in Layout.jsx
- [ ] All cartridges validated on startup with console output
- [ ] Invalid cartridges excluded from search results
- [ ] MiniMapCardBoundary shows fallback UI on error
- [ ] AmbientStatusBarBoundary shows minimal fallback on error
- [ ] MapCartridgeService sanitizes all search queries
- [ ] MiniMapCard validates props before render
- [ ] No unhandled promise rejections in console
- [ ] All error boundaries log errors with component names

---

## 🧪 Testing Commands

```bash
# Run the app and check console for validation output
npm run dev

# Look for:
# ✅ All X cartridges validated successfully
# OR
# ⚠️ Found X invalid cartridge(s): ...

# Test error boundaries by temporarily breaking MiniMapCard:
# Add `throw new Error('Test error');` at the start of MiniMapCard component

# Test EventBus:
# In browser console:
# ContextManager.getInstance().onEvent('test', (data) => console.log('Event received:', data))
# ContextManager.getInstance().emitEvent('test', { foo: 'bar' })

# Test switchModel:
# In browser console (after AI is loaded):
# TransformersEngine.getInstance().switchModel('qwen-0.5b', (p, s) => console.log(p, s))
```

---

**Phase 8 Complete** → Proceed to Phase 5 (Haptics/Audio)
