# Phase 7: Offline Survival Mode ("Blackout Protocol") — Implementation Plan

**Status**: ✅ **IMPLEMENTED** — Verification & Testing Required  
**Priority**: MEDIUM-HIGH  
**Estimated Effort**: 1.5 weeks (Implementation Complete, Testing Pending)  
**Dependencies**: Phase 5 (Haptics/Audio) ✅, Phase 6 (AI Model Switching) ✅  
**Goal**: Critical power-saving mode that strips UI to essentials, disables high-drain features, and forces low-power AI models.

---

## Executive Summary

Phase 7 "Blackout Protocol" has been **fully implemented**. All core services, UI components, and integrations are in place:

| Component | Status | File |
|-----------|--------|------|
| BatteryManager | ✅ Implemented | `src/services/power/BatteryManager.js` |
| SurvivalModeService | ✅ Implemented | `src/services/power/SurvivalModeService.js` |
| SurvivalModeOverlay | ✅ Implemented | `src/components/SurvivalModeOverlay.jsx` |
| AmbientStatusBar Integration | ✅ Implemented | `src/components/AmbientStatusBar.jsx` |
| Layout Integration | ✅ Implemented | `src/components/Layout.jsx` |
| Global CSS Styles | ✅ Implemented | `src/index.css` |
| ContextManager State | ✅ Implemented | `src/services/context/ContextManager.js` |
| Power Services Barrel | ✅ Implemented | `src/services/power/index.js` |

