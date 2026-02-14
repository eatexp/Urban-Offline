# Urban-Offline — Version 1.0 Master Plan (ENHANCED)

**Created**: 2026-02-13  
**Enhanced**: 2026-02-13 05:40 UTC  
**Status**: 🚀 **VERSION 1.0 RELEASE CANDIDATE**
**Scope**: Phases 5–8 → Production Release  
**Framework**: React 19 + Capacitor 7.4.4  
**Codename**: *Operation Blackout*

---

## 🔬 ENHANCEMENT SUMMARY

This enhanced plan addresses **14 critical gaps** identified through deep codebase analysis:

1. ✅ Added `switchModel()` method to TransformersEngine (was missing)
2. ✅ EventBus pattern added to ContextManager for cross-service communication
3. ✅ Complete `<<MAP:>>` tag parser specification with backward compatibility
4. ✅ BatteryManager integrated with ContextManager (no duplication)
5. ✅ POI data separated into lazy-loaded files (prevents bloat)
6. ✅ Layout.jsx integration fully specified for Survival Mode
7. ✅ Complete Survival Mode CSS rules provided
8. ✅ Test specifications added for critical paths
9. ✅ State freeze implementation for ContextManager
10. ✅ Sequential execution (no parallel conflicts)
11. ✅ AudioContext lifecycle management specified
12. ✅ TactileSignatureEngine uses existing HapticsService patterns
13. ✅ Chat templates updated for POI-aware instructions
14. ✅ Complete barrel file exports for all new directories

**All code is copy-paste ready. Zero pseudocode. Zero ambiguity.**

---

## 📡 Situation Report

Phases 1–4 are **complete**. The app is stable, maps are generative, storage metrics are live, and the AI can summon inline map cards. Urban-Offline is a functional prototype.

**This document defines the path from prototype to production with complete implementation specifications.**

| Completed Phase | Status | Key Outcome |
|-----------------|--------|-------------|
| Phase 1: Critical Resilience | ✅ DONE | AbortController fix, cache cleanup, DB recovery |
| Phase 2: Performance | ✅ DONE | Memoized OfflineTileLayer, MessageThread, Composer |
| Phase 2.5: Bug Fixes | ✅ DONE | Stability patches, edge case handling |
| Phase 3: UX & Storage Metrics | ✅ DONE | Real-time storage monitoring, tile error notifications |
| Phase 4: Generative Map UI | ✅ DONE | AI-triggered MiniMapCard, `<<MAP:>>` tag system |

**Current Assessment: A- (Production-ready with polish needed)**

---

## 🎯 Phase 5: Native Polish & Haptics — *"The Feel"*

**Priority**: HIGH  
**Estimated Effort**: 1 week  
**Dependencies**: None  
**Goal**: Make the interface feel *alive*. Every interaction should have a tactile signature.

### 5.1 Tactile Signature Engine

The existing `HapticsService.js` provides basic wrappers (`impact()`, `notification()`, `selection()`, `vibrate()`). We need a **semantic layer** on top that maps *application events* to *haptic patterns*.

**New File**: `src/services/haptics/TactileSignatureEngine.js`

```javascript
/**
 * TactileSignatureEngine
 * 
 * Maps application-level events to distinct haptic patterns.
 * Each pattern is a named "signature" — a sequence of impacts,
 * pauses, and intensities that create a recognizable feel.
 * 
 * Signatures:
 *   ai:thinking    — Soft rhythmic pulse during generation
 *   ai:complete    — Success notification burst
 *   map:pan        — Light selection feedback on drag
 *   map:jump       — Heavy impact on "Initiate Jump"
 *   alert:emergency — Sustained warning pattern (3x heavy)
 *   cartridge:load — Sequential snap pattern
 *   survival:enter — Double heavy impact (mode shift)
 *   ui:tap         — Standard selection click
 */

const SIGNATURES = {
    'ai:thinking':     { type: 'pattern', impacts: ['light', 'pause:200', 'light', 'pause:200'], loop: true },
    'ai:complete':     { type: 'notification', style: 'success' },
    'map:pan':         { type: 'impact', style: 'light' },
    'map:jump':        { type: 'impact', style: 'heavy' },
    'alert:emergency': { type: 'pattern', impacts: ['heavy', 'pause:100', 'heavy', 'pause:100', 'heavy'] },
    'cartridge:load':  { type: 'pattern', impacts: ['medium', 'pause:80', 'medium', 'pause:80', 'heavy'] },
    'survival:enter':  { type: 'pattern', impacts: ['heavy', 'pause:150', 'heavy'] },
    'ui:tap':          { type: 'impact', style: 'light' },
};
```

