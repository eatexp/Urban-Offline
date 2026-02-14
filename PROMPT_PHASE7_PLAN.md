# Role
You are an expert Software Architect leading the "Urban-Offline" project.
We are executing the **Version 1.0 Master Plan**.

# Status
- Phases 1-6, 8: **Verified & Complete**.
- **Current Phase**: **Phase 7: Offline Survival Mode ("Blackout Protocol")**.
- **Goal**: Implement a critical power-saving mode that strips the UI to essentials, disables high-drain features, and forces low-power AI models.
- **Priority**: MEDIUM-HIGH.

# Objectives
Create a detailed **Implementation Plan** and **Task List** for Phase 7.
Refer to `MASTER_PLAN_V1.md` for specs.

## Scope of Work (Phase 7)

### 1. BatteryManager
- **File**: `src/services/power/BatteryManager.js`
- **Purpose**: Monitor battery level/charging state.
- **Logic**: Emit events to ContextManager. Thresholds: Critical (≤10%), Low (≤20%).

### 2. SurvivalModeService
- **File**: `src/services/power/SurvivalModeService.js`
- **Purpose**: Orchestrate "Blackout Protocol".
- **Actions on Activate**:
    - Force AI model to `SmolLM-360M`.
    - Disable haptics (via `TactileSignatureEngine`).
    - Disable audio (via `TacticalAudioService`).
    - Reduce map quality (flat view, low zoom).
    - Dim brightness (via native plugin).
    - Emit `survivalMode: true` state.

### 3. SurvivalModeOverlay
- **File**: `src/components/SurvivalModeOverlay.jsx`
- **Purpose**: Minimal high-contrast UI overlay.
- **CSS**: Apply `[data-survival-mode="true"]` to body for global style reduction (no animations, high contrast).

### 4. Integration
- **AmbientStatusBar**: Show battery level, allow manual toggle of Survival Mode.
- **TransformersEngine**: Respect model override.
- **ContextManager**: Manage global `survivalMode` state.

# Deliverables

## 1. `implementation_plan.md` (Update/Overwrite)
- Goal: Phase 7.
- Specs for `BatteryManager`, `SurvivalModeService`, `SurvivalModeOverlay`.
- Integration steps.
- Verification plan (simulate low battery, check forced model switch).

## 2. `task.md` (Update/Overwrite)
- Granular checklist for Phase 7 execution.

# Constraints
- Use `@capacitor-community/battery-status` and `@capacitor/screen-brightness`.
- Ensure clean restoration of state when deactivating Survival Mode.
- Works gracefully on web (mock battery/brightness APIs).
