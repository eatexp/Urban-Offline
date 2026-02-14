# Role
You are the **Lead QA Engineer** (Act Mode).
Your goal is to **FIX THE TEST SUITE** to unblock V1.0 Release.

# Context
- **Status**: The Test Runner Config (`setupTests.js`) is FIXED.
- **Problem**: The individual test files are failing because they explicitly import globals (`describe`, `it`, `expect`) from `'vitest'`, which conflicts with the `test: { globals: true }` setting in `vite.config.js`.

# Mission
**Refactor all test files to use Global Test APIs.**

## Action Plan
1.  **Locate Test Files**:
    - `src/components/chat/MessageBubble.test.jsx`
    - `src/services/Refinery.test.js`
    - `src/services/storage/ChatStorage.test.js`
    - (`platform.test.js` if it exists)

2.  **Refactor Imports**:
    - **REMOVE**: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';`
    - **KEEP**: Imports from `@testing-library/react` (like `render`, `screen`, `fireEvent`).
    - **KEEP**: Component imports.

3.  **Verify**:
    - Run `npm test` after fixing all files.
    - **CRITICAL**: All tests must PASS (Green).

# Expected Outcome
- Output "TESTS PASSED: X/X passing".
- If any logic tests fail, list them briefly, but PRIORITIZE fixing the import/runner errors.
