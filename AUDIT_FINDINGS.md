# Urban-Offline: Full Codebase Audit Findings

**Date**: 2026-02-07
**Scope**: Complete codebase audit — structure, components, services, assets, build pipeline, security, performance, accessibility

---

## Executive Summary

Urban-Offline is a well-architected offline-first PWA (~30,000 LOC) with solid platform abstraction, modular services, and rich content. However, the codebase has **no test infrastructure**, **no CI/CD pipeline**, **critical data integrity issues** (UTF-8 BOM in 10 Ink story files), **potential deadlocks in search indexing**, and **security concerns in content rendering**. This document catalogues all findings by severity.

---

## 1. Critical Issues (P0)

### 1.1 UTF-8 BOM in 10 Compiled Ink Story Files
**Impact**: `JSON.parse()` fails in browsers; emergency protocols unavailable
**Files affected**:
- `public/assets/ink/medical/burns-assessment.ink.json`
- `public/assets/ink/medical/heat-illness.ink.json`
- `public/assets/ink/medical/stroke-recognition.ink.json`
- `public/assets/ink/legal/arrest-rights.ink.json`
- `public/assets/ink/legal/custody-rights.ink.json`
- `public/assets/ink/legal/stop-and-search.ink.json`
- `public/assets/ink/survival/fire-making.ink.json`
- `public/assets/ink/survival/shelter-building.ink.json`
- `public/assets/ink/survival/water-purification.ink.json`
- `public/assets/ink/hypothermia.ink.json`

### 1.2 Search Index Deadlock Potential
**File**: `src/services/search/WebSearch.js`
**Issue**: `isIndexing` flag can deadlock if initialization fails — the wait loop (lines 15-19) spins indefinitely if `isIndexing` is set `true` but never reset on error.

### 1.3 Uncompiled Ink Source Files
**Files**:
- `public/assets/ink/source/medical/breathing-difficulties.ink` — no compiled JSON
- `public/assets/ink/source/medical/fracture-management.ink` — no compiled JSON

**Impact**: Two emergency medical protocols completely unavailable in the app.

### 1.4 Windows Native Detection Too Late
**File**: `src/services/ai/TransformersEngine.js` (FIXME line 26)
**Issue**: Windows native platform check occurs after engine initialization attempt, causing crashes on Windows native builds.

---

## 2. High Priority Issues (P1)

### 2.1 XSS Risk in AI Chat Content Rendering
**File**: `src/pages/AIChat.jsx` (lines 923-996)
**Issue**: `formatContent()` manually parses markdown-like syntax without sanitizing HTML entities. Malicious content in LLM responses could execute arbitrary JavaScript.
**Fix**: Use DOMPurify on all rendered AI content.

### 2.2 No Test Framework
- No test files, no test runner, no testing libraries installed
- Only `jsdom` in devDependencies
- No unit, integration, or E2E tests

### 2.3 No CI/CD Pipeline
- No GitHub Actions, no automated builds, no lint checks in CI
- No automated deployment

### 2.4 Missing Error Boundaries on Critical Pages
- `AIChat.jsx` — largest, most complex page, no error boundary
- `Library.jsx` — content management page, no error boundary
- `ModelPicker.jsx` — model management, no error boundary

### 2.5 Inconsistent Quota Error Handling
Quota errors handled differently across layers:
- `WebStorage.js`: checks `QuotaExceededError` + `NS_ERROR_DOM_QUOTA_REACHED`
- `db.js` (native): dispatches different event
- `dataManager.js`: checks string `STORAGE_QUOTA_EXCEEDED`

### 2.6 RAGPipeline Memory Risk
**File**: `src/services/ai/RAGPipeline.js` (lines 264-283)
`_getAllDocuments()` calls `db.getAll()` loading entire stores into memory. With large datasets could exhaust browser memory on mobile.

### 2.7 Tile Size Underestimate
**File**: `src/services/tileManager.js` (line 31)
Estimates 20KB/tile but actual OSM tiles are 30-50KB. Downloads fail after partial completion.

### 2.8 Build Pipeline Missing Ink Compilation
- `compile-ink.js` exists but no `npm run compile-ink` script in `package.json`
- `prebuild` runs `fetch-content` + `generate-manifest` but never compiles Ink stories

---

## 3. Medium Priority Issues (P2)

