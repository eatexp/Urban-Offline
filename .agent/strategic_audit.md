# Strategic Codebase Audit
**Date:** 2026-02-14
**Focus:** Design, AI Architecture, Vision Alignment, Testing

## 1. Design Aesthetics & "Stock Feel"
**Diagnosis:**
The codebase uses a high-quality "Tactical Design System" (`design-system.css`), but two factors likely contribute to the "stock/AI" feel:
1.  **Color Palette:** The `slate` (blue-grey) scale is the default for many Tailwind/shadcn apps. It feels "clean" but "generic".
2.  **Typography:** The use of `Georgia` for AI text in `MessageBubble.css` contrasts with the modern interface but can feel "academic/old" rather than "premium editorial".
3.  **Roundness:** `radius-xl` (24px) is very round, which softer and less "tactical" than a tighter radius (e.g., 4-8px) found in professional tools.

**Recommendations:**
- [ ] **Refine Palette:** Shift from standard `Slate` to a custom "Zinc" or "Carbon" with a subtle tint (e.g., deep warm grey for "Survival" vibe).
- [ ] **Update Typography:** Replace `Georgia` with a modern serif (e.g., `Merriweather`, `Lora`) or a high-readability sans-serif (e.g., `Inter` with increased line-height).
- [ ] **Texture:** Add subtle noise or grain to the glassmorphism backgrounds to reduce the "flat plastic" look.

## 2. Hardware-Aware AI Organization
**Diagnosis:**
`AIModelManager.js` and `AIArchitecture.js` have the *infrastructure* for checking capabilities (`checkAICapability`), but the logic is permissive.
- **Current:** Checks RAM/WebGPU but mostly just recommends a model.
- **Problem:** A user with 2GB RAM on Android might try to download `Phi-3` (800MB) which might crash due to runtime overhead.
- **User Need:** "Organised dependent on the device hardware capabilities."

**Recommendations:**
- [ ] **Strict Gating:** Implement `isModelCompatible(modelId)` that checks `deviceMemory`.
- [ ] **Visual Tiers:** In the Model Picker UI, group models by "Recommended for your device" vs "Requires high-end device".
- [ ] **Edge Case Handling:** Add a "Force Enable" toggle in settings for users who know what they are doing.

## 3. Data & AI Integration (The "Worthwhile" Factor)
**Diagnosis:**
The `RAGPipeline.js` is technically sound (`_retrieveContext` -> `_buildPrompt`), but the "worthwhile" aspect comes from *transparency*.
- The user needs to *see* the AI "reading" the ZIM file to trust it.
- `Refinery.js` handles the text conversion well (though table issues exist).
- **Gap:** The "Hybrid" nature isn't visually celebrated enough.

**Recommendations:**
- [ ] **Visual "Reasoning" Step:** When the AI searches, show a "Scanning 4 articles..." indicator before the answer starts.
- [ ] **Inline Citations:** Ensure the `CitationChip` mechanism in `MessageBubble.jsx` is prominent and interactive.

## 4. Grok Integration
**Diagnosis:**
- **Technically:** Grok-1 is 314B parameters. Grok-1.5 is likely larger. The smallest "open" Grok checkpoints are far too large for offline mobile use (typically need 50GB+ VRAM).
- **Vision:** "Grok" often implies a "rebellious/truth-seeking" persona.

**Recommendations:**
- [ ] **Persona Adaption:** Do not try to run Grok locally. Instead, adapt the `Llama-3` or `Phi-3` system prompt to match the "Grok" style (direct, witty, unconstrained) if that is the desired UX.
- [ ] **Disclaimer:** Explicitly state in the docs that "Grok-class models require cloud/server hardware".

## 5. Vision: Kiwix / Local AI Hybrid
**Diagnosis:**
The architecture supports this perfectly.
- **Kiwix:** Provides the raw data (Wikipedia, Medical Wiki).
- **Local AI:** Provides the natural language interface.
- **Refinery:** Connecting the two.

**Action:** Ensure the "Refinery" process (HTML -> Markdown) is performant. (Finding 17 in previous report noted table flattening issues—fixing this improves the "worthwhile" factor).

## 6. Testing on Windows (No Xcode)
**Diagnosis:**
You are developing on Windows for a cross-platform mobile app.
- `ci.yml` only runs lint/test on `ubuntu-latest`.
- You cannot verify iOS builds locally.

**Recommendations:**
- [ ] **Cloud Build Workflow:** Add a GitHub Action to build the iOS IPA file.
    ```yaml
    jobs:
      build-ios:
        runs-on: macos-latest
        steps:
          - uses: actions/checkout@v4
          - name: Build iOS
            run: npx cap build ios
    ```
    This confirms *compilation* works, even if you can't run the simulator.
- [ ] **Android Emulator:** You *can* run the Android Emulator on Windows (requires Android Studio). This is your best bet for "native" testing.

## Summary Plan
1.  **Aesthetics:** Update `design-system.css` (I can generate a "Premium Tactical" palette).
2.  **AI Safety:** Add explicit RAM checks to `AIModelManager`.
3.  **Testing:** Add `build-ios.yml` workflow.
