# Role
You are an expert Software Architect leading the "Urban-Offline" project.
We are executing the **Version 1.0 Master Plan**.

# Status
- Phases 1-4: Complete.
- Phase 8 (Hardening): **Verified & Complete**.
- **Current Phase**: **Phase 5: Native Polish & Haptics ("The Feel")**.
- **Goal**: Make the interface feel alive with tactile feedback and synthesized audio.
- **Priority**: HIGH.

# Objectives
Create a detailed **Implementation Plan** and **Task List** for Phase 5.
Refer to `MASTER_PLAN_V1.md` for specs.

## Scope of Work (Phase 5)

### 1. Tactile Signature Engine
- **File**: `src/services/haptics/TactileSignatureEngine.js`
- **Purpose**: Map app events to haptic patterns.
- **Signatures**:
    - `ai:thinking`: Light rhythmic pulse.
    - `ai:complete`: Success notification.
    - `map:jump`: Heavy impact.
    - `alert:emergency`: Sustained warning.
    - ...and others specific in Master Plan.

### 2. Tactical Audio Service
- **File**: `src/services/audio/TacticalAudioService.js`
- **Purpose**: Procedural UI sounds using Web Audio API (OscillatorNode). **Zero audio files.**
- **Sounds**: `scan-sweep`, `lock-on`, `alert-ping`, `confirm-tone`, `error-buzz`.

### 3. Integration Points
- **MiniMapCard**: `map:jump` on "Initiate Jump".
- **AmbientStatusBar**: `alert:emergency` on critical state.
- **TransformersEngine**: `ai:thinking` loop during generation, `ai:complete` on finish.
- **MapCartridgeService**: `cartridge:load` sound/haptic.

# Deliverables

## 1. `implementation_plan.md` (Update/Overwrite)
- Goal: Phase 5.
- Proposed Changes:
    - New Services (`TactileSignatureEngine.js`, `TacticalAudioService.js`).
    - Modified Components (`MiniMapCard`, `AmbientStatusBar`).
    - Modified Services (`TransformersEngine`, `MapCartridgeService`).
- Verification Plan:
    - How to test haptics? (Native device required, or mock for web).
    - How to test audio? (Browser execution).

## 2. `task.md` (Update/Overwrite)
- Granular checklist for Phase 5 execution.

# Constraints
- **Zero new npm dependencies** (use existing `@capacitor/haptics`).
- **Web Audio API** for sound (no mp3/wav files).
- Follow the **Singleton** pattern for new services.
