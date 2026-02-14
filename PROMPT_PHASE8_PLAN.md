# Role
You are an expert Software Architect leading the "Urban-Offline" project.
We are executing the **Version 1.0 Master Plan** (`MASTER_PLAN_V1.md`).

# Status
- **Current Phase**: Phase 8 - Production Hardening ("Armor Plating").
- **Goal**: Bulletproof the codebase before adding new features.
- **Priority**: CRITICAL.

# Objectives
You need to create a detailed **Implementation Plan** and **Task List** for Phase 8.
Refer to `MASTER_PLAN_V1.md` for the single source of truth.

## Scope of Work (Phase 8)

### 1. MapCartridgeService Validation
- **Target**: `src/services/maps/MapCartridgeService.js`
- **Logic**: Implement `validateCartridge(cartridge)` schema validation.
    - Required: `id`, `title`, `category`, `payload.center`, `payload.zoom`.
    - Bounds: Lat [-90, 90], Lon [-180, 180], Zoom [0, 22].
    - Pattern: `id` must be lowercase alphanumeric with hyphens.
- **Lifecycle**: Run validation on service initialization for all `INSTALLED_CARTRIDGES`.
- **Handling**: Log warnings for invalid cartridges; **do not crash**. Exclude them from the active list.

### 2. Component Error Boundaries
Create two new boundary components:
- **`src/components/chat/MiniMapCardBoundary.jsx`**:
    - Wraps `MiniMapCard`.
    - Fallback UI: "⚠️ Map card failed to render" + Location Name + Coords + [Retry] button.
- **`src/components/AmbientStatusBarBoundary.jsx`**:
    - Wraps `AmbientStatusBar`.
    - Fallback UI: "📡 Status bar unavailable" + [Tap to retry].

### 3. Additional Hardening
- **Input Sanitization**: In `MapCartridgeService.js`, sanitize search queries (trim, remove special chars) before matching.
- **Model Switch Guard**: In `TransformersEngine.js`, add a lock/flag to prevent concurrent calls to `switchModel()`.
- **Render Guard**: In `MiniMapCard.jsx`, valid props (coords exist, zoom is number) before returning JSX.
- **Context State Freeze**: In `ContextManager.js`, deep-freeze the state object in `_notify()` or `getState()` to prevent accidental mutation by consumers.

# deliverables

## 1. `implementation_plan.md`
Create a new plan (overwrite existing) with:
- **Goal Description**: Summary of Phase 8.
- **Proposed Changes**: Group by file.
    - `src/services/maps/MapCartridgeService.js` (Validation + Sanitization)
    - `src/components/chat/MiniMapCardBoundary.jsx` (New)
    - `src/components/AmbientStatusBarBoundary.jsx` (New)
    - `src/services/ai/TransformersEngine.js` (Switch Guard)
    - `src/services/context/ContextManager.js` (State Freeze)
    - `src/components/chat/MiniMapCard.jsx` (Render Guard)
    - `src/App.jsx` or parent components (To implement the Boundaries)
- **Verification Plan**:
    - **Automated**: npm test commands (if applicable).
    - **Manual**: Specific steps to trigger the errors (e.g., "Corrupt a cartridge ID in code and reload to verify warning").

## 2. `task.md`
Create a granular checklist for Kimi (Act Mode) to follow.
- Break down each component/service into:
    - [ ] Implement X
    - [ ] Add Tests/Validation for X
    - [ ] Verify X

# Constraints
- **DO NOT WRITE CODE** for the app yet. Only write the plan and task files.
- Strictly follow the file structure defined in `MASTER_PLAN_V1.md`.
