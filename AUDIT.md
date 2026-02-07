# Urban-Offline Full Codebase Audit

**Date**: 2026-02-07
**Scope**: Complete codebase audit covering architecture, components, services, build config, and UX

---

## Executive Summary

Urban-Offline is a well-architected offline-first PWA with solid foundations: dual-platform storage abstraction, AI/RAG pipeline, Ink-based triage flows, and a thoughtful design system. However, the audit identifies **42 findings** across 6 categories ranging from critical bugs to polish items. The most impactful improvements are: fixing duplicate code in the DB recovery path, adding missing PWA assets, improving the ProtocolView dark theme consistency, reducing the 19MB medical-core.json load bottleneck, and adding a test framework.

---

## 1. CRITICAL BUGS & ISSUES

### 1.1 ProtocolView Uses Light Theme in Dark App
**File**: `src/components/ProtocolView.jsx:136-145`
**Severity**: HIGH
**Issue**: ProtocolView renders with `bg-white` and light-colored text/borders, completely breaking the dark theme used everywhere else in the app. When a user opens an emergency protocol, they get a jarring white screen.
**Fix**: Replace hardcoded white backgrounds with design system CSS variables (`var(--color-bg-primary)`, etc.).

### 1.2 Duplicate DB Schema in WebStorage Recovery Path
**File**: `src/services/storage/WebStorage.js:116-177`
**Severity**: MEDIUM
**Issue**: The IndexedDB corruption recovery path duplicates the entire upgrade function (all 15 object stores). If a new store is added to the primary path but not the recovery path, corruption recovery silently produces an incomplete database.
**Fix**: Extract the upgrade logic into a shared function called by both paths.

### 1.3 TriageScreen `useCallback` Dependency on `triggerHaptic`
**File**: `src/components/TriageScreen.jsx:148-152`
**Severity**: LOW (runtime)
**Issue**: `handleChoice` includes `triggerHaptic` as a useCallback dependency, but `triggerHaptic` is an imported module-level function, not a state/prop. This causes React to warn about unnecessary dependencies.
**Fix**: Remove `triggerHaptic` from the dependency array.

### 1.4 Search.jsx Duplicate Spread
**File**: `src/components/Search.jsx:86-87`
**Severity**: LOW
**Issue**: `...response.intent` is spread twice in the emergency alert object construction. While harmless, it's dead code.
**Fix**: Remove the duplicate spread.

### 1.5 ProtocolView `onend` Handler Overwritten
**File**: `src/components/ProtocolView.jsx:58-69`
**Severity**: MEDIUM
**Issue**: The `speakStep` function sets `utterance.onend` on line 58 (for context speech), then overwrites it on line 69 (`utterance.onend = () => setIsSpeaking(false)`). The context follow-up speech will never execute.
**Fix**: Combine both handlers or use `addEventListener`.

### 1.6 Double Initialization in main.jsx
**File**: `src/main.jsx:32-39` and `src/context/AppProvider.jsx:36-79`
**Severity**: LOW
**Issue**: `initStorage()` is called both in `main.jsx` (before render) and inside `AppProvider` (on mount). While idempotent, it's redundant work and confusing.
**Fix**: Remove the duplicate initialization from one location.

---

## 2. ARCHITECTURE & CODE QUALITY

### 2.1 No Error Boundary on Router Level
**File**: `src/router.jsx`
**Issue**: The router configuration doesn't include an `errorElement` for route-level errors. If a loader throws (e.g., `articleLoader`), React Router shows its default error UI instead of the app's `ErrorBoundary`.
**Fix**: Add `errorElement: <ErrorBoundary />` to the root route.

### 2.2 Missing 404/Catch-All Route
**File**: `src/router.jsx`
**Issue**: No catch-all route for undefined paths. Users navigating to `/unknown` see a blank page.
**Fix**: Add a `path: "*"` route with a 404 component.

### 2.3 AppProvider Network Listener Duplicated
**Files**: `src/context/AppProvider.jsx`, `src/pages/Home.jsx`, `src/pages/AIChat.jsx`
**Issue**: Online/offline event listeners are independently registered in 3+ places. Each component maintains its own `isOnline` state.
**Fix**: Centralize in `AppProvider` and expose `isOnline` via context. Remove duplicates from page components.

