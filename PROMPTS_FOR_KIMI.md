# Prompts for Kimi

Here are the three comprehensive prompts to give to Kimi (Cline) to complete the next steps of the SHA-256 and Resume implementation.

---

##  1: Populate Model Checksums

**Context:**
You have successfully implemented the checksum validation logic, but `src/services/ai/TransformersEngine.js` currently has `null` placeholders for the `checksum` fields in `TRANSFORMERS_MODELS`. We need to populate these with the actual SHA-256 hashes of the `model.onnx` files to enable the validation features you built.

**Task:**
Populate the `checksum` fields in `src/services/ai/TransformersEngine.js`.

**Instructions:**
1.  **Research**: Find the SHA-256 checksums for the `model.onnx` files for each model listed in `TRANSFORMERS_MODELS`.
    *   *Tip*: You can often find the SHA-256 (OID) in the "LFS" pointer file or the "Files and versions" tab on the HuggingFace model page (e.g., `https://huggingface.co/Xenova/TinyLlama-1.1B-Chat-v1.0/blob/main/onnx/model.onnx`).
    *   *Alternative*: If you cannot find them on the web, create a temporary script/utility to download the *first few bytes* (LFS pointer) or the *full file* (if necessary) to compute the hash. **Prefer finding the upstream hash to avoid large downloads.**
2.  **Update**: Modify `TRANSFORMERS_MODELS` in `src/services/ai/TransformersEngine.js` to include the correct SHA-256 strings.
3.  **Verify**: Ensure the format matches what `src/utils/checksum.js` expects (hex string, optional `sha256:` prefix).

---

##  2: Update ModelPicker UI

**Context:**
The backend logic for download resume (`DownloadCheckpoint.js`) and checksum verification (`AIModelManager.js`) is ready. Now `src/components/ModelPicker.jsx` needs to reflect these states to the user.

**Task:**
Update `ModelPicker.jsx` to support "Resume Download" and "Verifying" states.

**Instructions:**
1.  **Resume Capability**:
    *   Update `handleDownload` and the initial load logic to check for existing checkpoints using `AIModelManager` (you may need to expose `getResumeInfo` from `DownloadCheckpoint` via `AIModelManager`).
    *   If a download was interrupted, show a "Resume Download" button instead of "Download".
    *   Display the partial progress state (e.g., "Paused at 45%").
2.  **Verification State**:
    *   Update `handleDownload` to listen for the specific `message` passed by `AIModelManager` (e.g., "Verifying download integrity...").
    *   Display this status text next to the progress ring when it occurs (usually at 95-100%).
3.  **Error Handling**:
    *   If `AIModelManager` returns `{ success: false, canResume: true }`, ensure the UI stays in a state that allows the user to click "Resume" rather than resetting completely to "Download".

---

##  3: Upgrade ContentPackManager

**Context:**
You have implemented robust resume and validation logic for AI models. We need to extend this same robustness to `src/services/contentPacks/ContentPackManager.js`, which currently uses a basic `fetch`.

**Task:**
Refactor `ContentPackManager.js` to use the new `DownloadCheckpoint` and `rangeFetcher` utilities.

**Instructions:**
1.  **Integrate Utilities**: Import `DownloadCheckpoint`, `createCheckpointedStream`, and `computeChecksumFromStream`.
2.  **Refactor `downloadPack`**:
    *   **Checkpoints**: Before starting, check if a checkpoint exists.
    *   **Resume**: Use `createCheckpointedStream` instead of raw `fetch`. This will handle HTTP Range requests automatically.
    *   **OPFS Handling**: When using OPFS (`navigator.storage.getDirectory`), ensure that if we are resuming, we write to the correct offset or append to the file handle. *Note: You might need to check if `createWritable({ keepExistingData: true })` or `seek()` is supported/needed.*
3.  **Verification**:
    *   If the pack has a `checksum` (from manifest), use `computeChecksumFromStream` (or pipe the stream through a checksum calculator) to verify integrity before installation.
4.  **Consistency**: Ensure `_downloadProgress` and `_abortControllers` continue to work as expected.

**Constraint**: Maintain backward compatibility with the existing manifest format.
