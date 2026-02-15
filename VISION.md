# Urban-Offline Vision Document V1.0
## "The Premium Offline Intelligence Platform"

---

## EXECUTIVE SUMMARY

Urban-Offline is a **cognitive survival companion** that functions when all other systems fail. It combines the permanence of Kiwix-style offline archives with the intelligence of local AI models, wrapped in a premium native experience that rivals first-party iOS/Android applications.

**The Hybrid Formula:**
```
Kiwix Content Layer + Local AI Intelligence + Premium Native UX = Urban-Offline
```

---

## 1. THE THREE PILLARS

### 1.1 Grokopedia (Knowledge Layer)
*Browse, verify, explore*

**Purpose:** Trust through transparency. Users can verify AI answers by reading source material directly.

**Key Features:**
- **Library View:** Browse installed content packs (ZIM files)
- **Hybrid Search:** Instant title match + full-text semantic search
- **Article Reader:** Clean, distraction-free reading with native styling
- **AI Integration:** "Ask AI about this" contextual chips
- **Source Citations:** AI responses link directly to Grokopedia articles

**Technical Stack:**
- ZIM file parsing via libzim WebAssembly
- Pre-computed embeddings for RAG during installation
- Semantic versioning for content packs (`content-manifest.json`)
- Delta update support for efficient content refreshes

### 1.2 AI Emergency Assistant (Intelligence Layer)
*Intelligent, contextual, private*

**Purpose:** Provide intelligent answers when users need guidance, with full privacy (no data leaves device).

**Key Features:**
- **Device-Aware Model Selection:** Automatically recommends optimal models
- **"Choose Any" Functionality:** Users can override with tiered warnings
- **RAG Pipeline:** Retrieval-augmented generation with source citations
- **Progressive Download:** Resume capability, background fetch
- **Battery Awareness:** Auto-disable when power <20%

**Model Tiers:**
```
ESSENTIAL  (0-300MB)   → Qwen 0.5B        → All devices
STANDARD   (300-600MB)  → TinyLlama 1.1B   → Mid-range+
ADVANCED   (600MB-1.2GB) → Phi-3 Mini       → High-end
PRO        (1.2GB+)      → SmolLM 1.7B      → Premium + Purchase
```

### 1.3 Ink Triage (Reliability Layer)
*Deterministic, life-safety critical*

**Purpose:** When AI might fail or batteries die, deterministic decision trees provide reliable guidance.

**Key Features:**
- **Zero AI Dependency:** Pure JavaScript logic, always works
- **Step-by-Step Flows:** CPR, choking, bleeding, evacuation
- **Binary Decisions:** Yes/No only, no ambiguity
- **Offline-First:** Pre-compiled JSON, instant load
- **Legal Protocols:** PACE codes, arrest rights, stop & search

---

## 2. THE LOCALLY AI × KIWIX HYBRID

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│         (Premium Native iOS/Android Experience)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Grokopedia  │  │  AI Chat     │  │  Triage      │      │
│  │  (Browse)    │  │  (Ask)       │  │  (Emergency) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Intent Classifier  →  Route to Triage/AI/Search    │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│           ┌─────────────┼─────────────┐                    │
│           ▼             ▼             ▼                    │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│    │  Ink     │  │  RAG     │  │  Hybrid  │               │
│    │  Engine  │  │  Pipeline│  │  Search  │               │
│    └──────────┘  └────┬─────┘  └──────────┘               │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │  Local LLM      │                           │
│              │  (transformers) │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ZIM Packs   │  │  Embeddings  │  │  Ink Stories │      │
│  │  (Kiwix)     │  │  (RAG Index) │  │  (JSON)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Content Types:                                             │
│  • Medical (Wikipedia Medicine)                            │
│  • Survival (Wilderness, Urban)                            │
│  • Legal (UK PACE, US Rights)                              │
│  • Reference (First Aid, Maps)                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow: AI + Grokopedia Integration

**Scenario: User asks "How do I treat a burn?"**

```
1. User Query: "How do I treat a burn?"
         │
         ▼
2. Intent Classifier
   └── Category: medical
   └── Confidence: 0.94
   └── Route: AI Chat
         │
         ▼
3. RAG Pipeline
   ├── Query → Vector embedding
   ├── Search embedding index
   │   └── Top matches: "Burn", "First aid kit", "Cool water"
   ├── Retrieve article chunks
   │   └── Sources: Wikipedia-Medicine-Burns
   ├── Build context window
   └── Format for LLM
         │
         ▼
4. Local LLM Generation
   ├── Model: Phi-3 Mini (if available)
   │   └── Tokens: 150 generated
   └── Fallback: Template response (if no model)
         │
         ▼
5. Response with Citations
   "For minor burns, cool the area with running
    water for 20 minutes [1]. Do not apply ice...
    
    [1] First Aid/Burns - Wikipedia Medicine
        [Read in Grokopedia →]"
         │
         ▼
6. User clicks citation
   └── Navigate to /grokopedia/article/first-aid-burns
   └── Show full article with verified information
```