### 2.4 Massive AIChat Component
**File**: `src/pages/AIChat.jsx` (1613 lines)
**Issue**: AIChat contains the page, MessageBubble, SourcesPanel, SettingsModal, and formatContent utility all in one file. This hurts readability and makes testing difficult.
**Fix**: Extract `MessageBubble`, `SourcesPanel`, `SettingsModal` into `src/components/ai/` subcomponents.

### 2.5 Inline Styles Overused
**Files**: Multiple components
**Issue**: Heavy use of inline `style={{}}` and `onMouseEnter/onMouseLeave` for hover effects instead of CSS classes. This bypasses the design system and increases bundle size.
**Fix**: Move to CSS classes from the design system or Tailwind utilities.

### 2.6 No TypeScript or JSDoc Enforcement
**Issue**: Pure JavaScript project with no type checking. At this codebase size (~50 files), type errors are likely going unnoticed. Even JSDoc annotations are inconsistent.
**Recommendation**: Consider gradual TypeScript migration starting with service files, or add JSDoc with ESLint JSDoc plugin.

---

## 3. PERFORMANCE

### 3.1 19MB Medical Content Pack Blocks Initial Load
**File**: `public/assets/packs/medical-core.json` (19MB)
**Issue**: If this pack is loaded eagerly (e.g., during content sync), it blocks the main thread and causes jank. On mobile devices with limited memory, parsing 19MB of JSON can cause OOM crashes.
**Fix**: Implement lazy loading - only load specific articles on demand. Consider splitting into smaller category-based packs (cardiology, trauma, neurology, etc.).

### 3.2 No Virtualization for Long Lists
**Files**: Various content browsers, article lists
**Issue**: Content lists render all items in the DOM. With hundreds of articles per pack, this causes slow rendering and high memory usage.
**Fix**: Implement virtual scrolling with `react-window` or `@tanstack/virtual` for article lists.

### 3.3 Format Cache Has No Size Limit Enforcement
**File**: `src/pages/AIChat.jsx:926-1003`
**Issue**: While `MAX_FORMAT_CACHE_SIZE` is defined at 100, the eviction only removes the first entry (FIFO, not LRU). The cache stores React elements which can't be garbage collected while referenced.
**Fix**: Implement proper LRU cache or use `WeakRef` for cached values.

### 3.4 Multiple `backdrop-filter: blur()` Calls
**Files**: `src/styles/components.css`, multiple components
**Issue**: `backdrop-filter: blur(16px)` is a GPU-intensive operation. Used on header, modals, search dropdown, triage header, and AI chat header simultaneously.
**Fix**: Reduce blur usage to critical overlays only. Use solid backgrounds elsewhere.

### 3.5 No Bundle Analysis in CI
**Issue**: `scripts/analyze-bundle-size.js` exists but isn't integrated into the build pipeline or CI.
**Fix**: Add bundle size checks to prevent accidental size regressions.

---

## 4. PWA & OFFLINE

### 4.1 Missing PWA Icon Sizes
**File**: `vite.config.js:30-41`, `public/`
**Issue**: Only `icon.svg` exists. Many browsers/platforms require rasterized PNG icons at specific sizes (192x192, 512x512, apple-touch-icon). The manifest declares SVG icons at these sizes, but some Android devices and iOS don't support SVG icons in manifests.
**Fix**: Generate PNG icons from SVG using a tool like `@vite-pwa/assets-generator`.

### 4.2 Favicon Points to Vite Logo
**File**: `index.html:6`
**Issue**: `<link rel="icon" href="/vite.svg" />` - the favicon is the Vite logo, not the app logo.
**Fix**: Change to `/icon.svg` or a proper `.ico` file.

### 4.3 No Content Security Policy
**File**: `index.html`
**Issue**: No CSP meta tag. This allows potential XSS attacks via injected scripts. While DOMPurify is used in AIChat, other content rendering paths may be vulnerable.
**Fix**: Add a CSP meta tag allowing only necessary sources (self, HuggingFace CDN, OSM tiles).

### 4.4 No Offline Fallback Route
**Issue**: If a user navigates to a new route while offline (and the route's chunk hasn't been cached), they see a blank page or error.
**Fix**: Configure Workbox with a `navigateFallback` to serve `index.html` for all navigation requests.

### 4.5 Service Worker Doesn't Precache App Shell
**File**: `vite.config.js:58-76`
**Issue**: Workbox config only defines runtime caching for HuggingFace models. No precaching strategy for the app shell (HTML, CSS, JS bundles).
**Fix**: Add `globPatterns` to precache the built assets automatically.

