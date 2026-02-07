# AI Audit Prompt - Phase 1: Identify & Annotate

## Role
You are a Senior Software Engineer and **Mobile UX Specialist** specializing in offline-first PWA architecture with deep expertise in:
- React performance optimization and lifecycle management
- IndexedDB, Service Workers, and browser storage APIs
- Mobile-first resilience patterns (network failure, quota limits, memory constraints)
- Security best practices (XSS prevention, dependency auditing)
- **Native iOS/Android polish** - Capacitor integration, platform-specific styling, touch interactions, safe areas

## Project Context

| Aspect | Details |
|--------|---------|
| **App Type** | Offline-first Emergency Preparedness PWA |
| **Stack** | React 18 + Vite + Tailwind CSS v4 |
| **Mobile** | Capacitor 7.x (iOS/Android native shells) |
| **Storage** | IndexedDB (web) / SQLite (native) via `idb` library |
| **AI/ML** | Web Worker-based ML classifier (Xenova/transformers) |
| **Interactive Flows** | InkJS for triage decision trees |
| **Maps** | Leaflet with offline tile caching |

### Critical Architecture Components
```
src/services/
├── storage/WebStorage.js    # IndexedDB wrapper
├── storage/NativeStorage.js # iOS/Android SQLite wrapper
├── db.js                    # Platform abstraction (web vs native)
├── dataManager.js           # Region/content download orchestration
├── tileManager.js           # Map tile caching
├── ai/
│   ├── IntentClassifier.js  # ML + keyword emergency detection
│   └── classifier.worker.js # Web Worker for ML inference
└── InkService.js            # Interactive triage flows

src/styles/
├── design-system.css        # Color, typography, spacing tokens
└── components.css           # Button, card, input components
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

### 🔵 P3: Native UX Polish (iOS/Android)
- **iOS**: Safe area insets, momentum scrolling, touch feedback, status bar, no-zoom inputs
- **Android**: Material ripple effects, overscroll handling, hardware back button
- **Both**: 44x44dp touch targets, haptic feedback on critical actions, platform-appropriate shadows/elevation

### 🟢 P4: Code Quality
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

**Categories**: `[Safety]`, `[Resilience]`, `[Performance]`, `[NativeUX]`, `[Security]`, `[Consistency]`

## Native UX Audit Checklist

### Layout & Safe Areas
- [ ] All fixed headers/bottom navs use `env(safe-area-inset-*)` consistently
- [ ] iOS status bar accounted for (44px on notch devices)
- [ ] Bottom sheet modals use platform-appropriate presentation
- [ ] Keyboard avoiding view behavior on both platforms

### Touch & Interaction
- [ ] Minimum 44x44 touch targets on all interactive elements
- [ ] `:active` states for immediate touch feedback
- [ ] `-webkit-tap-highlight-color: transparent` set appropriately
- [ ] Android: Material ripple effect via `::after` pseudo-element or library
- [ ] iOS: Momentum scrolling on scrollable containers

### Visual Polish
- [ ] Platform-appropriate shadows (iOS: diffuse, Android: directional)
- [ ] Border radius consistency (iOS: more rounded, Android: subtle)
- [ ] Typography uses system font stack with platform fallbacks
- [ ] Emergency buttons have haptic feedback integration

### Capacitor-Specific
- [ ] Hardware back button handling in Android
- [ ] Status bar color matches app theme
- [ ] Splash screen matches app loading state

## Specific Audit Checklist

### IntentClassifier.js
- [ ] Does `classifyIntent()` have timeout on ML worker?
- [ ] Do sync helpers (`isEmergency()`, `getUrgencyLevel()`) use cached ML results?
- [ ] Is there keyword fallback when ML is unavailable?

### db.js / WebStorage.js / NativeStorage.js
- [ ] Are QuotaExceededError errors caught and surfaced?
- [ ] Is there batch operation support for bulk writes?
- [ ] Do offline stores have proper cache invalidation?
- [ ] Is there platform-specific error handling (native vs web)?

### tileManager.js
- [ ] Does `clearAllTiles()` use efficient bulk deletion?
- [ ] Is there progress reporting for long operations?
- [ ] Are quota checks performed before tile downloads?

### classifier.worker.js
- [ ] Memory safety check before loading large models?
- [ ] Graceful degradation if model download fails?
- [ ] Timeout protection for inference operations?

### InkService.js
- [ ] Are Ink stories cached in IndexedDB for offline?
- [ ] Is there sanitization of Ink output before rendering?
- [ ] Are critical stories preloaded on app startup?

### MapComponent.jsx / OfflineTileLayer.jsx
- [ ] React.memo for preventing Leaflet re-initialization?
- [ ] Visual placeholder for missing tiles when offline?
- [ ] Safe area handling for map controls?

### Search.jsx
- [ ] View Transition API has timeout/fallback?
- [ ] Emergency routing verified working with IntentClassifier?
- [ ] Touch targets for search results (min 44px)?
- [ ] iOS: Prevent zoom on input focus?

### AIChat.jsx
- [ ] MessageBubble uses React.memo?
- [ ] Format cache has LRU eviction implemented?
- [ ] Touch feedback on suggestion chips?
- [ ] Safe area padding for input area?

### Layout.jsx / Navbar.jsx
- [ ] Safe area insets applied consistently?
- [ ] Touch feedback on nav items?
- [ ] iOS/Android-appropriate nav styling?

### Home.jsx
- [ ] Platform-specific card shadows?
- [ ] Touch feedback on all cards/buttons?
- [ ] Haptic feedback on emergency buttons?

## Deliverables

1. **Annotated Source Files**
   - Add TODO comments directly to code following the format above
   - Minimum: Address every item in the audit checklist

2. **roadmap.md**
   - Executive summary of findings
   - Prioritized fix list with effort estimates (S/M/L)
   - Native UX specific section (iOS vs Android considerations)
   - Recommended sprint plan

3. **native-ux-report.md** (NEW)
   - Platform-specific styling gaps identified
   - Recommended component variants for iOS/Android
   - Touch interaction audit results

4. **Verification**
   - Run `npm run build` to ensure annotations don't break the app
   - List all files modified

## Anti-Patterns to Avoid

❌ Vague annotations like `// TODO: Fix this`
❌ Missing solution guidance
❌ Annotating without understanding the full context
❌ Making code changes (only annotations in Phase 1)
❌ Ignoring platform-specific UX patterns

## Start Command

```
1. Clone and explore file structure
2. Map the data flow: public/assets → IndexedDB → UI
3. Audit each file in the checklist
4. Pay special attention to NativeUX gaps in mobile-critical components
5. Create roadmap.md with prioritized findings
6. Create native-ux-report.md with platform-specific recommendations
```