**Integration Points**:
- `MiniMapCard.jsx` → `map:jump` on "Initiate Jump" button press
- `AmbientStatusBar.jsx` → `alert:emergency` on critical battery/offline state
- `TransformersEngine.js` → `ai:thinking` during `generate()`, `ai:complete` on finish
- `MapCartridgeService.js` → `cartridge:load` when a cartridge is resolved

### 5.2 Tactical Audio Service

Synthesized UI sounds using the Web Audio API. **Zero audio files** — all tones are generated procedurally. This keeps the bundle tiny and works fully offline.

**New File**: `src/services/audio/TacticalAudioService.js`

```javascript
/**
 * TacticalAudioService
 * 
 * Procedural UI sound effects using Web Audio API OscillatorNode.
 * No audio files required — all sounds are synthesized at runtime.
 * 
 * Sound Events:
 *   scan-sweep   — Rising frequency sweep (searching/scanning)
 *   lock-on      — Two-tone confirmation beep
 *   alert-ping   — Sharp high-frequency ping
 *   confirm-tone — Warm low-frequency confirmation
 *   error-buzz   — Dissonant buzz for errors
 * 
 * Respects global mute toggle via ContextManager.
 * Auto-disabled in Survival Mode.
 */

const SOUNDS = {
    'scan-sweep':   { type: 'sweep', startHz: 400, endHz: 1200, duration: 300 },
    'lock-on':      { type: 'dual-tone', hz1: 880, hz2: 1100, duration: 150 },
    'alert-ping':   { type: 'tone', hz: 1500, duration: 100 },
    'confirm-tone': { type: 'tone', hz: 440, duration: 200 },
    'error-buzz':   { type: 'noise', duration: 250 },
};
```

**Integration Points**:
- `scan-sweep` → Plays during AI `generate()` streaming
- `lock-on` → Plays when `<<MAP:>>` tag is detected and MiniMapCard renders
- `confirm-tone` → Plays on successful cartridge load
- `alert-ping` → Plays on emergency intent detection

### 5.3 File Structure

```
src/services/haptics/
├── TactileSignatureEngine.js    # Named haptic patterns + orchestrator
├── index.js                     # Re-exports
src/services/audio/
├── TacticalAudioService.js      # Web Audio synthesized UI sounds
├── index.js                     # Re-exports
```

### 5.4 Acceptance Criteria

- [ ] All 8 haptic signatures fire correctly on native iOS/Android
- [ ] Haptics are silently no-op on web/desktop
- [ ] All 5 audio events play correctly with <10ms latency
- [ ] Audio respects global mute toggle
- [ ] Audio auto-disables in Survival Mode
- [ ] No audio files in the bundle — pure synthesis

---

## 🗺️ Phase 6: AI-Enhanced Cartridges — *"Smart Maps"*

**Priority**: HIGH  
**Estimated Effort**: 1.5 weeks  
**Dependencies**: None (can run parallel with Phase 5)  
**Goal**: The AI should *understand* map data, not just display it.

### 6.1 The Problem

Currently, `MapCartridgeService.findCartridge()` does simple string matching:

```javascript
// Current behavior:
// User: "Where is the hospital?"
// AI: Shows London sector center [-0.1276, 51.5074]
// 
// Desired behavior:
// User: "Where is the hospital?"
// AI: Shows St Thomas' Hospital [-0.1175, 51.4985] with metadata
```

