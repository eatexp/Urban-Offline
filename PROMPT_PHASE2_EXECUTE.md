# AI Implementation Prompt - Phase 2: Execute & Verify

## Role
You are a Senior Software Engineer executing a **prioritized stabilization sprint** on the Urban Offline PWA. Your focus is:
- **Zero regressions**: Every change must pass build verification
- **Incremental progress**: Complete one task fully before moving to next
- **Native polish**: Ensure iOS/Android-specific styling and interactions
- **Clear communication**: Update roadmap.md as you progress

## Context Handoff

You're continuing work started in Phase 1 (Audit). The codebase now contains:
- **TODO annotations** following structured format in multiple files
- **roadmap.md** with prioritized task list
- **native-ux-report.md** with platform-specific requirements
- **No breaking changes** (audit was annotation-only)

## Execution Protocol

### For Each Task:

```
1. READ the TODO annotation completely
2. UNDERSTAND the surrounding code context (view 50+ lines around it)
3. PLAN the minimal change to fix the issue
4. IMPLEMENT the fix
5. REMOVE or UPDATE the TODO annotation
6. VERIFY with `npm run build`
7. UPDATE roadmap.md (mark task complete, add notes)
```

### Task Priority Order

Execute in this exact order (skip if already done):

| Priority | Category | Typical Pattern |
|----------|----------|-----------------|
| P0 | Safety-Critical | Fix deterministic fallbacks, error boundaries |
| P1 | Offline Resilience | Add IndexedDB caching, offline detection |
| P2 | Performance | React.memo, batch operations, O(n) → O(1) |
| P3 | Native UX | Platform-specific styling, haptics, safe areas |
| P4 | Code Quality | Cleanup, documentation, type improvements |

## Implementation Patterns

### Pattern: Adding Offline Fallback
```javascript
// BEFORE (network-only)
const data = await fetch(url);

// AFTER (with fallback chain)
// 1. Check cache first
const cached = await db.get(STORE_NAME, key);
if (cached) return cached;

// 2. Network fetch with offline guard
if (!navigator.onLine) {
    throw new Error('Offline and no cached data');
}

// 3. Fetch and cache
const data = await fetch(url).then(r => r.json());
await db.put(STORE_NAME, data, key);
return data;
```

### Pattern: React.memo for Expensive Components
```javascript
// BEFORE
export default MyComponent;

// AFTER
export default React.memo(MyComponent);
// Or with custom comparison:
export default React.memo(MyComponent, (prev, next) => {
    return prev.id === next.id;
});
```

### Pattern: Memory Safety Check
```javascript
// Before loading large ML models
const deviceMemory = navigator.deviceMemory || 4;
if (deviceMemory < 2) {
    console.warn('Low memory device, skipping ML model');
    throw new Error('Insufficient memory');
}
```

### Pattern: IndexedDB Batch Operations
```javascript
// BEFORE (O(n) transactions)
for (const item of items) {
    await db.put(storeName, item);
}

// AFTER (single transaction)
const tx = database.transaction(storeName, 'readwrite');
await Promise.all(items.map(item => tx.store.put(item)));
await tx.done;
```

### Pattern: O(1) Store Clear
```javascript
// BEFORE (O(n) deletes)
const keys = await db.getAllKeys(storeName);
for (const key of keys) {
    await db.delete(storeName, key);
}

// AFTER (O(1) clear)
const tx = database.transaction(storeName, 'readwrite');
await tx.objectStore(storeName).clear();
await tx.done;
```

### Pattern: iOS Safe Area
```css
/* BEFORE */
.header { padding: 16px; }

/* AFTER */
.header { 
    padding: 16px;
    padding-top: max(16px, env(safe-area-inset-top));
}
```

### Pattern: Touch Feedback
```css
/* iOS/Android consistent touch feedback */
.interactive {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
}
.interactive:active {
    transform: scale(0.98);
    opacity: 0.8;
}

/* Android Material ripple alternative */
.interactive::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.2s;
}
.interactive:active::after {
    opacity: 1;
}
```

### Pattern: Haptic Feedback
```javascript
// On critical emergency actions
const triggerHaptic = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // Android
        const patterns = {
            light: 10,
            medium: 20,
            heavy: [50, 100, 50],
            error: [50, 100, 50, 100, 50]
        };
        navigator.vibrate(patterns[type] || 10);
    }
    // iOS 13+ via Capacitor Haptics plugin (if available)
};
```

## Verification Requirements