### 2.3 Content Pack Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   REMOTE    │    │   DEVICE    │    │   RUNTIME   │
│   SERVER    │    │   STORAGE   │    │   MEMORY    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 1. Download      │                  │
       │ ───────────────► │                  │
       │    ZIM file      │                  │
       │    (delta)       │                  │
       │                  │                  │
       │                  │ 2. Validate      │
       │                  │    SHA-256       │
       │                  │                  │
       │                  │ 3. Extract       │
       │                  │ ───────────────► │
       │                  │    & Index       │
       │                  │                  │
       │                  │                  │ 4. Generate
       │                  │ ◄─────────────── │    Embeddings
       │                  │    Store index   │
       │                  │                  │
       │                  │ 5. Update        │
       │                  │    Manifest      │
       │                  │                  │
       │ ◄─────────────── │ 6. Report        │
       │    Analytics     │    Usage         │
       │    (opt-in)      │                  │
```

---

## 3. DEVICE-AWARE AI MARKETPLACE

### 3.1 Compatibility Scoring Algorithm

The marketplace automatically sorts models by a **compatibility score (0-100)**:

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Tier Match | 30 pts | Device tier vs Model tier alignment |
| Size Fit | 20 pts | Storage headroom ratio |
| Performance | 20 pts | Quality/Speed match to use case |
| Battery | 15 pts | Current power state consideration |
| Storage | 10 pts | Available space ratio |
| Category | 5 pts | Speed vs Quality preference |

**Scoring Example:**
```
Device: iPhone 14 Pro (Tier: ADVANCED)
Model: Phi-3 Mini (Tier: ADVANCED, Size: 800MB)

Tier Match:     30/30 (exact match)
Size Fit:       20/20 (800MB < 1.2GB recommended)
Performance:    18/20 (quality model, quality preference)
Battery:        15/15 (85% battery, not charging)
Storage:        10/10 (45GB available)
Category:       5/5 (balanced = balanced)

TOTAL: 98/100 → "Perfect Match"
```

### 3.2 "Choose Any" Warning Tiers

Users can override recommendations with progressive warnings:

| Level | Trigger | User Experience |
|-------|---------|-----------------|
| **Critical** | Model >2x device max | Block with "Try Anyway" (must acknowledge) |
| **Severe** | Model 1.5-2x recommended | Warning modal with performance impact details |
| **Warning** | Model >recommended | Info modal with battery/performance impact |
| **Battery** | Low power + large model | Suggest smaller alternative, allow override |
| **Thermal** | Device warm | Inform of potential throttling |

---

## 4. PREMIUM NATIVE EXPERIENCE

### 4.1 Platform-Specific Optimizations

**iOS:**
```css
/* Visual */
--card-radius: 20px;                    /* Rounded iOS style */
--button-radius: 12px;
--glass-blur: 24px;                     /* Heavier blur for iOS */

/* Animation */
--ease-primary: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Spring */

/* Interactions */
overscroll-behavior: auto;              /* Rubber-band scrolling */
-webkit-touch-callout: none;            /* Disable callout */
```

**Android:**
```css
/* Visual */
--card-radius: 16px;                    /* Material 3 */
--button-radius: 16px;                  /* Material shapes */
--shadow-elevation: material-level-3;   /* Elevation shadows */

/* Animation */
--ease-primary: cubic-bezier(0.4, 0, 0.2, 1); /* Material */

/* Interactions */
--ripple-color: rgba(255,255,255,0.1);  /* Ripple feedback */
```

### 4.2 Haptic Feedback Map

| Component | Haptic | Trigger |
|-----------|--------|---------|
| Button Press | Light Impact | On touch down |
| Card Selection | Medium Impact | On selection |
| Emergency Button | Heavy Impact | On activation |
| Model Download | Success | On completion |
| Delete Confirm | Warning | On initiate |
| Error State | Error | On failure |
| Picker Selection | Selection | On value change |

### 4.3 Performance Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| First Paint | <100ms | 3G connection |
| Time to Interactive | <3s | Mid-tier device |
| Scroll FPS | 60fps | All devices |
| AI Response Start | <2s | After model loaded |
| Article Load | <100ms | From cache |
| Search Results | <200ms | Typing debounce |

---

## 5. INNOVATIONS & FUTURE ROADMAP

### 5.1 Predictive Content Loading

The app pre-loads content based on context:

```javascript
// Location-based
if (user.inLondon && weather.floodingRisk) {
  suggestPack('uk-flooding-guide');
}

