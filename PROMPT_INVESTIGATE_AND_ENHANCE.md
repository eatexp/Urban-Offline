# Prompt: Investigate Urban-Offline App & Plan Enhancements

## Context
You are analyzing the **Urban-Offline** project - an offline-first emergency preparedness application with a vision of being a **Locally AI × Kiwix hybrid** for iOS & Android. The app provides critical survival information, medical protocols, legal rights, and offline maps when infrastructure fails.

## Critical: Read Configuration Files First

**BEFORE ANY OTHER ACTION**, read these three files to understand the project standards:

1. `.clinerules` - Behavioral guidelines and coding standards
2. `.clineworkflows` - Step-by-step processes for common tasks
3. `.clineskills` - Domain expertise areas for this project

These files contain the **authoritative guidance** for how to work on this codebase. All recommendations must align with these rules.

---

## Phase 1: Deep Investigation (Plan Mode)

### 1.1 Architecture Assessment
Read and analyze the core architecture files:

```
src/
├── App.jsx                    # Root component, initialization
├── router.jsx                 # Route definitions, lazy loading
├── services/
│   ├── db.js                  # Storage abstraction
│   ├── ai/
│   │   ├── AIModelManager.js  # AI model lifecycle
│   │   ├── RAGPipeline.js     # Retrieval-augmented generation
│   │   └── TransformersEngine.js # Model inference
│   └── storage/               # Web/Native storage implementations
└── components/
    ├── ModelPicker.jsx        # AI marketplace UI
    ├── TriageScreen.jsx       # Emergency decision trees
    └── CriticalContentBanner.jsx # Offline warnings
```

**Questions to answer:**
- How does the AI model marketplace currently work?
- What's the state of offline content (ZIM/Kiwix integration)?
- Are there any incomplete features or TODOs?
- What gaps exist between current implementation and the vision?

### 1.2 Code Quality Audit
Run these commands and analyze results:

```bash
npm run lint                    # Check for linting errors
npm run build                   # Verify build succeeds
# Check for any test files and run them
```

**Look for:**
- Areas violating `.clinerules` standards
- Missing error boundaries or resilience patterns
- Platform-specific code without proper abstraction
- AI operations not using AIModelManager
- Storage operations bypassing db.js

### 1.3 Feature Completeness Review
Check these key user flows:

| Feature | Files to Review | Status Question |
|---------|----------------|-----------------|
| AI Model Download/Install | ModelPicker.jsx, AIModelManager.js | Does resume work? Are checksums validated? |
| AI Chat with RAG | AIChat.jsx, RAGPipeline.js | Do citations work? Is streaming smooth? |
| Content Pack System | ContentBrowser.jsx, DatasetRegistry.js | Can users browse/install/remove packs? |
| Triage Flows | TriageScreen.jsx, InkService.js | Are all critical stories available offline? |
| Offline Maps | MapComponent.jsx, tileManager.js | Do tiles load from cache when offline? |
| Search | Search.jsx, HybridSearch.js | Does search work across all content types? |

---

## Phase 2: Identify Enhancement Opportunities

Based on your investigation, identify the **top 5 highest-impact enhancements** that would move the app closer to the "Locally AI × Kiwix hybrid" vision.

### Evaluation Criteria (from .clinerules):
1. **Offline-first**: Does it work without network?
2. **iOS/Android parity**: Works identically on both platforms?
3. **Emergency UX**: Loads fast, reliable, no dead ends?
4. **AI integration**: Proper use of marketplace and model selection?
5. **Content ecosystem**: ZIM/Kiwix-style pack management?

### Potential Enhancement Areas:

**AI & Intelligence:**
- Improve intent classification accuracy
- Add more model tiers or specialized models
- Enhance RAG retrieval quality
- Implement response quality feedback loop

**Content & Offline:**
- Expand ZIM content pack library
- Implement delta updates for content
- Improve content search/relevance
- Add more Ink.js triage scenarios

**Mobile Experience:**
- Optimize bundle size further
- Improve startup time
- Enhance haptics and tactile feedback
- Add widgets/quick actions for emergencies

**Resilience & Quality:**
- Add comprehensive error boundaries
- Implement automated recovery flows
- Add telemetry for quality monitoring
- Improve quota management

---

## Phase 3: Create Enhancement Plan

For each of the top 5 enhancements, create a detailed plan:

### Enhancement Template:
```markdown
## Enhancement N: [Name]

### Problem Statement
[What's missing or broken?]

### Proposed Solution
[How will we fix it?]

### Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files to Modify
- `src/...`
- `src/...`

### Alignment with .clinerules
- [Which rules does this follow?]
- [Any trade-offs?]

### Testing Requirements
- [ ] iOS device test
- [ ] Android device test
- [ ] Offline mode test
- [ ] AI pipeline test (if applicable)
- [ ] Lint passes
```

---

## Phase 4: Present Findings

Use `plan_mode_respond` to present:

1. **Executive Summary** - Current state in 3-5 sentences
2. **Key Findings** - What's working well, what's broken/incomplete
3. **Top 5 Enhancements** - Prioritized by impact and alignment with vision
4. **Recommended First Enhancement** - Which one to implement first and why
5. **Risk Assessment** - Any architectural concerns or technical debt

---

## Constraints & Guidelines

### MUST Follow:
- ✅ All recommendations must cite specific `.clinerules`, `.clineworkflows`, or `.clineskills`
- ✅ Every enhancement must include iOS/Android testing plan
- ✅ Offline-first assumption - features must work without network
- ✅ Use existing abstractions (db.js, AIModelManager.js, platform.js)
- ✅ Functional React components, async/await only

### MUST Avoid:
- ❌ Adding new dependencies without bundle size analysis
- ❌ Platform-specific features without parity plan
- ❌ AI for life-safety critical paths (use Ink.js)
- ❌ Breaking existing offline functionality
- ❌ Duplicating existing patterns (check codebase first)

---

## Success Criteria

Your investigation is complete when you can answer:
1. What is the current implementation status of each major feature?
2. What are the top 5 enhancements needed to achieve the vision?
3. Which enhancement should be implemented first and why?
4. Are there any architectural risks that need immediate attention?

---

## Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run lint                   # Check code quality
npm run build                  # Production build

# Mobile
npm run cap:sync               # Sync to native projects
npm run cap:open               # Open Xcode/Android Studio

# Content
npm run fetch-content          # Update content database
npm run generate-manifest      # Update content manifest
```

---

**Remember**: Start by reading `.clinerules`, `.clineworkflows`, and `.clineskills`. These define how this project should be built. All your recommendations must align with these standards.