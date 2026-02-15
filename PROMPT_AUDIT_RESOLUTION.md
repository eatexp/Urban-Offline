# Audit Remediation & Final Polish Prompt

**Role**: You are an expert Senior React Developer specializing in resilient, offline-first architectures.

**Context**:
An internal "Deep Dive Audit" of the Urban-Offline codebase has just been completed. The audit confirmed the core architecture (AI, Kiwix, Bridge) is sound, but identified three specific areas where user experience and system robustness need improvement before the V1.0 release.

**Objective**:
Investigate, plan, and implement the following three work items to address the audit findings.

---

## 🏗️ Work Item 1: Enhanced Model Deletion Safety ("The Safety Catch")

**Problem**:
Downloading Large Language Models (LLMs) can take significant time and bandwidth. The current "Confirm Deletion?" dialog is too easy to bypass accidentally. Deleting a 2GB model by mistake is a critical UX failure for an offline-first app.

**Task**:
Implement a "High Friction" deletion flow for large assets (>500MB).

**Implementation Details**:
1.  **Modify `ModelMarketplaceEnhanced.jsx` and `Library.jsx`**:
    -   Intercept the delete action for AI Models and large Content Packs.
    -   If size > 500MB (or checks `tier === 'pro'`), show a **High Stakes Confirmation Modal**.
2.  **High Stakes UI**:
    -   Require the user to type a confirmation word (e.g., "DELETE") OR invoke a "Long Press" (press and hold for 3 seconds) to confirm.
    -   Display the file size clearly: "This will remove 1.2GB of data. You will need to re-download it to use this model again."
3.  **Haptics**:
    -   Use `HapticsService.notification(NotificationType.Warning)` on modal open.
    -   Use `HapticsService.impact(ImpactStyle.Heavy)` on successful deletion.

## 📊 Work Item 2: Visualize Refinery Metrics ("The Trust Builder")

**Problem**:
The `RAGPipeline` uses a sophisticated "Refinery" step to compress HTML articles into semantic Markdown, saving roughly 40-50% of tokens. This is a key value proposition for performance and cost (token usage), but currently, these metrics are invisible to the user.

**Task**:
Expose the "Refinery" savings in the AI Chat interface to build user trust and demonstrate efficiency.

**Implementation Details**:
1.  **Review `RAGPipeline.js`**:
    -   Confirm it correctly emits the `refinery` event with `{ tokensSaved, compressionRatio }`.
2.  **Update `AIReadingViz` (or relevant visualization component in `AIChat.jsx`)**:
    -   Listen for the `refinery` stage event.
    -   Display a subtle but clear badge or indicator during the "Thinking" or "Reading" phase.
    -   **Example UI**: A small chip that slides in: "Refined 4 docs • Saved 450 tokens (42%)".
    -   **Animation**: Use `framer-motion` to make it appear smoothly.

## 🛡️ Work Item 3: Harden Platform Detection ("The Safety Net")

**Problem**:
The application relies on `isWindowsNative` checks to determine capabilities. If the underlying detection logic (in `src/utils/platform.js` or similar) throws an error or returns undefined in an unexpected environment, the app could crash or expose native features that don't work.

**Task**:
Ensure platform detection is fail-safe.

**Implementation Details**:
1.  **Audit `src/utils/platform.js`**:
    -   Ensure all checks (`isWindowsNative`, `isAndroid`, `isIOS`) are wrapped in try-catch blocks.
    -   Default to `false` (Web mode) on any error.
2.  **Verify Usage**:
    -   Check `AIModelManager.js` and `Library.jsx` where `isWindowsNative` is used.
    -   Ensure that if the check fails (returns false), the app gracefully falls back to the Web/WASM implementation rather than breaking.

---

**Execution Plan**:
1.  **Analysis**: briefly review the target files (`ModelMarketplaceEnhanced.jsx`, `AIChat.jsx`, `platform.js`) to confirm the insertion points.
2.  **Implementation**: precise code changes for the three items above.
3.  **Verification**: explain how you verified the changes (e.g., "Simulated a comprehensive delete flow", "injected mock refinery events").

**Start immediately.**
