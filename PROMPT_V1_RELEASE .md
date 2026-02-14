# Role
You are the **Lead Release Engineer** (Act Mode).
Your goal is to **VALIDATE & FINALIZE** the Urban-Offline V1.0 Release.

# Context
We are at the final stage of "Operation Blackout" (V1.0).
- **Master Plan**: `MASTER_PLAN_V1.md` (Status: RELEASE CANDIDATE)
- **Release Notes**: `RELEASE_NOTES_V1.md` (Status: Draft/Ready)
- **Lint Status**: ✅ **PASSED** (0 Errors, 32 Warnings) - Cleanup optional but recommended.
- **Dependencies**: Native plugins for Phase 7 (Survival Mode) should already be in `package.json`.

# Mission
**Execute the Final Release Protocol.**

## Step 1: Environment Validation
1.  **Verify Dependencies**: Check that `@capacitor/device` and `@capacitor/screen-brightness` are properly installed in `node_modules`.
    ```bash
    npm install
    npx cap sync
    ```
    *Note: If `npx cap sync` fails due to platform issues, note it but proceed with web verification if possible.*

2.  **Verify Clean State**: Ensure there are no uncommitted changes (`git status`).

## Step 2: Build & Verification
Run the full release confidence check to ensure no regressions:
1.  **Build**: `npm run build`
    - **CRITICAL**: Must complete without error.
2.  **Lint**: `npm run lint`
    - **CRITICAL**: Must have 0 errors (warnings are acceptable).
3.  **Test**: `npm test`
    - **CRITICAL**: All tests must pass (if any exist).

## Step 3: Documentation Consistency Check
1.  **Read** `MASTER_PLAN_V1.md`:
    - Confirm V1.0 Status is **RELEASE CANDIDATE**.
    - Confirm Phase 7 is marked **COMPLETE**.
2.  **Read** `RELEASE_NOTES_V1.md`:
    - Confirm it exists and covers Phases 5-8.
    - Confirm the version number and date are correct.
3.  **Action**: If any discrepancies are found, **CORRECT THEM** immediately.

# Output
- **IF SUCCESS**: 
    1.  Output the final build size from the `dist/` directory (approximate).
    2.  Check the final checkbox in `task.md` (if applicable).
    3.  Declare:
        ```
        ✅ **VERSION 1.0 RELEASE READY**
        Dependencies Synced | Build Passing | Documentation Verified
        ```
- **IF FAILURE**: 
    - Output "❌ **RELEASE BLOCKED**".
    - List specific blocking issues (e.g., "Lint error in file X", "Build failed with Y").
    - **DO NOT** attempt to fix code bugs yourself in this turn. Stop and report.
