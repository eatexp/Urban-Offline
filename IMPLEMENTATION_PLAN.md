# Urban-Offline: Implementation Plan

**Based on**: Full Codebase Audit (2026-02-07)
**Approach**: Fix critical data/security issues first, then build infrastructure, then improve quality

---

## Phase 1: Critical Data & Security Fixes

### 1.1 Fix UTF-8 BOM in Ink Story Files
- Strip BOM (`ef bb bf`) from all 10 affected `.ink.json` files
- Validate each file parses correctly with `JSON.parse()`
- Update `compile-ink.js` to strip BOM on output to prevent recurrence
- **Files**: 10 ink.json files listed in audit

### 1.2 Compile Missing Ink Stories
- Compile `breathing-difficulties.ink` → `breathing-difficulties.ink.json`
- Compile `fracture-management.ink` → `fracture-management.ink.json`
- Place compiled files in `public/assets/ink/medical/`
- Move `hypothermia.ink.json` into `public/assets/ink/medical/` (currently orphaned at root ink level)

### 1.3 Add Ink Compilation to Build Pipeline
- Add `"compile-ink": "node scripts/compile-ink.js"` to `package.json` scripts
- Update `prebuild` to include `compile-ink` step

### 1.4 Fix XSS in AIChat Content Rendering
- Sanitize all AI-generated content through DOMPurify before rendering in `AIChat.jsx` `formatContent()`
- DOMPurify is already a dependency — just needs to be applied

### 1.5 Fix Search Index Deadlock
- Add timeout and error recovery to `isIndexing` wait loop in `WebSearch.js`
- Ensure `isIndexing` is reset to `false` in all error paths
- Add a maximum wait time (e.g., 10 seconds) before forcing re-initialization

---

## Phase 2: Robustness & Error Handling

### 2.1 Add Error Boundaries to Critical Pages
- Wrap `AIChat.jsx` render in error boundary
- Wrap `Library.jsx` render in error boundary
- Wrap `ModelPicker.jsx` render in error boundary
- Use existing `CompactErrorBoundary` component

### 2.2 Fix Windows Native Detection Order
- Move platform capability check in `TransformersEngine.js` to constructor/init, before any engine initialization
- Return early with clear error message on unsupported platforms

### 2.3 Consolidate Quota Error Handling
- Create unified quota error handler in `src/services/storage/quotaUtils.js`
- Standardize quota error detection across WebStorage, db.js, and dataManager
- Dispatch consistent events

### 2.4 Fix Tile Size Estimation
- Update `tileManager.js` tile size estimate from 20KB to 40KB
- Add actual size tracking during downloads to refine estimates

### 2.5 Add Offline Checks to Library Downloads
- Check `navigator.onLine` before initiating downloads in `Library.jsx`
- Show user-facing message when offline

### 2.6 Fix Silent Error Suppression
- Replace `console.error` with `createLogger()` in `Health.jsx`
- Add user-visible error states in `Home.jsx` when AI status check fails
- Surface search errors to UI layer in `WebSearch.js`

---

## Phase 3: Performance Improvements

### 3.1 Extract Inline Components in AIChat
- Move `SettingsModal` to separate file `src/components/SettingsModal.jsx`
- Move `SourcesPanel` to separate file `src/components/SourcesPanel.jsx`
- Wrap both with `React.memo()`

### 3.2 Paginate RAGPipeline Document Loading
- Replace `_getAllDocuments()` bulk load with paginated retrieval
- Process documents in batches to limit memory usage
- Add configurable batch size

### 3.3 Reduce Embedding Cache Size
- Lower `EmbeddingEngine.js` MAX_CACHE_SIZE from 1000 to 200
- Fix Float32Array conversion overhead — store as typed arrays

### 3.4 Fix HybridSearch Cache Key Determinism
- Sort object keys before `JSON.stringify` in cache key generation
- Or use a stable hash function

---

## Phase 4: Accessibility

### 4.1 Add Missing ARIA Labels
- Add `aria-label` to all Navbar icon-only buttons
- Add `title` attributes to icon-only buttons in `AIChat.jsx`
- Audit and fix any remaining unlabeled interactive elements

### 4.2 Focus Management
- Add visible focus indicators to `MapComponent.jsx`
- Ensure focus is managed when modals open/close in AIChat

### 4.3 Color Contrast Audit
- Verify `.text-muted` contrast ratios against WCAG AA
- Fix any failing combinations

---

## Phase 5: Consistent Logging
- Replace all `console.error`, `console.debug`, `console.log` calls with `createLogger()` from `src/utils/logger.js`
- Affected files: `Health.jsx`, `OfflineTileLayer.jsx`, `Home.jsx`, and any others found

---

## Phase 6: Build & Infrastructure (Future)

### 6.1 Testing Framework
- Install Vitest + @testing-library/react
- Create test configuration
- Write initial tests for critical services: `WebSearch.js`, `InkService.js`, `RAGPipeline.js`
- Write component tests for `TriageScreen`, `Search`

### 6.2 CI/CD Pipeline
- Add GitHub Actions workflow: lint, build, test on PR
- Add bundle size check step
- Add Ink story validation step

### 6.3 Code Quality Tooling
- Add Prettier configuration
- Add pre-commit hooks (lint-staged + husky)

---

## Implementation Order (Recommended)

| Step | Phase | Task | Effort |
|------|-------|------|--------|
| 1 | 1.1 | Strip BOM from 10 ink.json files | Small |
| 2 | 1.2 | Compile 2 missing ink stories | Small |
| 3 | 1.3 | Add compile-ink to build pipeline | Small |
| 4 | 1.4 | Fix XSS in AIChat formatContent | Small |
| 5 | 1.5 | Fix search index deadlock | Medium |
| 6 | 2.1 | Add error boundaries to 3 pages | Small |
| 7 | 2.2 | Fix Windows native detection order | Small |
| 8 | 2.3 | Consolidate quota error handling | Medium |
| 9 | 2.4 | Fix tile size estimation | Small |
| 10 | 2.5 | Add offline checks to Library | Small |
| 11 | 2.6 | Fix silent error suppression | Small |
| 12 | 3.1 | Extract AIChat inline components | Medium |
| 13 | 3.2 | Paginate RAGPipeline document loading | Medium |
| 14 | 3.3 | Reduce embedding cache / fix types | Small |
| 15 | 3.4 | Fix HybridSearch cache keys | Small |
| 16 | 4.1 | Add missing ARIA labels | Small |
| 17 | 4.2 | Fix focus management | Small |
| 18 | 4.3 | Color contrast audit | Small |
| 19 | 5 | Consistent logging migration | Medium |
| 20 | 6.1 | Testing framework setup | Large |
| 21 | 6.2 | CI/CD pipeline | Medium |
| 22 | 6.3 | Prettier + pre-commit hooks | Small |

---

## Notes

- Phases 1-5 are actionable improvements to the existing codebase
- Phase 6 is infrastructure that benefits long-term maintainability
- Each step is designed to be independently committable
- Priority order ensures the most impactful fixes land first
