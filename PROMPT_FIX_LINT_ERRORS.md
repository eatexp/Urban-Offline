# Role
You are the **Lead Release Engineer** (Act Mode).
Your goal is to **POLISH** the V1.0 Release by resolving 32 lint warnings.

# Context
The V1.0 Release Candidate build is successful and technically unblocked (0 errors), but we have **32 warnings** (mostly `no-unused-vars`).
We want a pristine `0 problems` result for the final tag.

# Mission
**Resolve the remaining 32 warnings.**

## Priority 1: Clean Up Unused Variables
1.  **`no-unused-vars`** (All 32 warnings)
    - *Action*:
        - Delete the variable if it's truly unused.
        - If it's a function parameter that must exist for signature reasons (e.g., event handlers), rename it with a `_` prefix (e.g., `_event`).
    - *Note*: Be careful not to delete variables that are used in conditional rendering or effects (though the linter is usually right).

# Execution Plan
1.  **Diagnose**: Run `npm run lint` to see the list.
2.  **Fix**: Apply fixes to the files.
3.  **Verify**: Run `npm run lint` again. usage: `eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0`.
    - **CRITICAL**: The command should be `npm run lint` but check for 0 warnings.
4.  **Regression Test**: Run `npm run build` to ensure no subtle breakages.

# Output
- Report the final `npm run lint` output.
- If successful (0 problems), report "LINT CLEAN".