After EACH task:
- [ ] `npm run build` passes with exit code 0
- [ ] No new lint errors introduced
- [ ] TODO annotation removed or updated to VERIFIED
- [ ] roadmap.md updated with completion status

After ALL tasks:
- [ ] `grep -r "TODO" src/` returns zero results (except VERIFIED ones)
- [ ] Final build size is within 5% of starting
- [ ] Create walkthrough.md documenting changes
- [ ] **Native UX check**: Components feel native on both iOS and Android

## Communication Protocol

### Progress Updates
After completing each major task, provide:
```
✅ Task N Complete: [Title]

What: [Brief description of change]
Files: [List of modified files]
Impact: [Before/after if applicable]
Native UX: [If applicable: iOS/Android improvements made]

Next: [What you're doing next]
```

### Blockers
If you encounter issues:
```
⚠️ Blocked: [Issue description]

Context: [What you were trying to do]
Options:
1. [Option A with tradeoffs]
2. [Option B with tradeoffs]

Recommendation: [Your suggested approach]
```

## Specific Implementation Targets

Based on Phase 1 findings, address in this order:

### Sprint 1: Safety & Resilience
1. **IntentClassifier.js** - Fix timeout race condition with Promise.race
2. **InkService.js** - Add critical story offline fallback warning
3. **WebStorage.js** - Add IndexedDB corruption recovery
4. **classifier.worker.js** - Add model retry when online

### Sprint 2: Native UX Essentials
5. **Search.jsx** - Fix iOS input zoom (font-size: 16px)
6. **Layout.jsx** - Add safe area consistency
7. **App.jsx** - Add Android hardware back button handling
8. **Home.jsx** - Add haptic feedback utility to emergency buttons

### Sprint 3: Polish & Performance
9. **components.css** - Add touch feedback system (:active states)
10. **Navbar.jsx** - Add touch feedback and haptics
11. **AIChat.jsx** - Add MessageBubble custom comparison
12. **IntentClassifier.js** - Add LRU intent cache
13. **tileManager.js** - Add quota pre-check

## Anti-Patterns to Avoid

❌ Making multiple changes without intermediate builds
❌ Leaving TODOs partially addressed
❌ Adding new dependencies without justification
❌ Changing public APIs without updating consumers
❌ Over-engineering simple fixes
❌ Ignoring platform-specific UX conventions

## Success Criteria

```
✅ Zero TODO comments remaining in src/ (except VERIFIED)
✅ All builds passing
✅ roadmap.md shows all items complete
✅ walkthrough.md documents changes made
✅ No regressions in functionality
✅ Native UX feels polished on both iOS and Android
```

## Start Command

```
1. Read roadmap.md to understand current state
2. Read native-ux-report.md for platform requirements
3. Find highest priority incomplete TODO
4. Execute using the protocol above
5. Repeat until all TODOs resolved
6. Create final walkthrough.md
```

---

## Current TODO Inventory (from Phase 1)

### 🔴 P0: Safety-Critical
- [ ] `IntentClassifier.js:64` - INTENT_CLASSIFICATION_TIMEOUT_RACE_CONDITION
- [ ] `InkService.js:35` - CRITICAL_STORY_PRELOAD_OFFLINE_FALLBACK

### 🟠 P1: Resilience
- [ ] `classifier.worker.js:26` - WORKER_OFFLINE_MODEL_FALLBACK
- [ ] `WebStorage.js:11` - INDEXEDDB_CORRUPTION_RECOVERY
- [ ] `tileManager.js:16` - TILE_DOWNLOAD_QUOTA_CHECK

### 🟡 P2: Performance
- [ ] `IntentClassifier.js:309` - INTENT_CACHE_SIZE_LIMIT
- [ ] `AIChat.jsx:496` - MESSAGE_BUBBLE_DEEP_COMPARISON

### 🔵 P3: Native UX
- [ ] `Layout.jsx:27` - LAYOUT_SAFE_AREA_CONSISTENCY
- [ ] `Navbar.jsx:12` - NAVBAR_TOUCH_FEEDBACK
- [ ] `Navbar.jsx:33` - NAVBAR_ANDROID_HARDWARE_BACK
- [ ] `Home.jsx:23` - EMERGENCY_BUTTON_HAPTIC_FEEDBACK
- [ ] `Search.jsx:165` - SEARCH_INPUT_IOS_ZOOM_PREVENTION
- [ ] `components.css:11` - COMPONENT_TOUCH_FEEDBACK_SYSTEM

**Total: 14 TODOs to resolve**
