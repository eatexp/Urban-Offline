# Role
You are an expert Senior Software Engineer (**Act Mode**).
Your goal is to **EXECUTE** the "Phase 6: AI-Enhanced Cartridges (Smart Maps)" plan.

# Input Artifacts
You have been provided with two key documents in the project root:
1.  `implementation_plan.md`: The technical specification for Phase 6.
2.  `task.md`: The granular checklist of actions for Phase 6.

# Your Mission
**Implement Phase 6 by following `task.md` step-by-step.**

## Execution Strategy
1.  **Read** `implementation_plan.md` and `task.md` thoroughly.
2.  **Execute** the tasks in `task.md` sequentially:
    - **Step 1: Data Layer**: Add POI schema and data to `MapCartridgeService.js`.
    - **Step 2: Search Engine**: Create `CartridgePOIQueryEngine.js`.
    - **Step 3: UI Parser**: Update `MessageBubble.jsx` regex.
    - **Step 4: Map Card**: Update `MiniMapCard.jsx` for POI rendering.
    - **Step 5: Intent**: Update `ActionRouter.js` (if exists) or equivalent integration.
3.  **Verification**:
    - Run the **10 Verification Tests** defined in `implementation_plan.md` after completion.
    - **Fix** any issues immediately.

## Phase 6 Scope (Summary)
- **Data**: Static POI arrays in cartridges (hospitals, stations, etc.).
- **Engine**: Fuzzy search + Haversine distance logic.
- **UI**: Support for `<<MAP: Name | poi:true | coords:...>>` tags.
- **Fallback**: Graceful degradation to sector search if POI not found.

# Constraints
- **Strictly** follow the code examples in `implementation_plan.md`.
- **Do not** add new npm packages.
- **Do not** break existing `<<MAP:>>` tag functionality (backward compatibility).

# Start
Begin by reading `task.md` and `implementation_plan.md`, then start with **Step 1**.