### 4.6 Missing `robots.txt` and `manifest.json`
**Issue**: No `robots.txt` for SEO. The PWA manifest is auto-generated at build time but not available during development for testing.
**Fix**: Add `public/robots.txt`. Consider a static manifest for development debugging.

---

## 5. UX & ACCESSIBILITY

### 5.1 No `lang` Attribute Reflects Locale
**File**: `index.html:2`
**Issue**: `<html lang="en">` but the app is UK-focused. Should be `en-GB` for proper locale behavior.
**Fix**: Change to `<html lang="en-GB">`.

### 5.2 Global `:active` Scale Transform
**File**: `src/styles/components.css:27`
**Issue**: `:active { transform: scale(0.98) }` applies to ALL elements including text selections, inputs, and non-interactive elements.
**Fix**: Scope to `button:active, a:active, .interactive:active`.

### 5.3 Emergency Quick Access Buttons May Not Work
**File**: `src/pages/Home.jsx:236-247`
**Issue**: The "Evacuate Now" button links to `/protocol/evacuate-now` but there's no evidence this protocol exists in the content. The "Medical Alert" button links to `/triage/health/cpr.ink.json` which includes the file extension in the URL.
**Fix**: Verify protocol IDs exist. Clean up triage URL formatting.

### 5.4 No Skip-to-Content Link
**File**: `src/components/Layout.jsx`
**Issue**: No skip-to-main-content link for keyboard/screen reader users to bypass navigation.
**Fix**: Add a visually hidden skip link at the top of Layout.

### 5.5 Missing ARIA Labels on Interactive Elements
**Files**: Multiple components
**Issue**: Many buttons rely solely on icon content (e.g., settings gear, visualization toggle in AIChat) without `aria-label`. The Navbar links lack `aria-label` attributes.
**Fix**: Add `aria-label` to all icon-only buttons and navigation links.

### 5.6 No Reduced Motion Support in JS Animations
**Files**: Multiple components use `animate-*` classes
**Issue**: While CSS has `prefers-reduced-motion` support, JavaScript-driven animations (view transitions, stagger delays) don't check this preference.
**Fix**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')` before triggering JS animations.

### 5.7 Settings Page Missing from Navbar
**File**: `src/components/Navbar.jsx`, `src/router.jsx`
**Issue**: There's a `Settings.jsx` page and it's referenced in the CLAUDE.md, but it's not in the router config and not accessible from the navbar.
**Fix**: Either add Settings to the router/navbar or remove the orphaned page.

---

## 6. DEVELOPER EXPERIENCE & INFRASTRUCTURE

### 6.1 No Test Framework
**Issue**: No test files, no vitest/jest configuration. `package.json` has a test script but no test runner dependency confirmed working.
**Fix**: Set up Vitest with at least unit tests for critical paths: storage layer, search service, RAG pipeline, intent classifier.

### 6.2 No `.prettierrc` or Formatting Standard
**Issue**: Code formatting is inconsistent (tab width, trailing commas, quote style vary between files).
**Fix**: Add `.prettierrc` and format the codebase.

### 6.3 No `.env.example`
**Issue**: No documentation of environment variables. Future developers won't know what configuration is available.
**Fix**: Create `.env.example` with documented variables.

### 6.4 ESLint Missing Key Plugins
**File**: `eslint.config.js`
**Issue**: No accessibility linting (`eslint-plugin-jsx-a11y`), no import sorting (`eslint-plugin-import`).
**Fix**: Add these plugins to catch accessibility issues early.

### 6.5 No Pre-commit Hooks
**Issue**: No husky/lint-staged setup. Code can be committed without passing lint.
**Fix**: Add pre-commit hooks for linting and formatting.

### 6.6 Ink Source Files Ship to Production
**File**: `public/assets/ink/source/`
**Issue**: Raw `.ink` source files are in `public/` and will be included in the production build, adding unnecessary size.
**Fix**: Move source files outside `public/` or add to `.gitignore` for `public/assets/ink/source/`.

---

## Implementation Plan