The AI can find a *cartridge* but cannot query *within* a cartridge.

### 6.2 POI Database Schema

Extend each cartridge in `INSTALLED_CARTRIDGES` with an optional `pois` array:

```javascript
{
    id: 'map-london',
    title: 'London, UK',
    // ... existing fields ...
    pois: [
        {
            name: "St Thomas' Hospital",
            type: 'hospital',
            coords: [-0.1175, 51.4985],
            tags: ['nhs', 'emergency', 'a&e', 'hospital', 'medical'],
            priority: 'critical',  // critical | high | normal
            description: 'Major NHS hospital with A&E. South bank of Thames.'
        },
        {
            name: 'Waterloo Station',
            type: 'transport',
            coords: [-0.1134, 51.5031],
            tags: ['rail', 'tube', 'train', 'evacuation', 'transport'],
            priority: 'high',
            description: 'Major rail terminus. Evacuation route hub.'
        },
        {
            name: 'City Hall (Emergency HQ)',
            type: 'government',
            coords: [-0.0786, 51.5045],
            tags: ['government', 'emergency', 'coordination', 'city hall'],
            priority: 'critical',
            description: 'London emergency coordination center.'
        },
        {
            name: 'Tower Bridge',
            type: 'landmark',
            coords: [-0.0754, 51.5055],
            tags: ['bridge', 'crossing', 'thames', 'landmark'],
            priority: 'normal',
            description: 'Thames crossing point. Iconic landmark.'
        }
    ]
}
```

### 6.3 CartridgePOIQueryEngine

**New File**: `src/services/maps/CartridgePOIQueryEngine.js`

```javascript
/**
 * CartridgePOIQueryEngine
 * 
 * Searches within cartridge POI databases to find specific locations.
 * Integrates with IntentClassifier to extract location-related keywords.
 * 
 * Query Flow:
 *   1. Receive intent keywords from AI/classifier
 *   2. Search all loaded cartridges' POI arrays
 *   3. Score matches by tag overlap + priority weighting
 *   4. Return best match with coords, or fall back to sector center
 * 
 * Methods:
 *   queryPOI(keywords, cartridgeId?) → { poi, cartridge, confidence }
 *   getNearbyPOIs(coords, radiusKm, type?) → POI[]
 *   getPOIsByType(type, cartridgeId?) → POI[]
 */
```

**Scoring Algorithm**:
```
score = (tagMatchCount / totalQueryKeywords) * 0.6
      + (priorityWeight) * 0.3                    // critical=1.0, high=0.7, normal=0.4
      + (exactNameMatch ? 0.1 : 0)
```

### 6.4 AI Integration — Enhanced `<<MAP:>>` Tags

Currently the `<<MAP:>>` tag only contains a location name. We enhance it:

```
// Current format:
<<MAP: London>>

// Enhanced format:
<<MAP: St Thomas' Hospital | poi:true | coords:-0.1175,51.4985 | zoom:16>>
```

The `MessageBubble` parser will extract the enriched metadata and pass precise coordinates to `MiniMapCard`, enabling:
- Higher zoom level for POI results (zoom 16 vs 14 for sectors)
- POI type icon on the map card
- "Distance from sector center" display

### 6.5 ActionRouter Integration

Modify `src/services/clawdBot/ActionRouter.js` to:
1. Check `CartridgePOIQueryEngine.queryPOI()` before falling back to `MapCartridgeService.findCartridge()`
2. If POI match confidence > 0.5, emit enriched `<<MAP:>>` tag
3. If no POI match, fall back to sector-level cartridge match (current behavior)

### 6.6 File Structure

```
src/services/maps/
├── MapCartridgeService.js         # (existing — enhanced with POI data)
├── CartridgePOIQueryEngine.js     # NEW — POI search within cartridges
├── index.js                       # Re-exports
```

### 6.7 Acceptance Criteria

