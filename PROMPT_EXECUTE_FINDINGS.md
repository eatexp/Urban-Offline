# EXECUTOR PROMPT: Urban-Offline Findings Implementation

## Your Role
You are the EXECUTOR AI. Your job is to implement the fixes documented in the findings report. You have full access to edit code, run tests, and verify your work.

## Context
- **Project:** Urban-Offline - An offline-first emergency preparedness application
- **Tech Stack:** React 19, Vite, Capacitor (iOS/Android), Transformers.js for local AI
- **Findings Document:** `.agent/findings.md` (READ THIS FIRST)

## Pre-Flight Checklist
Before writing any code:
1. [ ] Read `.agent/findings.md` completely
2. [ ] Read `.clinerules` for project coding standards
3. [ ] Run `npm run lint` to see current error state
4. [ ] Run `npm test` to see test status (will fail initially - that's expected)

## Execution Plan (Strict Priority Order)

### Phase 1: Unblock Tests (CRITICAL - Do First)
**Goal:** Make tests runnable

**Finding 3: Test Files Missing Vitest Import**
- Files:
  - `src/services/DownloadCheckpoint.test.js` (14 errors)
  - `src/services/contentPacks/ContentPackManager.test.js` (42 errors)
  - `src/utils/checksum.test.js` (9 errors)
- **Action:** Add `import { vi, describe, it, expect } from 'vitest';` to each file
- **Verify:** Run `npm test` - tests should at least start running (may still have failures)

### Phase 2: Core Reliability (HIGH PRIORITY)
**Goal:** Fix AI pipeline silent failures

**Finding 6: RAGPipeline Semantic Search Missing Retry**
- File: `src/services/ai/RAGPipeline.js` lines 66-72
- **Action:**
  1. Add user notification when semantic search fails (dispatch custom event)
  2. Store failure state in ContextManager
  3. Add `RAGPipeline.retrySemanticSearch()` method
  4. Update init() to attempt retry on subsequent calls
- **Pattern:** See existing event dispatch pattern in `InkService.dispatchCriticalContentWarning()`

**Finding 10: useChatSession Hook Missing Cleanup**
- File: `src/hooks/useChatSession.js` lines 99-115
- **Action:** Add `abortControllerRef.current = null;` after abort() in switchSession
- **Verify:** Compare with createNewSession() pattern at lines 82-86

### Phase 3: React Hook Fixes (MEDIUM PRIORITY)
**Goal:** Fix stale closure bugs

**Finding 1: React Hook Exhaustive Deps Warnings**
Fix in order:

1. **`src/hooks/useChatSession.js:53`**
   - Wrap `loadHistory` in `useCallback` with empty deps array
   - Or move function definition inside useEffect

2. **`src/pages/AIModels.jsx:83`**
   - Wrap `refreshModels` in `useCallback` with `[setModels, setInstalledModels, setActiveModel, setStorageUsed, setImportedModels]` deps

3. **`src/components/AmbientStatusBar.jsx:36`**
   - The `context` object is unstable - destructure into individual state values
   - Or add `context` to deps and memoize the context subscription

4. **`src/components/SurvivalModeOverlay.jsx:76`**
   - Add deps: `[contextManager, isActive, batteryLevel, isCharging, currentModel]`
   - Note: The queueMicrotask pattern is intentional - keep it

5. **`src/components/ZimImportManager.jsx:27`**
   - Wrap `loadZimImports` in `useCallback` or add to deps

**Verification:** Run `npm run lint` - these 5 warnings should disappear

### Phase 4: Code Quality (LOW PRIORITY - Do Last)
**Goal:** Clean up warnings and improve DX

**Finding 4: Fast Refresh Context Export Issues**
- Split files to export ONLY components:
  - `src/context/AppProvider.jsx` → Keep only AppProvider component
  - Create `src/context/AppContext.js` for context export
  - Create `src/context/useApp.js` for hook export
  - Repeat for `src/contexts/AIGeneratingContext.jsx`

**Finding 2: Unused Import Cleanup**
- **Decision Point:** Either implement checksum verification OR remove unused imports
- **Option A (Quick):** Remove `verifyChecksum`, `computeChecksumFromStream` imports from `AIModelManager.js`
- **Option B (Complete):** Implement actual checksum verification in `_downloadWithValidation()`
- **Recommendation:** Do Option A now, leave Option B for future sprint

**Finding 5: Native Storage Quota Event Inconsistency**
- File: `src/services/db.js` lines 60-75
- Add event dispatch matching web platform pattern (lines ~35-45)

**Finding 9: DownloadCheckpoint Unused Function**
- File: `src/services/DownloadCheckpoint.js:12`
- Remove `isValidChecksumFormat` or integrate it

**Finding 8: Logger Environment Detection**
- File: `src/utils/logger.js:18-19`
- Simplify to rely on `import.meta.env.PROD` for Vite

## Technical Standards (Follow Strictly)

### Import Order
```javascript
import React from 'react';  // React first
import { something } from 'external-lib';  // External libs second
import { internalService } from '../services/internal';  // Internal services third
import { MyComponent } from './MyComponent';  // Components fourth
import './styles.css';  // Styles last
```

### Logging Pattern
```javascript
import { createLogger } from '../utils/logger';
const log = createLogger('ComponentName');

// Usage
log.info('Message', { data });
log.error('Failed', error);
```

### Platform Detection
```javascript
import { isNativeMobile, isIOSNative, isAndroidNative } from '../utils/platform';

// NEVER do this:
if (navigator.userAgent.includes('iPhone'))  // WRONG

// ALWAYS do this:
if (isIOSNative())  // CORRECT
```

### Error Handling
```javascript
try {
  await operation();
} catch (error) {
  log.error('Operation failed', error);
  // Re-throw if caller needs to handle it
  throw error;
}
```

### Async Patterns
- Use async/await ONLY (no callbacks)
- Always handle errors with try/catch
- Use AbortController for cancellable operations

## Verification Steps (After Each Phase)

After completing each phase:

1. **Lint Check:** `npm run lint` should show fewer warnings than before
2. **Build Check:** `npm run build` should succeed
3. **Test Check:** `npm test` should show progress (tests running, not import errors)
4. **Manual Check:** For UI changes, verify in browser

## Success Criteria

- [ ] All test files import `vi` from vitest (Finding 3)
- [ ] RAGPipeline notifies users of semantic search failures (Finding 6)
- [ ] useChatSession properly clears abort controller (Finding 10)
- [ ] All React hook dependency warnings resolved (Finding 1)
- [ ] Unused imports removed OR implemented (Finding 2, 9)
- [ ] Fast Refresh works for context files (Finding 4)
- [ ] Lint warnings reduced from 88 to <50
- [ ] Build succeeds with no errors
- [ ] Tests run (may have failures, but no import errors)

## Forbidden Actions
- DO NOT change functionality beyond what's in findings
- DO NOT refactor code "while you're there" - stay focused
- DO NOT add new dependencies without explicit approval
- DO NOT delete TODO comments unless you implement the feature
- DO NOT modify .clinerules or other config files

## Questions?
If you encounter ambiguity:
1. Check `.agent/findings.md` for the specific finding
2. Check `.clinerules` for project standards
3. Look at similar code patterns in the codebase
4. Ask for clarification if still unclear

## Start Command
Begin with:
```bash
npm run lint
npm test
```

Then proceed with Phase 1.