### Phase 1: Critical Fixes (P0)
Priority: Fix bugs that affect core functionality

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Fix ProtocolView light theme - apply dark theme variables | `ProtocolView.jsx` | S |
| 2 | Fix ProtocolView `onend` handler being overwritten | `ProtocolView.jsx` | S |
| 3 | Extract shared DB upgrade function to eliminate duplication | `WebStorage.js` | M |
| 4 | Fix favicon to use app icon instead of Vite logo | `index.html` | XS |
| 5 | Add router errorElement and 404 catch-all route | `router.jsx` | S |
| 6 | Fix Search.jsx duplicate spread | `Search.jsx` | XS |
| 7 | Fix TriageScreen useCallback dependency | `TriageScreen.jsx` | XS |

### Phase 2: PWA & Offline Hardening (P1)
Priority: Ensure the app works reliably offline

| # | Task | Files | Effort |
|---|------|-------|--------|
| 8 | Generate proper PNG PWA icons (192, 512, apple-touch) | `public/`, `vite.config.js` | S |
| 9 | Add Workbox precaching for app shell | `vite.config.js` | S |
| 10 | Add navigateFallback for offline route handling | `vite.config.js` | S |
| 11 | Add Content Security Policy meta tag | `index.html` | S |
| 12 | Remove double `initStorage()` call | `main.jsx` or `AppProvider.jsx` | XS |
| 13 | Move Ink source files out of public/ | `public/assets/ink/source/` | XS |

### Phase 3: Performance Optimization (P1)
Priority: Improve load times and runtime performance

| # | Task | Files | Effort |
|---|------|-------|--------|
| 14 | Lazy-load content packs on demand instead of eagerly | `contentSync.js`, `dataManager.js` | M |
| 15 | Split 19MB medical-core.json into smaller category packs | `scripts/generate-manifest.js` | L |
| 16 | Scope `:active` transform to interactive elements only | `components.css` | XS |
| 17 | Reduce backdrop-filter usage to essential overlays | `components.css`, components | S |

### Phase 4: UX & Accessibility (P2)
Priority: Improve usability for all users

| # | Task | Files | Effort |
|---|------|-------|--------|
| 18 | Add skip-to-content link in Layout | `Layout.jsx` | XS |
| 19 | Add aria-labels to all icon-only buttons | Multiple components | S |
| 20 | Set `lang="en-GB"` on html element | `index.html` | XS |
| 21 | Centralize isOnline state in AppProvider | `AppProvider.jsx`, `Home.jsx`, `AIChat.jsx` | M |
| 22 | Verify emergency quick access protocol IDs | `Home.jsx`, content files | S |
| 23 | Add reduced motion checks to JS animations | Multiple components | S |
| 24 | Add Settings page to router and navbar (or remove orphan) | `router.jsx`, `Navbar.jsx` | S |

### Phase 5: Code Quality & DX (P2)
Priority: Improve maintainability

| # | Task | Files | Effort |
|---|------|-------|--------|
| 25 | Extract AIChat subcomponents (MessageBubble, Settings, Sources) | `AIChat.jsx` -> `components/ai/` | M |
| 26 | Replace inline style hover handlers with CSS classes | Multiple components | M |
| 27 | Add `.prettierrc` and format codebase | Root, all files | S |
| 28 | Add `.env.example` with documented variables | Root | XS |
| 29 | Add ESLint jsx-a11y plugin | `eslint.config.js` | S |

### Phase 6: Testing & CI (P3)
Priority: Prevent regressions

| # | Task | Files | Effort |
|---|------|-------|--------|
| 30 | Set up Vitest with basic configuration | `vitest.config.js`, `package.json` | S |
| 31 | Write unit tests for storage abstraction layer | `tests/services/` | M |
| 32 | Write unit tests for search/intent classifier | `tests/services/` | M |
| 33 | Write unit tests for InkService | `tests/services/` | S |
| 34 | Add bundle size check to build pipeline | `scripts/`, `package.json` | S |
| 35 | Add pre-commit hooks (husky + lint-staged) | Root config files | S |

---

## Size Legend
- **XS**: < 30 minutes, single file change
- **S**: 30 min - 2 hours, 1-3 files
- **M**: 2-4 hours, 3-6 files
- **L**: 4-8 hours, significant refactoring

## Estimated Total Effort
- Phase 1 (P0): ~4 hours
- Phase 2 (P1): ~4 hours
- Phase 3 (P1): ~8 hours
- Phase 4 (P2): ~6 hours
- Phase 5 (P2): ~6 hours
- Phase 6 (P3): ~8 hours
- **Total: ~36 hours**
