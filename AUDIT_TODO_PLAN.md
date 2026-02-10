# Urban Offline - TODO Annotation Plan

## Task Overview
Add descriptive TODO comments to the codebase to mark issues and improvement opportunities.

## Areas to Annotate

### 1. Resilience (Fetch/Offline Handling)
- **Files to check**: `OnlineContentService.js`, `InkService.js`, `contentSync.js`
- **Pattern**: Look for fetch calls without offline retry/fallback
- **TODO format**: `// TODO: [Resilience] - Implement offline retry/fallback`

### 2. Performance (Memoization)
- **Files to check**: `Home.jsx`, `AIChat.jsx`, `Settings.jsx`
- **Pattern**: Large components, list renders, expensive computations
- **TODO format**: `// TODO: [Performance] - Optimize re-renders with memoization`

### 3. Security (HTML/innerHTML)
- **Files to check**: `OnlineContentService.js` (already has DOMPurify), `TriageScreen.jsx`
- **Pattern**: innerHTML usage, unsafe HTML rendering
- **TODO format**: `// TODO: [Security] - Review for XSS vulnerabilities`

### 4. Map Integration
- **Files to check**: `OfflineTileLayer.jsx` (already has placeholders), `MapComponent.jsx`
- **Pattern**: Missing tile indicators
- **TODO format**: `// TODO: [Map] - Add visual indicator for missing tiles`

### 5. Accessibility
- **Files to check**: Various components
- **Pattern**: Missing aria-labels, keyboard navigation
- **TODO format**: `// TODO: [A11y] - Add keyboard navigation support`

### 6. Error Handling
- **Files to check**: `SearchService.js`, `dataManager.js`
- **Pattern**: Unhandled promise rejections
- **TODO format**: `// TODO: [Error] - Add error boundary handling`

## Execution Order
1. Start with high-impact files (Search, Home, AIChat)
2. Move to service layer (OnlineContentService, dataManager)
3. Finish with utility files
4. Update roadmap.md with summary
