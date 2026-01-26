# Urban Offline PWA - Audit Roadmap

## 1. Executive Summary
This audit identified key opportunities to strengthen the application's offline resilience, improve consistency in the intent handling architecture, and prevent potential performance bottlenecks in the map system.

## 2. Immediate Priorities (Critical)
- **[Resilience] Quota Error Handling**: `tileManager.js` and `db.js` lack robust handling for `QuotaExceededError`. If the device runs out of space, the app may crash or fail silently.
  - *Action*: Implement global catch for quota errors and UI feedback to ask user to clear space.
- **[Resilience] Region Manifest Fallback**: `dataManager.js` fetch has no offline fallback. If `regions.json` fails to load (e.g. offline start), the app is unusable.
  - *Action*: Bundle a default `regions.json` or cache it aggressively in Service Worker.

## 3. Short-Term Improvements (High Value)
- **[UX] Missing Tile Indicator**: `OfflineTileLayer.jsx` just fails silently or shows broken images if tiles are missing.
  - *Action*: Render a "No Data" placeholder tile directly in the canvas or fall back to a specific asset.
- **[Consistency] Unified Intent Logic**: `HybridSearch.js` and `TriageRouter.js` partially duplicate intent logic or hardcode lists that should be sourced from `IntentClassifier`.
  - *Action*: Refactor `HybridSearch.js` to derive related searches and synonyms directly from `IntentClassifier.EMERGENCY_PATTERNS`.
- **[Robustness] View Transitions**: `Search.jsx` uses `document.startViewTransition` without timeouts.
  - *Action*: Wrap transitions in a helper with a safety timeout to ensure navigation proceeds even if the browser hangs on the transition.
- **[Logic] Native Search Category**: `NativeSearch.js` hardcodes all results to 'health' category.
  - *Action*: Derive category from the source table or FTS metadata.
- **[Resilience] Online Content Caching**: `OnlineContentService.js` does not cache search results.
  - *Action*: Implement caching for search results to allow "recent searches" usage when offline.

## 4. Long-Term Optimization
- **[Performance] Map Memoization**: `MapComponent.jsx` re-renders frequently.
  - *Action*: Wrap with `React.memo` and ensure stable props.
- **[Architecture] Worker Resilience**: The ML worker init logic in `IntentClassifier.js` is good but could benefit from a retry mechanism if the worker file fails to load.

## 5. Security Notes
- No hardcoded secrets found in explored files.
- Ensure `InkJS` rendering (not deeply inspected this round) sanitizes output if it renders HTML.