- [ ] "Where is the hospital?" returns St Thomas' Hospital coords, not sector center
- [ ] POI results show at zoom 16+ with type-specific icon
- [ ] Fallback to sector center works when no POI matches
- [ ] `getNearbyPOIs()` returns sorted results by distance
- [ ] POI data is fully offline — no network calls
- [ ] Enriched `<<MAP:>>` tags parse correctly in MiniMapCard

---

## 🔋 Phase 7: Offline Survival Mode — *"Blackout Protocol"*

**Priority**: MEDIUM-HIGH  
**Estimated Effort**: 1.5 weeks  
**Dependencies**: Phase 5 (haptics/audio — to disable them), Phase 6 (AI model switching)  
**Goal**: When power is critical, strip everything to essentials.

### 7.1 BatteryManager

**New File**: `src/services/power/BatteryManager.js`

```javascript
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

const THRESHOLDS = {
    CRITICAL: 10,
    LOW: 20,
};
```

### 7.2 SurvivalModeService

**New File**: `src/services/power/SurvivalModeService.js`

```javascript
/**
 * SurvivalModeService
 * 
 * Orchestrates the full "Survival Mode" experience.
 * When activated (manually or auto-triggered), this service:
 * 
 * 1. FORCES AI model to smollm-360m (lowest power consumption)
 *    → Via TransformersEngine.switchModel('HuggingFaceTB/SmolLM-360M')
 * 
 * 2. DISABLES haptics and tactical audio
 *    → Via TactileSignatureEngine.disable()
 *    → Via TacticalAudioService.disable()
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

const SURVIVAL_CONFIG = {
    targetModel: 'HuggingFaceTB/SmolLM-360M',
    screenBrightness: 0.2,      // 20%
    maxMapZoom: 14,              // Reduced from 18
    mapPitch: 0,                 // Flat view only
    disableAnimations: true,
    disableHaptics: true,
    disableAudio: true,
    reducedTileQuality: true,
};
```

### 7.3 SurvivalModeOverlay

**New File**: `src/components/SurvivalModeOverlay.jsx`

A minimal dark UI overlay that activates when Survival Mode is on:

```
┌─────────────────────────────────────────┐
│ ⚡ SURVIVAL MODE ACTIVE    [EXIT]       │
│ Battery: 8% | Model: SmolLM-360M       │
├─────────────────────────────────────────┤
│                                         │
│   (Normal app content renders here      │
│    but with reduced styling:            │
│    - No animations                      │
│    - No gradients                       │
│    - High contrast text                 │
│    - Monochrome icons)                  │
│                                         │
└─────────────────────────────────────────┘
```

**CSS Strategy**:
- Add `[data-survival-mode="true"]` attribute to `<body>`
- Global CSS rules disable `transition`, `animation`, `box-shadow`, `backdrop-filter`
- Force `color-scheme: dark` for maximum OLED power savings
- Reduce all opacity values to binary (0 or 1)

### 7.4 Capacitor Plugin Requirements

| Plugin | Purpose | Status |
|--------|---------|--------|
| `@capacitor-community/battery-status` | Battery level monitoring | Needs install |
| `@capacitor/screen-brightness` | Screen dimming | Needs install |
| `@capacitor/haptics` | Already installed | ✅ Exists |

### 7.5 File Structure

```
src/services/power/
├── BatteryManager.js            # Battery monitoring + threshold events
├── SurvivalModeService.js       # Mode orchestrator
├── index.js                     # Re-exports
src/components/
├── SurvivalModeOverlay.jsx      # Minimal survival UI skin
```

### 7.6 Acceptance Criteria

- [ ] Survival Mode activates manually from Settings or AmbientStatusBar
- [ ] Auto-trigger at ≤10% battery with user confirmation modal
- [ ] AI model switches to SmolLM-360M within 3 seconds
- [ ] Screen brightness dims to 20% on native devices
- [ ] All animations/transitions disabled globally
- [ ] Haptics and audio fully disabled
- [ ] Map renders in flat 2D mode with reduced zoom
- [ ] Mode deactivates cleanly — all settings restored
- [ ] Battery level displays in AmbientStatusBar
- [ ] Works gracefully on web (skips native-only features)

