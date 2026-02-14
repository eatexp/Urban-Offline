# Mission: Execute V1.0 Release ("Operation Blackout")

**Role**: Lead Release Engineer
**Objective**: Transition Urban-Offline from "Release Candidate" to **Production V1.0**.

---

## 1. Version Bump & Metadata
**Task**: Update project metadata to reflect V1.0.0 status.

*   [ ] **Update `package.json`**:
    *   Set `version` to `1.0.0`
    *   Ensure `description` is "Offline-First Emergency Preparedness App"
*   [ ] **Update `capacitor.config.json`** (if applicable):
    *   Ensure `bundledWebRuntime` is false
*   [ ] **Update `manifest.json`** (PWA):
    *   Verify `name`, `short_name`, and `icons`
*   [ ] **Clean Install**:
    *   Run `npm ci` (or `npm install`) to ensure lockfile consistency.

## 2. Final Build & verification
**Task**: Create the production build artifact.

*   [ ] **Run Tests**:
    *   `npm test` (Must pass 100% - currently 77 tests)
*   [ ] **Lint Check**:
    *   `npm run lint` (Verify 0 critical errors)
*   [ ] **Production Build**:
    *   `npm run build`
    *   *Verify*: Check `dist/` folder exists and contains `index.html` and assets.

## 3. Documentation Generation
**Task**: Create the final release documentation.

*   [ ] **Create `RELEASE_NOTES_V1.md`**:
    *   **Title**: Urban-Offline V1.0 "Blackout"
    *   **Features**:
        *   Offline Survival Mode
        *   Generative AI Maps (SmolLM/Phi-3)
        *   Tactile Haptics & Audio
        *   Resilient Downloads (Resume/Checksums)
    *   **Fixes**:
        *   React Hooks cleanup
        *   RAG Retry logic
        *   Test suite stabilization
    *   **Known Issues**: (If any remaining non-critical)

## 4. Git Operations
**Task**: Tag and commit the release.

*   [ ] **Commit**:
    *   Message: `chore(release): prepare v1.0.0 [skip ci]`
*   [ ] **Tag**:
    *   `git tag -a v1.0.0 -m "Release V1.0.0 - Operation Blackout"`
*   [ ] **Push** (if remote exists):
    *   `git push origin main --tags`

---

## Executive Summary for User
Once complete, report back with:
1.  Confirmation of 1.0.0 in `package.json`
2.  Build success status
3.  Location of `RELEASE_NOTES_V1.md`
