# Urban-Offline — Code Audit & Roadmap

**Audit Date**: 2026-02-12  
**Last Updated**: 2026-02-13  
**Scope**: iOS/Android App + Web PWA  
**Framework**: React 19 + Capacitor 7.4.4

---

## Executive Summary

The Urban-Offline codebase has matured from a solid prototype into a **production-ready application** following the completion of Phases 1–4. The three-layer AI system is stable, the Generative Map UI is live, and real-time storage metrics are active.

**ENHANCED PLAN STATUS**: The V1.0 Master Plan has been comprehensively enhanced with complete implementation specifications addressing 14 critical gaps identified through deep codebase analysis. All code is copy-paste ready with zero pseudocode.

### Overall Assessment: **A- (Production-ready with enhanced specifications)**

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | A | Well-designed three-layer AI system, generative UI pipeline |
| Offline Resilience | A- | Cache cleanup, DB recovery, AbortController fixes all shipped |
| Performance | A- | Memoized critical components, optimized re-renders |
| Consistency | A | IntentClassifier unified, intent patterns centralized |
| Security | B+ | No hardcoded secrets, input validation in progress |
| Native Feel | B | Haptics exist but need deeper integration |
| AI Intelligence | B+ | Cartridge awareness live, POI queries planned |

---

## ✅ Completed Phases (Resolved)

### Phase 1: Critical Resilience ✅ COMPLETE
**Completed**: 2026-02-12

| Issue | File | Resolution |
|-------|------|------------|
| SEARCH_CACHE_NEVER_CLEARED 🔴 | `HybridSearch.js` | Cache cleanup on `visibilitychange` + TTL enforcement |
| ABORT_CONTROLLER_LEAK 🔴 | `AIChat.jsx` | Proper cleanup on component unmount via `useEffect` return |
| DB_NO_REOPEN_STRATEGY | `db.js` | Recovery strategy for corrupted IndexedDB instances |

### Phase 2: Performance ✅ COMPLETE
**Completed**: 2026-02-12

| Issue | File | Resolution |
|-------|------|------------|
| OFFLINE_TILELAYER_NO_MEMO | `OfflineTileLayer.jsx` | `L.TileLayer.extend()` moved outside component |
| MESSAGETHREAD_NO_MEMO | `MessageThread.jsx` | Component memoized with `React.memo` |
| COMPOSER_NO_MEMO | `Composer.jsx` | Memoized to prevent re-renders on every keystroke |

### Phase 2.5: Bug Fixes & Stability ✅ COMPLETE
**Completed**: 2026-02-12

- Critical bug fixes for edge cases discovered during Phase 2
- Stability patches for long-running sessions
- ContextManager state access patterns corrected

### Phase 3: UX & Storage Metrics ✅ COMPLETE
**Completed**: 2026-02-12

| Feature | File | Description |
|---------|------|-------------|
| Tile error notifications | `OfflineTileLayer.jsx` | Users notified when map data is incomplete |
| Semantic search failure UI | `RAGPipeline.js` | User notification on degraded search quality |
| Real-time storage metrics | `StorageMetricsService.js` | Live quota monitoring in AmbientStatusBar |
| Improved offline error messages | Various | Context-aware error messaging |

### Phase 4: Generative Map UI ✅ COMPLETE
**Completed**: 2026-02-13

| Feature | File | Description |
|---------|------|-------------|
| `<<MAP:>>` tag system | `MessageBubble.jsx` | AI emits machine-readable map tags |
| MiniMapCard | `MiniMapCard.jsx` | Inline tactical map cards in chat stream |
| "Initiate Jump" | `MiniMapCard.jsx` | Tap to fly to location on full map |
| Cartridge Awareness | `MapCartridgeService.js` | AI resolves location names to map cartridges |
| AmbientStatusBar | `AmbientStatusBar.jsx` | Real-time system context display |

---

## 🚀 V1.0 Release Track (Phases 5–8)

> Full specifications in **[MASTER_PLAN_V1.md](./MASTER_PLAN_V1.md)**

### Phase 8: Production Hardening — *"Armor Plating"* 🔴 NEXT
**Priority**: CRITICAL | **Effort**: 1 week | **Dependencies**: None

Execute first — hardening is the foundation.

