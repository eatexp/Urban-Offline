# AI Audit Prompt - Phase 2: Deep Investigation & Implementation

## Role
You are a Senior Software Engineer and Security Auditor specializing in **offline-first PWA architecture**. Your expertise includes:
- React performance optimization and lifecycle management
- IndexedDB, Service Workers, and browser storage APIs
- Mobile-first resilience patterns (network failure, quota limits, memory constraints)
- Security best practices (XSS prevention, dependency auditing)
- Cross-platform compatibility (Capacitor for iOS/Android)

## Project Context

| Aspect | Details |
|--------|---------|
| **App Type** | Offline-first Emergency Preparedness PWA |
| **Stack** | React 19 + Vite 7 + Tailwind CSS 4 |
| **Storage** | IndexedDB via `idb` library (web) / SQLite via `@capacitor-community/sqlite` (native) |
| **AI/ML** | Web Worker-based ML classifier (Xenova/transformers) with keyword fallback |
| **Interactive Flows** | InkJS for triage decision trees |
| **Maps** | Leaflet with offline tile caching via custom OfflineTileLayer |
| **Platform** | Web PWA + Capacitor (iOS/Android in development) |

### Architecture Overview
```
src/
├── services/
│   ├── storage/
│   │   ├── WebStorage.js      # IndexedDB wrapper with batch ops
│   │   ├── NativeStorage.js   # SQLite + Filesystem for Capacitor
│   │   └── schema.js          # Shared store definitions
│   ├── db.js                  # Platform abstraction layer
│   ├── dataManager.js         # Region/content download orchestration
│   ├── tileManager.js         # Map tile caching with AbortController
│   ├── ai/
│   │   ├── IntentClassifier.js    # ML + keyword emergency detection
│   │   ├── classifier.worker.js   # Web Worker for ML inference
│   │   ├── RAGPipeline.js         # Retrieval-augmented generation
│   │   ├── EmbeddingEngine.js     # Vector embeddings
│   │   └── TransformersEngine.js  # Model management
│   ├── search/
│   │   ├── HybridSearch.js    # Unified search with intent routing
│   │   └── NativeSearch.js    # SQLite FTS for native platforms
│   ├── InkService.js          # Interactive triage flows
│   └── OnlineContentService.js # Live content fetching
├── components/
│   ├── MapComponent.jsx       # Leaflet wrapper (React.memo applied)
│   ├── OfflineTileLayer.jsx   # Custom tile layer with offline fallback
│   ├── Search.jsx             # Search UI with emergency detection
│   └── TriageScreen.jsx       # Ink story renderer
├── pages/
│   └── AIChat.jsx             # Conversational AI interface
└── hooks/
    └── useViewTransition.js   # Safe View Transitions API wrapper
```

### Previous Audit Status
The codebase has undergone 3 audit passes. See `roadmap.md` for complete history.

**Current TODO annotations (10 total):**
| Priority | File | Issue ID |
|----------|------|----------|
| P0 Safety | `classifier.worker.js:76` | ADD_TIMEOUT_TO_PIPELINE_CALL |
| P1 Critical | `NativeStorage.js:185` | MISSING_CLEAR_AND_GETALLKEYS_EXPORTS |
| P1 | `OnlineContentService.js:69` | ADD_RETRY_LOGIC_WITH_BACKOFF |
| P1 | `OnlineContentService.js:311` | WRAP_DOMPARSER_IN_TRY_CATCH |
| P1 | `HybridSearch.js:118` | TRACK_FAILED_QUERIES_IN_RESPONSE |
| P1 | `dataManager.js:141` | PARTIAL_INSTALLATION_STATE_INDICATOR |
| P2 | `OfflineTileLayer.jsx:25` | EXTRACT_SVG_PLACEHOLDER_TO_CONSTANT |
| P2 | `OfflineTileLayer.jsx:64` | LOG_TILE_ERRORS_INSTEAD_OF_SWALLOWING |
| P2 | `AIChat.jsx:641` | MEMOIZE_FORMAT_CONTENT_OUTPUT |
| P3 | `MapComponent.jsx:54` | CONSIDER_ERROR_BOUNDARY_WRAPPER |

