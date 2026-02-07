# AI Audit Prompt - Phase 1: Identify & Annotate

## Role
You are a Senior Software Engineer and Security Auditor specializing in **offline-first PWA architecture**. Your expertise includes:
- React performance optimization and lifecycle management
- IndexedDB, Service Workers, and browser storage APIs
- Mobile-first resilience patterns (network failure, quota limits, memory constraints)
- Security best practices (XSS prevention, dependency auditing)

## Project Context

| Aspect | Details |
|--------|---------|
| **App Type** | Offline-first Emergency Preparedness PWA |
| **Stack** | React 18 + Vite + Tailwind CSS |
| **Storage** | IndexedDB via `idb` library |
| **AI/ML** | Web Worker-based ML classifier (Xenova/transformers) |
| **Interactive Flows** | InkJS for triage decision trees |
| **Maps** | Leaflet with offline tile caching |

### Critical Architecture Components
```
src/services/
├── storage/WebStorage.js    # IndexedDB wrapper
├── db.js                    # Platform abstraction (web vs native)
├── dataManager.js           # Region/content download orchestration
├── tileManager.js           # Map tile caching
├── ai/
│   ├── IntentClassifier.js  # ML + keyword emergency detection
│   └── classifier.worker.js # Web Worker for ML inference
└── InkService.js            # Interactive triage flows
```

## Objective
Perform a **systematic code audit** to identify gaps, then annotate the codebase with actionable TODO comments. The goal is zero ambiguity - every annotation should specify:
1. **What's wrong** (the issue)
2. **Why it matters** (impact)
3. **How to fix it** (concrete solution)

## Audit Categories (Priority Order)

### 🔴 P0: Safety-Critical
- **Life-safety features** must never fail silently
- Emergency detection (IntentClassifier) must have deterministic fallback
- Triage flows must work 100% offline

### 🟠 P1: Offline Resilience  
- All network fetches need offline fallback
- Storage quota handling (eviction, user notification)
- ML model loading failure → keyword fallback

### 🟡 P2: Performance
- Component memoization (especially MapComponent, chat messages)
- IndexedDB batch operations
- Bundle size optimization

### 🟢 P3: Code Quality
- Consistency in error handling patterns
- Dead code removal
- Type safety improvements

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
// =============================================================================
```

**Categories**: `[Safety]`, `[Resilience]`, `[Performance]`, `[Security]`, `[Consistency]`

## Specific Audit Checklist

### IntentClassifier.js
- [ ] Does `classifyIntent()` have timeout on ML worker?
- [ ] Do sync helpers (`isEmergency()`, `getUrgencyLevel()`) use cached ML results?
- [ ] Is there keyword fallback when ML is unavailable?

### db.js / WebStorage.js
- [ ] Are QuotaExceededError errors caught and surfaced?
- [ ] Is there batch operation support for bulk writes?
- [ ] Do offline stores have proper cache invalidation?

### tileManager.js
- [ ] Does `clearAllTiles()` use efficient bulk deletion?
- [ ] Is there progress reporting for long operations?

### classifier.worker.js
- [ ] Memory safety check before loading large models?
- [ ] Graceful degradation if model download fails?

### InkService.js
- [ ] Are Ink stories cached in IndexedDB for offline?
- [ ] Is there sanitization of Ink output before rendering?

### MapComponent.jsx / OfflineTileLayer.jsx
- [ ] React.memo for preventing Leaflet re-initialization?
- [ ] Visual placeholder for missing tiles when offline?

### Search.jsx
- [ ] View Transition API has timeout/fallback?
- [ ] Emergency routing verified working with IntentClassifier?

## Deliverables

1. **Annotated Source Files**
   - Add TODO comments directly to code following the format above
   - Minimum: Address every item in the audit checklist

2. **roadmap.md**
   - Executive summary of findings
   - Prioritized fix list with effort estimates
   - Recommended sprint plan

3. **Verification**
   - Run `npm run build` to ensure annotations don't break the app
   - List all files modified

## Anti-Patterns to Avoid

❌ Vague annotations like `// TODO: Fix this`
❌ Missing solution guidance
❌ Annotating without understanding the full context
❌ Making code changes (only annotations in Phase 1)

## Start Command

```
1. Clone and explore file structure
2. Map the data flow: public/assets → IndexedDB → UI
3. Audit each file in the checklist
4. Create roadmap.md with prioritized findings
```