// Season-based
if (season === 'winter') {
  prioritizeContent('hypothermia', 'ice-safety');
}

// Battery-aware
if (battery.level < 0.3) {
  disableAIPrefetch();
  enableSurvivalMode();
}
```

### 5.2 Mesh Network Preparedness

For complete infrastructure failure:

- **Bluetooth LE Discovery:** Find nearby Urban-Offline users
- **Offline Messaging:** Store-and-forward messages via Bluetooth
- **Emergency Beacon:** Broadcast location to nearby devices
- **Resource Sharing:** Discover who has what supplies nearby

### 5.3 Context-Aware Intelligence

Proactive assistance based on situation:

| Context | Trigger | Action |
|---------|---------|--------|
| Weather Alert | Flood warning | Surface flooding content |
| Travel Detected | New city | Suggest regional packs |
| Low Battery | <20% | Disable AI, enable survival mode |
| Night Mode | After 10pm | Prioritize navigation content |
| Content Gap | Missing medical | Prompt to download |

---

## 6. TESTING & QUALITY ASSURANCE

### 6.1 Automated Quality Gates

**Pre-commit:**
- ESLint: Zero errors
- Bundle size: <200KB initial
- Lighthouse PWA: >90 score
- Type checking: No `any` types

**Pre-release:**
- iOS: iPhone 12, 14 Pro, SE simulators
- Android: Pixel 7, Samsung A54 emulators
- Physical devices: Offline mode verification
- AI testing: Download resume after app kill
- Battery testing: AI disable at 20%
- Thermal testing: Throttling behavior

### 6.2 User Testing Protocol

```
WEEK 1: Core Flows
├── Download AI model
├── Search Grokopedia
├── Run triage flow
└── Verify offline functionality

WEEK 2: Edge Cases
├── Low storage scenarios
├── Thermal throttling
├── Network interruption
└── Battery depletion

WEEK 3: Stress Testing
├── 24-hour airplane mode
├── Rapid app switching
├── Multiple content packs
└── Concurrent downloads

WEEK 4: Polish
├── Micro-interactions
├── Perceived performance
├── Accessibility (VoiceOver/TalkBack)
└── Final QA pass
```

### 6.3 Performance Budgets

| Resource | Budget | Actual |
|----------|--------|--------|
| Initial Bundle | 200KB | ~180KB |
| AI Module (lazy) | 150KB | ~120KB |
| Map Module (lazy) | 100KB | ~85KB |
| Total Runtime | 2MB | ~1.5MB |
| First Paint | 100ms | ~80ms |
| TTI (mid-tier) | 3s | ~2.5s |

---

## 7. DESIGN PRINCIPLES

### 7.1 Minimalism Rules

**DO:**
- ✓ Use solid colors for buttons (no gradients)
- ✓ Apply depth through z-layers, not shadows
- ✓ Reserve emergency red for true danger
- ✓ Use haptics over visual feedback when possible
- ✓ Maintain 8px grid alignment everywhere

**DON'T:**
- ✗ Mix shadows AND borders for depth
- ✗ Animate layout properties (width, height)
- ✗ Use decorative gradients on functional elements
- ✗ Show loading spinners for <300ms operations
- ✗ Auto-play animations without user consent

### 7.2 Emergency UX Standards

| Principle | Implementation |
|-----------|----------------|
| Speed | Critical content in <100ms |
| Clarity | Binary choices only in emergencies |
| Redundancy | Always have fallback (Ink → AI → Templates) |
| Feedback | Every action has haptic confirmation |
| Recovery | Errors provide actionable next steps |

---

## 8. SUCCESS METRICS

### 8.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offline Availability | 100% | All features work without network |
| AI Model Load Time | <5s | From cold start to ready |
| Article Search | <200ms | From keystroke to results |
| App Launch | <2s | Cold start to interactive |
| Crash Rate | <0.1% | Per session |

### 8.2 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task Completion | >95% | Emergency flow completion |
| Trust Score | >4.5/5 | "I trust this app in emergencies" |
| NPS | >50 | Would recommend to friend |
| Retention | >60% | 30-day retention |
| Premium Conversion | >15% | Free → Pro upgrade rate |

---

## 9. CONCLUSION

Urban-Offline represents a new category of application: **intelligent offline infrastructure**. By combining the permanence of Kiwix archives with the adaptability of local AI, wrapped in a premium native experience, we create a tool that is:

1. **Trustworthy** - Users can verify every AI answer
2. **Reliable** - Works when everything else fails
3. **Intelligent** - Adapts to device, context, and user needs
4. **Premium** - Feels like a first-party native app

The vision is not just an app, but a **digital survival companion** that earns its place on the home screen through genuine utility and uncompromising quality.

---

*"When systems fail, Urban-Offline doesn't."*

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-15  
**Next Review:** 2026-03-15