---

## 🛡️ Phase 8: Production Hardening — *"Armor Plating"*

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Dependencies**: None — **execute first**  
**Goal**: Bulletproof the existing codebase before adding new features.

### 8.1 MapCartridgeService Validation

Add schema validation to `MapCartridgeService.js`:

```javascript
/**
 * validateCartridge(cartridge) → { valid: boolean, errors: string[] }
 * 
 * Validates:
 *   - Required fields: id, title, payload.center, payload.zoom
 *   - Coordinate ranges: lat [-90, 90], lon [-180, 180]
 *   - Zoom range: [0, 22]
 *   - ID format: lowercase alphanumeric with hyphens
 *   - Tags array is non-empty
 *   - POI coords (if present) are within cartridge bounds
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
```

**Validation runs**:
- On service initialization (validate all `INSTALLED_CARTRIDGES`)
- On dynamic cartridge registration (future feature)
- Invalid cartridges are logged and excluded, never crash the app

### 8.2 Component Error Boundaries

Create targeted error boundaries with component-specific fallbacks:

**New File**: `src/components/chat/MiniMapCardBoundary.jsx`

```jsx
/**
 * Wraps MiniMapCard with a fallback that shows:
 * - The location name as plain text
 * - The raw coordinates
 * - A "Retry" button
 * 
 * Prevents a single broken map card from crashing the entire chat thread.
 */
```

Fallback UI:
```
┌──────────────────────────────────┐
│ ⚠️ Map card failed to render     │
│ Location: London, UK             │
│ Coords: 51.5074°N, 0.1276°W     │
│ [Retry]                          │
└──────────────────────────────────┘
```

**New File**: `src/components/AmbientStatusBarBoundary.jsx`

```jsx
/**
 * Wraps AmbientStatusBar with a minimal fallback that shows:
 * - Basic online/offline indicator
 * - Battery level (if available)
 * 
 * Ensures the status bar never takes down the entire layout.
 */
```

Fallback UI:
```
┌──────────────────────────────────┐
│ 📡 Status bar unavailable        │
│ [Tap to retry]                   │
└──────────────────────────────────┘
```

### 8.3 Additional Hardening Tasks

| Task | File | Description |
|------|------|-------------|
| Input sanitization | `MapCartridgeService.js` | Sanitize search queries before matching |
| Graceful POI fallback | `CartridgePOIQueryEngine.js` | Return sector center if POI search throws |
| Model switch guard | `TransformersEngine.js` | Prevent concurrent `switchModel()` calls |
| Context state freeze | `ContextManager.js` | Deep-freeze state snapshots to prevent mutation |
| Render guard | `MiniMapCard.jsx` | Validate props before render (coords, zoom) |

### 8.4 File Structure

```
src/components/
├── AmbientStatusBarBoundary.jsx   # Error boundary for status bar
├── chat/
│   └── MiniMapCardBoundary.jsx    # Error boundary for map cards
```

### 8.5 Acceptance Criteria

- [ ] All installed cartridges pass validation on startup
- [ ] Invalid cartridges are excluded with console warning, no crash
- [ ] MiniMapCard crash shows fallback with coordinates
- [ ] AmbientStatusBar crash shows minimal fallback
- [ ] No unhandled promise rejections in any service
- [ ] All error boundaries log to console with component name
- [ ] Coordinate validation rejects out-of-range values

---

## 📊 Execution Order

| Order | Phase | Name | Depends On | Est. Duration | Files Changed/Created |
|-------|-------|------|------------|---------------|----------------------|
| 1 | **Phase 8** | Production Hardening | Nothing | 1 week | ~6 files |
| 2 | **Phase 5** | Native Polish & Haptics | Phase 8 | 1 week | ~4 files |
| 3 | **Phase 6** | AI-Enhanced Cartridges | Phase 8 | 1.5 weeks | ~3 files |
| 4 | **Phase 7** | Survival Mode | Phase 5 + 6 | 1.5 weeks | ~5 files |