| Task | Description | Status |
|------|-------------|--------|
| Cartridge schema validation | Validate all cartridge objects on startup | ⬚ TODO |
| MiniMapCard Error Boundary | Fallback UI showing coords as plain text | ⬚ TODO |
| AmbientStatusBar Error Boundary | Minimal fallback for status bar crashes | ⬚ TODO |
| Input sanitization | Sanitize search queries in MapCartridgeService | ⬚ TODO |
| Model switch guard | Prevent concurrent `switchModel()` calls | ⬚ TODO |
| Render guards | Validate props in MiniMapCard before render | ⬚ TODO |

**New Files**:
- `src/components/chat/MiniMapCardBoundary.jsx`
- `src/components/AmbientStatusBarBoundary.jsx`

---

### Phase 5: Native Polish & Haptics — *"The Feel"*
**Priority**: HIGH | **Effort**: 1 week | **Dependencies**: Phase 8

| Task | Description | Status |
|------|-------------|--------|
| TactileSignatureEngine | 8 named haptic patterns for app events | ⬚ TODO |
| TacticalAudioService | Web Audio synthesized UI sounds (zero files) | ⬚ TODO |
| Integration: MiniMapCard | `map:jump` haptic on "Initiate Jump" | ⬚ TODO |
| Integration: TransformersEngine | `ai:thinking` / `ai:complete` haptics | ⬚ TODO |
| Integration: AmbientStatusBar | `alert:emergency` on critical states | ⬚ TODO |

**New Files**:
- `src/services/haptics/TactileSignatureEngine.js`
- `src/services/haptics/index.js`
- `src/services/audio/TacticalAudioService.js`
- `src/services/audio/index.js`

---

### Phase 6: AI-Enhanced Cartridges — *"Smart Maps"*
**Priority**: HIGH | **Effort**: 1.5 weeks | **Dependencies**: Phase 8

| Task | Description | Status |
|------|-------------|--------|
| POI database schema | Extend cartridges with `pois[]` array | ⬚ TODO |
| CartridgePOIQueryEngine | Search within cartridge POI databases | ⬚ TODO |
| Enhanced `<<MAP:>>` tags | Include POI coords, zoom, type in tags | ⬚ TODO |
| ActionRouter integration | POI query before cartridge fallback | ⬚ TODO |
| MiniMapCard POI display | Type icons, higher zoom for POI results | ⬚ TODO |

**New Files**:
- `src/services/maps/CartridgePOIQueryEngine.js`

---

### Phase 7: Offline Survival Mode — *"Blackout Protocol"*
**Priority**: MEDIUM-HIGH | **Effort**: 1.5 weeks | **Dependencies**: Phase 5 + 6

| Task | Description | Status |
|------|-------------|--------|
| BatteryManager | Monitor battery level, emit to ContextManager | ⬚ TODO |
| SurvivalModeService | Orchestrate full mode switch | ⬚ TODO |
| SurvivalModeOverlay | Minimal dark UI skin | ⬚ TODO |
| Auto-trigger at ≤10% | Battery threshold with user confirmation | ⬚ TODO |
| Force SmolLM-360M | Switch to lowest-power AI model | ⬚ TODO |
| Screen brightness control | Dim to 20% via Capacitor plugin | ⬚ TODO |
| Disable haptics/audio | Kill non-essential feedback systems | ⬚ TODO |

**New Files**:
- `src/services/power/BatteryManager.js`
- `src/services/power/SurvivalModeService.js`
- `src/services/power/index.js`
- `src/components/SurvivalModeOverlay.jsx`

**New Capacitor Plugins**:
- `@capacitor-community/battery-status`
- `@capacitor/screen-brightness`

---

## 📊 Execution Timeline

| Order | Phase | Depends On | Est. Duration |
|-------|-------|------------|---------------|
| 1 | **Phase 8** — Production Hardening | Nothing | 1 week |
| 2 | **Phase 5** — Native Polish & Haptics | Phase 8 | 1 week |
| 3 | **Phase 6** — AI-Enhanced Cartridges | Phase 8 | 1.5 weeks |
| 4 | **Phase 7** — Survival Mode | Phase 5 + 6 | 1.5 weeks |

```
Week 1:  ████████████████████████  Phase 8 (Hardening)
Week 2:  ████████████████████████  Phase 5 (Haptics/Audio)
Week 3:  ████████████████████████  Phase 6 (AI Cartridges) — starts
Week 4:  ████████████████████████  Phase 6 completes + Phase 7 starts
Week 5:  ████████████████████████  Phase 7 (Survival Mode) — completes
         ─────────────────────────
         🚀 V1.0 RELEASE CANDIDATE
```