### 3.1 Performance
- `AIChat.jsx`: `SettingsModal` and `SourcesPanel` defined inline, recreated every render — should be separate memoized components
- `EmbeddingEngine.js`: MAX_CACHE_SIZE = 1000 could consume 50MB+ memory
- `NativeStorage.js`: `iterate()` loads entire directory before processing
- Simulated streaming in `TransformersEngine.js` (lines 413-426) — full response computed first, then words yielded with delays

### 3.2 Inconsistent Logging
- Some files use `createLogger()`, others use `console.error()` / `console.debug()`
- `Health.jsx`, `OfflineTileLayer.jsx` use raw console methods

### 3.3 Accessibility Gaps
- Navbar icon-only buttons lack `aria-label` attributes
- `MapComponent.jsx`: no visible focus indicators
- Some icon-only buttons in `AIChat.jsx` missing `title` attributes
- Potential color contrast issues with `.text-muted` gray text

### 3.4 Silent Error Suppression
- `Health.jsx` (line 19): catches error, only logs to console, returns empty array
- `Home.jsx` (lines 51-57): catches error with empty comment `/* AI unavailable */`
- `WebSearch.js`: search errors logged but results appear complete to UI

### 3.5 Offline Detection Unreliable
- Uses `navigator.onLine` which doesn't detect captive portals or ISP error pages
- `Library.jsx` doesn't check offline status before attempting downloads

### 3.6 Database Migration Strategy Missing
**File**: `WebStorage.js`
Database version hardcoded to 5 with no migration strategy. Schema changes could break existing installations. Schema creation code duplicated in upgrade and recovery paths.

### 3.7 No Resumeable Downloads
- Tile downloads restart from beginning if interrupted
- No progress persistence for partial region installations

### 3.8 PurchaseManager Stub
**File**: `src/services/ai/PurchaseManager.js` (lines 106, 136)
In-app purchase integration is TODO-stubbed. Dev mode allows free unlock via `_devSetUnlocked(true)`.

---

## 4. Low Priority Issues (P3)

### 4.1 Code Quality
- No Prettier configuration — inconsistent formatting
- No TypeScript or JSDoc type annotations on service methods
- Mixed CSS approaches (Tailwind + inline styles + `<style>` tags)
- Hardcoded timing constants scattered across components (2000ms timeouts, 300ms debounce, etc.)
- Magic numbers for search result limits (`slice(0, 5)` in multiple files)

### 4.2 Missing Source Files for Health Stories
- `health/choking.ink.json`, `health/cpr.ink.json`, `health/severe-bleeding.ink.json` have no corresponding `.ink` source files
- Cannot recompile from source if needed

### 4.3 Search Key Prop Issues
- `Search.jsx` (line 304): uses `result.id || idx` — index fallback is problematic if list reorders

### 4.4 Storage Isolation
- All platforms use same IndexedDB database name `'urban-offline-db'`
- No per-user isolation on shared devices

### 4.5 Embedding Cache Type Mismatch
**File**: `EmbeddingEngine.js`
Stores embeddings as regular arrays in IndexedDB but retrieves as Float32Array — unnecessary conversion overhead.

### 4.6 HybridSearch Cache Key Non-Determinism
**File**: `HybridSearch.js` (line 95)
Uses `JSON.stringify` for cache keys — object key ordering not guaranteed, causing cache misses for equivalent queries.

---

## 5. Strengths

- **Clean platform abstraction** — WebStorage vs NativeStorage with unified API
- **Modular service architecture** — AI, search, storage, triage clearly separated
- **Modern build setup** — Vite with code splitting, legacy support, PWA auto-update
- **Good React patterns** — proper memoization, useCallback, custom hooks throughout
- **Strong offline-first core** — critical content preloading, fallback templates, offline indicators
- **Rich content** — 89 articles across 3 packs, 14+ interactive Ink decision trees
- **Mobile UX** — haptic feedback, safe area awareness, iOS zoom prevention
- **Keyboard navigation** — Search, EmergencyCommandBar, AIChat all keyboard-accessible
- **Error boundaries exist** — ErrorBoundary, CompactErrorBoundary, MapErrorBoundary

---

## 6. Statistics

| Metric | Value |
|--------|-------|
| Total LOC (JS/JSX) | ~30,000 |
| Components | 21+ |
| Pages | 15 |
| Service modules | 35+ |
| Ink stories (compiled) | 14 |
| Content articles | 89 |
| TODO/FIXME markers | 13 |
| Files with BOM issues | 10 |
| Test files | 0 |
| CI/CD configs | 0 |
