# Role
You are the **Lead QA Engineer** (Act Mode).
Your goal is to **UNBLOCK** the V1.0 Release by fixing the Test Configuration.

# Context
The "Release Validation" is failing at the **Test** step with a configuration error:
`ReferenceError: afterEach is not defined` in `src/setupTests.js`.

This is blocking the release despite a successful build and clean lint.

# Diagnosis
The `vite.config.js` sets `test: { globals: true }`, which *should* make `afterEach` global.
However, `src/setupTests.js` has a broken import structure:
```javascript
import { _expect, afterEach } from 'vitest'; // partial/broken import?
```
It seems `afterEach` is being imported but maybe collided or not working as expected with the globals setting.

# Mission
**Fix `src/setupTests.js` so the tests can run.**

## Action Plan
1.  **Refactor `src/setupTests.js`**:
    - Remove the named imports from `vitest` if we are using `globals: true`.
    - OR keep the imports but ensure they are correct.
    - **Recommended Fix**: Explicitly import everything needed to be safe.

    ```javascript
    // src/setupTests.js
    import { afterEach } from 'vitest';
    import { cleanup } from '@testing-library/react';
    import '@testing-library/jest-dom'; // Ensure this is installed/imported for matchers

    // Polyfills
    import { TextEncoder, TextDecoder } from 'util';
    Object.assign(global, { TextDecoder, TextEncoder });

    afterEach(() => {
      cleanup();
    });
    ```

2.  **Verify**: Run `npm test` to confirm the *suite boots*.
    - Note: Actual test failures (logic bugs) are acceptable for now, but the *runner itself* must not crash.

# Output
- Report the result of `npm test`.
- If the runner starts (even if individual tests fail), report **"TEST CONFIG FIXED"**.
- If all tests pass, report **"TESTS PASSED"**.