---

## 🏁 V1.0 Release Criteria

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | All cartridges pass schema validation on startup | 8 |
| 2 | Error boundaries wrap all generative UI components | 8 |
| 3 | Haptic signatures fire on iOS and Android | 5 |
| 4 | Tactical audio plays with <10ms latency | 5 |
| 5 | "Where is the hospital?" returns precise POI coords | 6 |
| 6 | Survival Mode activates/deactivates cleanly | 7 |
| 7 | Battery monitoring works on native platforms | 7 |
| 8 | No unhandled promise rejections in production build | 8 |
| 9 | Bundle size remains under budget (`size-budget.json`) | All |
| 10 | App runs fully offline for 24+ hours without memory leaks | All |

---

## Positive Findings (Carried Forward)

### ✅ Three-Layer Helper System Properly Unified
- `HybridSearch.js` correctly uses `IntentClassifier.classifyIntent()`
- `TriageRouter.js` shares `EMERGENCY_PATTERNS` from `config/intentPatterns.js`
- Consistent emergency routing across search, chat, and triage

### ✅ Good Quota Handling
- Proactive storage quota checks before downloads
- LRU eviction strategy for regions
- User notifications for quota warnings

### ✅ Proper Error Boundaries
- `MapComponent.jsx` has `MapErrorBoundary`
- `ErrorBoundary.jsx` with compact fallback
- Graceful degradation on component failures

### ✅ No Hardcoded Secrets
- No API keys or secrets found in codebase
- Proper environment variable patterns

### ✅ iOS Zoom Prevention
- Search input uses `fontSize: 16px` to prevent auto-zoom
- Proper `touchAction: 'manipulation'` for immediate response

### ✅ Generative Map UI Pipeline
- AI emits `<<MAP:>>` tags parsed by MessageBubble
- MiniMapCard renders inline tactical maps
- "Initiate Jump" navigates to full map view
- Cartridge awareness resolves location names

---

## Files Modified During Audit (Phase 1–4)

| File | Phase | Changes |
|------|-------|---------|
| `src/services/search/HybridSearch.js` | 1 | Cache cleanup + TTL enforcement |
| `src/pages/AIChat.jsx` | 1 | AbortController cleanup on unmount |
| `src/services/db.js` | 1 | DB recovery strategy |
| `src/components/OfflineTileLayer.jsx` | 2, 3 | Memoized + tile error notifications |
| `src/components/MessageThread.jsx` | 2 | Memoized with React.memo |
| `src/components/Composer.jsx` | 2 | Memoized to reduce re-renders |
| `src/services/ai/RAGPipeline.js` | 3 | Semantic search failure UI |
| `src/components/chat/MiniMapCard.jsx` | 4 | Inline tactical map cards |
| `src/components/MessageBubble.jsx` | 4 | `<<MAP:>>` tag parsing |
| `src/services/maps/MapCartridgeService.js` | 4 | Cartridge registry + search |
| `src/components/AmbientStatusBar.jsx` | 3, 4 | Real-time system context |

---

## Testing Recommendations

### Critical Path Tests
1. **Offline search** with expired cache entries ✅ (Phase 1)
2. **Rapid navigation** with AbortController ✅ (Phase 1)
3. **Low storage** scenarios on both platforms ✅ (Phase 3)
4. **Map tile loading** failures ✅ (Phase 3)
5. **MiniMapCard rendering** with invalid coordinates (Phase 8)
6. **Survival Mode** activation/deactivation cycle (Phase 7)
7. **POI query** accuracy for emergency locations (Phase 6)

### Performance Tests
1. Memory usage after 1 hour of continuous use ✅ (Phase 1)
2. Scroll performance during AI streaming ✅ (Phase 2)
3. Time to first paint on low-end devices
4. Battery drain comparison: Normal vs Survival Mode (Phase 7)

---

## Conclusion

Urban-Offline has completed its foundational phases and is ready for the V1.0 release track. The app demonstrates strong architecture, reliable offline operation, and an innovative generative UI pipeline. The remaining four phases focus on **feel** (haptics/audio), **intelligence** (POI queries), **resilience** (survival mode), and **reliability** (hardening).

**Recommendation**: Begin Phase 8 (Production Hardening) immediately, then proceed through Phases 5–7 in order.

**Target**: V1.0 Release Candidate in 5 weeks.

---

*See [MASTER_PLAN_V1.md](./MASTER_PLAN_V1.md) for full technical specifications.*