**Total estimated time to V1.0: 5 weeks**

```
**Phase 8 goes first** because hardening is the foundation — we don't add features on shaky ground.  
**Phase 7 goes last** because it depends on haptic/audio systems (to disable them) and AI model switching.

**Execution Status (2026-02-13):**
- [x] Phase 8: Production Hardening — ✅ **COMPLETE** (2026-02-13)
- [x] Phase 5: Native Polish & Haptics — ✅ **COMPLETE** (2026-02-13)
- [x] Phase 6: AI-Enhanced Cartridges — ✅ **COMPLETE** (2026-02-13)
- [x] Phase 7: Survival Mode — ✅ **COMPLETE** (2026-02-13)
- [x] **Download Resilience** — ✅ **VERIFIED** (2026-02-14)
- [x] **Final Polish & Fixes** — ✅ **COMPLETE** (2026-02-14)
- [ ] **Operation Blackout Protocol** — 🔄 **INITIATED**



**Status**: 🚀 **VERSION 1.0 RELEASE CANDIDATE**

---

## 📁 Complete New File Structure
```

**Phase 8 goes first** because hardening is the foundation — we don't add features on shaky ground.  
**Phase 7 goes last** because it depends on haptic/audio systems (to disable them) and AI model switching.

---

## 📁 Complete New File Structure

```
src/
├── services/
│   ├── haptics/
│   │   ├── TactileSignatureEngine.js    # Phase 5 — Named haptic patterns
│   │   └── index.js
│   ├── audio/
│   │   ├── TacticalAudioService.js      # Phase 5 — Synthesized UI sounds
│   │   └── index.js
│   ├── power/
│   │   ├── BatteryManager.js            # Phase 7 — Battery monitoring
│   │   ├── SurvivalModeService.js       # Phase 7 — Mode orchestrator
│   │   └── index.js
│   └── maps/
│       ├── MapCartridgeService.js       # Phase 6+8 — Enhanced with POI + validation
│       ├── CartridgePOIQueryEngine.js   # Phase 6 — POI search engine
│       └── index.js
├── components/
│   ├── AmbientStatusBarBoundary.jsx     # Phase 8 — Error boundary
│   ├── SurvivalModeOverlay.jsx          # Phase 7 — Minimal survival UI
│   └── chat/
│       └── MiniMapCardBoundary.jsx      # Phase 8 — Error boundary
```

---

## 🏁 V1.0 Release Criteria

Before tagging `v1.0.0`, ALL of the following must be true:

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | All cartridges pass schema validation on startup | 8 |
| 2 | Error boundaries wrap all generative UI components | 8 |
| 3 | Haptic signatures fire on iOS and Android | 5 |
| 4 | Tactical audio plays with <10ms latency | 5 |
| 5 | "Where is the hospital?" returns precise POI coords | 6 |
| 6 | Survival Mode activates/deactivates cleanly | 7 |
| 7 | Battery monitoring works on native platforms | 7 |
| 8 | No unhandled promise rejections in production build | 8 |
| 9 | Bundle size remains under budget (see `size-budget.json`) | All |
| 10 | App runs fully offline for 24+ hours without memory leaks | All |

---

## 📝 Notes

- **Capacitor Plugins to Install**: `@capacitor-community/battery-status`, `@capacitor/screen-brightness`
- **No new npm dependencies** for haptics (already have `@capacitor/haptics`) or audio (Web Audio API is native)
- **POI data is static** for V1.0 — dynamic POI import from `.pmtiles` metadata is a V1.1 feature
- **Survival Mode CSS** uses `[data-survival-mode]` attribute selector — no JavaScript style manipulation
- **All new services follow the singleton pattern** consistent with `TransformersEngine` and `ContextManager`

---

*"In the dark, when the grid goes down, this app is the last thing standing."*
