# Role
You are an expert Software Architect leading the "Urban-Offline" project.
We are executing the **Version 1.0 Master Plan**.

# Status
- Phases 1-5, 8: **Verified & Complete**.
- **Current Phase**: **Phase 6: AI-Enhanced Cartridges ("Smart Maps")**.
- **Goal**: Enable the AI to *understand* map data, query POIs, and emit enhanced map tags.
- **Priority**: HIGH.

# Objectives
Create a detailed **Implementation Plan** and **Task List** for Phase 6.
Refer to `MASTER_PLAN_V1.md` for specs.

## Scope of Work (Phase 6)

### 1. POI Database Schema
- **Target**: `src/services/maps/MapCartridgeService.js` (and cartridge definitions).
- **Update**: Extend cartridge objects with `pois: []`.
    - Fields: `name`, `type` (hospital, transport, etc.), `coords` [lon, lat], `tags`, `priority`, `description`.
- **Constraint**: Define schema but use *static* data for V1.0 (no external file loading yet).

### 2. CartridgePOIQueryEngine
- **File**: `src/services/maps/CartridgePOIQueryEngine.js` (**NEW**)
- **Purpose**: Search within loaded cartridges for POIs.
- **Methods**:
    - `queryPOI(keywords)`: Fuzzy match tags/names. Scoring algorithm (matches * 0.6 + priority * 0.3).
    - `getNearbyPOIs(coords, radius)`: Geo-search.
    - `getPOIsByType(type)`.

### 3. ActionRouter Integration
- **Target**: `src/services/clawdBot/ActionRouter.js` (or `TransformersEngine` depending on current flow).
- **Logic**:
    - Intercept location queries.
    - Use `CartridgePOIQueryEngine` first.
    - If high-confidence POI found, emit `<<MAP: Name | poi:true | coords:...>>`.
    - Else fallback to sector match.

### 4. Enhanced `<<MAP:>>` Tags
- **Target**: `src/components/MessageBubble.jsx`.
- **Logic**: Update regex/parser to handle enhanced format:
    - `<<MAP: St Thomas | poi:true | coords:-0.12,51.50 | zoom:16>>`.
    - Pass these props to `MiniMapCard`.

### 5. MiniMapCard Updates
- **Target**: `src/components/chat/MiniMapCard.jsx`.
- **Update**:
    - Accept `zoom` prop (override default 14).
    - Show POI marker/icon if `poi:true`.

# Deliverables

## 1. `implementation_plan.md` (Update/Overwrite)
- Goal: Phase 6.
- Proposed Changes:
    - `CartridgePOIQueryEngine.js`.
    - `MapCartridgeService.js` (add POIs).
    - `MessageBubble.jsx` (Parser).
    - `MiniMapCard.jsx` (POI support).
    - `ActionRouter.js` (if exists) or `MapCartridgeService` search logic.
- Verification:
    - Test "Where is the hospital?" -> Returns POI coords.
    - Test standard sector fallback.

## 2. `task.md` (Update/Overwrite)
- Granular checklist for Phase 6 execution.

# Constraints
- POI data is static for now (hardcoded in cartridges).
- Keep regex robust (backward compatibility with simple `<<MAP: London>>`).
