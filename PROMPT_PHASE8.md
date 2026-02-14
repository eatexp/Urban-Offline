# Role
You are an expert Software Architect leading the "Urban-Offline" project. We are executing the **Version 1.0 Master Plan**.

# Status
- Phases 1-4 are **COMPLETE**.
- We are immediately starting **Phase 8: Production Hardening** (Critical Priority).
- This phase focuses on stability, error handling, and data validation before we add more features.

# Context
We are using React 19 + Capacitor 7.4.4. The app is offline-first.

## Current File Structure (src)
src/
├── components/
│   ├── chat/
│   │   ├── MiniMapCard.jsx
│   │   └── ...
│   ├── AmbientStatusBar.jsx
│   └── ...
├── services/
│   ├── maps/
│   │   ├── MapCartridgeService.js
│   │   └── ...
│   ├── power/ (Planned)
│   ├── haptics/ (Planned)
│   └── ...
└── ...

# Requirements (from MASTER_PLAN_V1.md)

## 🛡️ Phase 8: Production Hardening — *"Armor Plating"*
**Priority**: CRITICAL | **Estimated Effort**: 1 week | **Dependencies**: None — **execute first**

### 8.1 MapCartridgeService Validation
Modify `src/services/maps/MapCartridgeService.js` to include schema validation:
- Validate `id`, `title`, `payload.center`, `payload.zoom`.
- Validate coordinate bounds (lat [-90, 90], lon [-180, 180]).
- Validate zoom range [0, 22].
- Validate ID format (lowercase alphanumeric with hyphens).
- Validate `pois` array if present.
- **Action**: Log and exclude invalid cartridges; do not crash.

### 8.2 Component Error Boundaries
Create targeted error boundaries:
1.  **MiniMapCardBoundary.jsx** (`src/components/chat/MiniMapCardBoundary.jsx`)
    - Wraps `MiniMapCard`.
    - Fallback: Plain text location + coords + "Retry" button.
2.  **AmbientStatusBarBoundary.jsx** (`src/components/AmbientStatusBarBoundary.jsx`)
    - Wraps `AmbientStatusBar`.
    - Fallback: Minimal status indicator.

### 8.3 Additional Hardening Tasks
- **Input Sanitization**: Sanitize search queries in `MapCartridgeService.js` before matching.
- **Model Switch Guard**: In `TransformersEngine.js`, prevent concurrent `switchModel()` calls.
- **Render Guard**: In `MiniMapCard.jsx`, validate props (coords, zoom) before rendering to prevent Leaflet errors.

# Your Task
1.  **Review** the current `implementation_plan.md` (if it exists) and `task.md`.
2.  **Create/Update `implementation_plan.md`** specifically for **Phase 8**. detailed steps for each of the 3 sub-sections (Validation, Boundaries, Guards).
3.  **Update `task.md`** with a granular checklist for Phase 8.
    *   [ ] Validator implementation
    *   [ ] Error Boundary creation
    *   [ ] Integration of boundaries
    *   [ ] Guard implementation
4.  **Do not write code yet.** Your output for this turn is the PLAN and the TASK LIST.

# Output
Prioritize creating the `implementation_plan.md` and `task.md` artifacts.