---

## Objective

Perform a **deep investigation** of under-audited areas, then either:
1. **Add new TODO annotations** for newly discovered issues, OR
2. **Implement fixes** for existing TODOs

### Investigation Targets (Not Yet Fully Audited)

The following areas have NOT been thoroughly audited:

#### 1. AI/ML Pipeline (High Priority)
```
src/services/ai/
├── RAGPipeline.js         # NOT AUDITED - Retrieval system
├── EmbeddingEngine.js     # NOT AUDITED - Vector operations
├── TransformersEngine.js  # NOT AUDITED - Model lifecycle
├── AIModelManager.js      # NOT AUDITED - Model caching
├── DatasetRegistry.js     # NOT AUDITED - Dataset management
├── ProtocolGenerator.js   # NOT AUDITED - Dynamic protocol creation
└── scenarioTemplates.js   # NOT AUDITED - Template definitions
```

**Audit Questions:**
- [ ] Does RAGPipeline have offline fallback when embedding service unavailable?
- [ ] Is EmbeddingEngine memory-safe for large document sets?
- [ ] Does TransformersEngine handle model cache invalidation?
- [ ] Are there race conditions in concurrent model loading?
- [ ] Is there timeout protection for embedding generation?

#### 2. Content Management (Medium Priority)
```
src/services/
├── contentSync.js         # NOT AUDITED - Content synchronization
├── guideManager.js        # NOT AUDITED - Guide lifecycle
├── articleService.js      # NOT AUDITED - Article fetching
└── contentPacks/          # NOT AUDITED - Content pack system
    ├── contentPackManager.js
    ├── packValidator.js
    └── packInstaller.js
```

**Audit Questions:**
- [ ] Does contentSync handle partial sync failures gracefully?
- [ ] Is there deduplication for overlapping content packs?
- [ ] Are content packs validated before installation?
- [ ] Is there rollback on failed content pack install?

#### 3. UI Components (Medium Priority)
```
src/components/
├── SmartDownloadPrompt.jsx  # NOT AUDITED - Download UI
├── ContextSettings.jsx      # NOT AUDITED - User context config
├── ProtocolView.jsx         # NOT AUDITED - Protocol rendering
├── ErrorBoundary.jsx        # NOT AUDITED - Error handling
└── AskAIChip.jsx            # NOT AUDITED - AI interaction chip
```

**Audit Questions:**
- [ ] Does SmartDownloadPrompt handle quota exceeded mid-download?
- [ ] Is ContextSettings data persisted correctly for offline?
- [ ] Does ProtocolView sanitize dynamic content?
- [ ] Does ErrorBoundary provide useful recovery actions?

#### 4. Router & Pages (Low Priority)
```
src/
├── router.jsx             # NOT AUDITED - Route definitions
├── pages/
│   ├── AIChat.jsx         # PARTIAL - formatContent TODO exists
│   ├── ArticleView.jsx    # NOT AUDITED - Article rendering
│   └── Downloads.jsx      # NOT AUDITED - Download management
```

---

## Audit Categories (Priority Order)

### 🔴 P0: Safety-Critical
- **Life-safety features** must never fail silently
- Emergency detection must have deterministic fallback
- Triage flows must work 100% offline
- No silent data corruption

### 🟠 P1: Offline Resilience  
- All network fetches need offline fallback
- Storage quota handling (eviction, user notification)
- ML model loading failure → keyword fallback
- Graceful degradation on all network operations

### 🟡 P2: Performance
- Component memoization (especially in lists)
- IndexedDB batch operations
- Bundle size optimization
- Memory leak prevention

### 🟢 P3: Code Quality
- Consistency in error handling patterns
- Dead code removal
- Type safety improvements
- Logging standardization

---

## Annotation Format

Use this structured format for ALL annotations:

```javascript
// =============================================================================
// TODO: [Category] BRIEF_TITLE
// =============================================================================
// Current: [Description of current behavior]
// Problem: [What's wrong and what's the impact]
//
// SOLUTION:
// [Specific code pattern or approach to fix]
//
// Example:
// if (condition) { doTheThing(); }
//
// Effort: S/M/L | Impact: Low/Medium/High
// =============================================================================
```

**Categories**: `[Safety]`, `[Resilience]`, `[Performance]`, `[Security]`, `[Consistency]`

For documentation-only notes (no action needed):
```javascript
// =============================================================================
// NOTE: [Category][Status] BRIEF_TITLE
// =============================================================================
// [Explanation of current implementation and why it's acceptable]
// =============================================================================
```

---

## Deep Investigation Checklist

### RAGPipeline.js
- [ ] Timeout on embedding generation?
- [ ] Fallback when vector store unavailable?
- [ ] Memory limits on context window?
- [ ] Caching strategy for embeddings?

### EmbeddingEngine.js
- [ ] Batch size limits for large documents?
- [ ] Progress reporting for long operations?
- [ ] Memory cleanup after embedding?

### TransformersEngine.js
- [ ] Model version management?
- [ ] Cache eviction strategy?
- [ ] Concurrent load protection?

### contentSync.js
- [ ] Conflict resolution strategy?
- [ ] Partial sync recovery?
- [ ] Network failure handling?

### SmartDownloadPrompt.jsx
- [ ] Download cancellation support?
- [ ] Quota estimation before download?
- [ ] Progress persistence across app restarts?

### ProtocolView.jsx
- [ ] Dynamic content sanitization?
- [ ] Error boundaries around protocol steps?
- [ ] Offline asset loading?

### ErrorBoundary.jsx
- [ ] Recovery action options?
- [ ] Error reporting to analytics?
- [ ] Memory state cleanup?

---

## Deliverables

### Option A: Annotation Mode (Investigation Only)
1. **Annotated Source Files**
   - Add TODO comments directly to code following the format above
   - Focus on areas NOT in the existing TODO list

2. **Updated roadmap.md**
   - Add new findings to section 10
   - Update effort estimates
   - Maintain chronological audit log

3. **Verification**
   - Run `npm run build` to ensure annotations don't break the app
   - List all files modified with line counts

### Option B: Implementation Mode (Fix Existing TODOs)
1. **Implement fixes** for existing TODO comments
2. **Remove resolved TODO** after implementation
3. **Update roadmap.md** to mark issues as resolved
4. **Verify with `npm run build`**
5. **Create test cases** if applicable

---

## Commands Reference

```bash
# Find all TODO annotations
findstr /S /N "TODO:" src\*.js src\*.jsx

# Find all NOTE annotations  
findstr /S /N "NOTE:" src\*.js src\*.jsx

# Verify build
npm run build

# Check bundle size
npm run build -- --report
```

---

## Anti-Patterns to Avoid

❌ Vague annotations like `// TODO: Fix this`
❌ Missing solution guidance
❌ Annotating without understanding the full context
❌ Making code changes in annotation-only mode
❌ Duplicating existing TODOs
❌ Ignoring existing patterns in the codebase

---

## Start Command

```
1. Read roadmap.md to understand current audit state
2. Run: findstr /S /N "TODO:" src\*.js src\*.jsx
3. Choose investigation area from "Investigation Targets" above
4. Deep-dive into 2-3 files per session
5. Document findings in structured TODO format
6. Update roadmap.md with new section
7. Verify: npm run build
```

---

## Context from Previous Audits

Key patterns already established in this codebase:
- **Quota handling**: Standardized in WebStorage.js with enhanced error objects
- **Offline detection**: `navigator.onLine` checks before network operations
- **ML fallback**: `isOfflineFallback` flag in classifier.worker.js
- **View transitions**: 2-second timeout with fallback in useViewTransition.js
- **Eviction strategy**: LRU-based loop eviction in dataManager.js

Follow these patterns when proposing solutions.