**Remaining Work**: End-to-end verification, native platform testing, and documentation updates.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BLACKOUT PROTOCOL FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐  │
│   │  BatteryManager │────▶│ SurvivalModeService │────▶│  ContextManager │  │
│   │                 │     │                     │     │                 │  │
│   │ - Web API       │     │ - Orchestrate       │     │ - Global State  │  │
│   │ - Native Plugin │     │ - Restore State     │     │ - survivalMode  │  │
│   │ - Thresholds    │     │ - Model Override    │     │ - Emit Events   │  │
│   └─────────────────┘     └─────────────────────┘     └─────────────────┘  │
│            │                        │                          │            │
│            ▼                        ▼                          ▼            │
│   ┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐  │
│   │  Transformers   │     │  TactileSignature   │     │  TacticalAudio  │  │
│   │    Engine       │     │      Engine         │     │     Service     │  │
│   │                 │     │                     │     │                 │  │
│   │ switchModel()   │     │ setEnabled(false)   │     │ setEnabled(false│  │
│   └─────────────────┘     └─────────────────────┘     └─────────────────┘  │
│                                                                             │
│                              ┌─────────────────────┐                        │
│                              │ SurvivalModeOverlay │                        │
│                              │                     │                        │
│                              │ - Minimal UI        │                        │
│                              │ - [data-survival]   │                        │
│                              │ - Manual Toggle     │                        │
│                              └─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Status

### 1. BatteryManager — ✅ COMPLETE

**File**: `src/services/power/BatteryManager.js`

**Implemented Features**:
- ✅ Singleton pattern with `getInstance()`
- ✅ Web Battery API support (`navigator.getBattery()`)
- ✅ Native plugin support (`@capacitor-community/battery-status`)
- ✅ Threshold detection (CRITICAL: ≤10%, LOW: ≤20%, NORMAL: >20%)
- ✅ Event emission to ContextManager
- ✅ Platform detection (web vs native)
- ✅ Graceful degradation when APIs unavailable
- ✅ Cleanup/stop method for listeners

**API**:
```javascript
BatteryManager.getInstance()           // ✅ Singleton accessor
async initialize()                     // ✅ Start monitoring
getCurrentLevel()                      // ✅ 0-100 integer
isCharging()                           // ✅ boolean
getBatteryState()                      // ✅ 'critical' | 'low' | 'normal'
isCritical()                           // ✅ ≤10%
isLow()                                // ✅ ≤20%
stop()                                 // ✅ Cleanup listeners
```

---

### 2. SurvivalModeService — ✅ COMPLETE

**File**: `src/services/power/SurvivalModeService.js`

**Implemented Features**:
- ✅ Singleton pattern with concurrency guards (`_isProcessing`)
- ✅ Full activation flow with 8 steps
- ✅ Full deactivation flow with state restoration
- ✅ AI model switching to `smollm-360m`
- ✅ Haptics disable/enable via `TactileSignatureEngine`
- ✅ Audio disable/enable via `TacticalAudioService`
- ✅ Screen brightness control (native only via `@capacitor/screen-brightness`)
- ✅ CSS attribute management (`data-survival-mode`)
- ✅ ContextManager state updates
- ✅ Entry haptic signature (`survival:enter`)
- ✅ Rollback on activation failure
- ✅ State change listeners

**Configuration**:
```javascript
const SURVIVAL_CONFIG = {
    targetModel: 'smollm-360m',     // ✅ SmolLM-360M for lowest power
    screenBrightness: 0.2,          // ✅ 20% brightness
    maxMapZoom: 14,                 // ✅ Reduced from 18
    mapPitch: 0,                    // ✅ Flat 2D view only
    disableAnimations: true,        // ✅ Via CSS
    disableHaptics: true,           // ✅ Implemented
    disableAudio: true,             // ✅ Implemented
    reducedTileQuality: true        // ✅ Via CSS
};
```

**API**:
```javascript
SurvivalModeService.getInstance()      // ✅ Singleton accessor
async activate()                       // ✅ Enter Survival Mode
async deactivate()                     // ✅ Exit Survival Mode
async toggle()                         // ✅ Toggle current state
isActive()                             // ✅ Get current state
getConfig()                            // ✅ Get SURVIVAL_CONFIG
onStateChange(callback)                // ✅ Subscribe to changes
```

---

### 3. SurvivalModeOverlay — ✅ COMPLETE

**File**: `src/components/SurvivalModeOverlay.jsx`

**Implemented Features**:
- ✅ Conditional rendering (only when survival mode active)
- ✅ Sticky header with amber/red accent
- ✅ Real-time battery level display
- ✅ Charging status indicator
- ✅ Current AI model display
- ✅ Battery color coding (green/amber/red)
- ✅ Exit button with confirmation modal
- ✅ Responsive design (mobile/desktop)
- ✅ ContextManager subscription for live updates

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│ ⚡ SURVIVAL MODE    [Active]              [EXIT]        │
│ Battery: 8% • Model: SmolLM-360M • 2h remaining         │
├─────────────────────────────────────────────────────────┤
│   (Normal app content renders below with reduced        │
│    styling applied via [data-survival-mode] CSS)        │
└─────────────────────────────────────────────────────────┘
```

---

### 4. ContextManager Integration — ✅ COMPLETE

**File**: `src/services/context/ContextManager.js`

**Implemented Features**:
- ✅ `survivalMode` object in state:
  - `active: boolean`
  - `activatedAt: timestamp`
  - `estimatedEndTime: timestamp`
- ✅ `setSurvivalMode(active)` method
- ✅ `getSurvivalMode()` method
- ✅ Battery state tracking (`batteryState: 'critical' | 'low' | 'normal'`)
- ✅ `[SURVIVAL_MODE]: ACTIVE/Inactive` in `getSystemContext()`

---

### 5. AmbientStatusBar Integration — ✅ COMPLETE

**File**: `src/components/AmbientStatusBar.jsx`

**Implemented Features**:
- ✅ Battery level display with color coding:
  - Green (>20%): `text-emerald-400`
  - Amber (10-20%): `text-amber-400`
  - Red (<10%): `text-red-400 animate-pulse`
- ✅ Auto-prompt at critical battery (≤10%):
  - Red warning box with "Critical Battery" message
  - "Activate" and "Dismiss" buttons
  - Prevents re-prompt after dismiss (uses `promptDismissed` state)
- ✅ Survival Mode status row (when active):
  - Zap icon with "Active" status
  - "Blackout Protocol" detail
- ✅ Manual toggle buttons:
  - "Deactivate Survival Mode" (when active)
  - "Activate Survival Mode" (when battery ≤20% and inactive)
- ✅ Emergency haptic signature on critical battery

---

### 6. Global CSS Styles — ✅ COMPLETE

**File**: `src/index.css`

**Implemented Rules**:
- ✅ `[data-survival-mode="true"]` attribute selector on `<body>`
- ✅ `color-scheme: dark` for OLED power savings
- ✅ Animation disabling (`animation: none !important`)
- ✅ Transition disabling (`transition: none !important`)
- ✅ Custom animation variable overrides
- ✅ High contrast color overrides
- ✅ Backdrop filter removal (`backdrop-filter: none !important`)
- ✅ Box shadow removal (`box-shadow: none !important`)
- ✅ Binary opacity for text elements
- ✅ Map tile indicator removal
- ✅ Monochrome icon filter (`grayscale(100%)`)
- ✅ Simplified status bar styling

---

### 7. Layout Integration — ✅ COMPLETE

**File**: `src/components/Layout.jsx`

**Implemented Features**:
- ✅ `SurvivalModeOverlay` component imported and rendered
- ✅ Body attribute sync effect:
  - Subscribes to ContextManager
  - Sets/removes `data-survival-mode` attribute
  - Cleans up subscription on unmount

---

### 8. Power Services Barrel — ✅ COMPLETE

**File**: `src/services/power/index.js`

**Exports**:
```javascript
export { default as BatteryManager } from './BatteryManager';
export { default as SurvivalModeService } from './SurvivalModeService';
```

---

## Verification Plan

### Phase 7 Verification Checklist

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| 1 | BatteryManager on Web | Shows battery level via `navigator.getBattery()` | ⏳ |
| 2 | BatteryManager on Native | Shows battery level via plugin | ⏳ |
| 3 | Threshold Detection | CRITICAL (≤10%), LOW (≤20%) correctly identified | ⏳ |
| 4 | Survival Mode Activation | AI switches to SmolLM-360M within 3 seconds | ⏳ |
| 5 | Haptics Disable | No haptic feedback in Survival Mode | ⏳ |
| 6 | Audio Disable | No tactical audio in Survival Mode | ⏳ |
| 7 | Brightness Dim (Native) | Screen dims to 20% on native devices | ⏳ |
| 8 | CSS Style Reduction | Animations disabled, high contrast applied | ⏳ |
| 9 | Overlay Render | SurvivalModeOverlay shows when active | ⏳ |
| 10 | Manual Toggle | Can activate/deactivate from AmbientStatusBar | ⏳ |
| 11 | Auto-Prompt | Confirmation modal at ≤10% battery | ⏳ |
| 12 | State Restoration | All settings restored on deactivation | ⏳ |
| 13 | Web Graceful Degradation | Skips native-only features on web | ⏳ |
| 14 | Concurrent Switch Guard | Prevents multiple simultaneous model switches | ⏳ |

---

## Dependencies

### NPM Packages (Required)
```json
{
    "@capacitor-community/battery-status": "^6.0.0",
    "@capacitor/screen-brightness": "^6.0.0"
}
```

**Status**: ⏳ Need to verify installation in `package.json`

### Existing Services (Verified)
- ✅ `TransformersEngine.switchModel()` — exists and functional
- ✅ `TactileSignatureEngine.setEnabled()` — exists and functional
- ✅ `TacticalAudioService.setEnabled()` — exists and functional
- ✅ `ContextManager.setSurvivalMode()` — exists and functional

---

## Integration Points Summary

| Integration Point | Status | Implementation |
|-------------------|--------|----------------|
| BatteryManager → ContextManager | ✅ | Emits battery, charging, batteryState |
| SurvivalModeService → TransformersEngine | ✅ | Calls `switchModel('smollm-360m')` |
| SurvivalModeService → TactileSignatureEngine | ✅ | Calls `setEnabled(false/true)` |
| SurvivalModeService → TacticalAudioService | ✅ | Calls `setEnabled(false/true)` |
| SurvivalModeService → ContextManager | ✅ | Calls `setSurvivalMode(true/false)` |
| SurvivalModeService → CSS (body attr) | ✅ | Sets/removes `data-survival-mode` |
| AmbientStatusBar → SurvivalModeService | ✅ | Calls `activate()` / `deactivate()` |
| AmbientStatusBar → BatteryManager | ✅ | Reads battery state from ContextManager |
| Layout → SurvivalModeOverlay | ✅ | Renders overlay component |
| Layout → CSS Sync | ✅ | Syncs body attribute with ContextManager |

---

## Risk Assessment

| Risk | Severity | Status | Mitigation |
|------|----------|--------|------------|
| Battery API unsupported | Low | ✅ Handled | Graceful fallback to "Unknown" |
| Model switch fails | Medium | ✅ Handled | Error boundary, stay on current model |
| Brightness plugin fails | Low | ✅ Handled | Skip on web, alert on native |
| State corruption on crash | Medium | ⏳ Pending | Persist state, validate on restore |
| User can't exit | High | ✅ Handled | Always provide exit mechanism |

---

## Success Metrics

- [ ] All 14 verification tests pass
- [ ] Battery monitoring works on web and native
- [ ] Model switches in < 3 seconds
- [ ] No console errors in Survival Mode
- [ ] UI remains responsive at 20% brightness
- [ ] State restores correctly on deactivation
- [ ] Bundle size increase < 5KB (excluding plugins)

---

## Next Steps

1. **Verify Capacitor plugins installed**:
   ```bash
   npm list @capacitor-community/battery-status @capacitor/screen-brightness
   ```

2. **Run verification tests** (14 test cases above)

3. **Test on physical devices**:
   - iOS device (check brightness control)
   - Android device (check brightness control)
   - Web (Chrome with Battery API)

4. **Update documentation**:
   - Mark Phase 7 as COMPLETE in MASTER_PLAN_V1.md
   - Update task.md with verification results

5. **Performance validation**:
   - Measure model switch time
   - Verify bundle size impact

---

## Notes

- **All new services follow the singleton pattern** consistent with `TransformersEngine` and `ContextManager`
- **Survival Mode CSS** uses `[data-survival-mode]` attribute selector — no JavaScript style manipulation
- **Auto-trigger requires user confirmation** — no forced activation except extreme emergency scenarios
- **State restoration** handles edge cases (model no longer cached, brightness plugin failure)

---

*"When the grid goes down and battery is critical, Blackout Protocol ensures Urban-Offline is the last thing standing."*

**Last Updated**: 2026-02-13  
**Implementation Status**: ✅ COMPLETE  
**Verification Status**: ⏳ PENDING