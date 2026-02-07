# Execution Plan (for Prompt 2 AI)
Updated: 2026-02-05

## Batch 1 (do first — blocks other work or fixes crashes)
- Finding 1: HybridSearch Dynamic Import Conflict — Blocks proper code splitting, causes bundle bloat
- Finding 4: ZIM Zstandard/LZMA Compression Not Implemented — Critical content availability issue
- Finding 5: Content Sync Offline Detection Gap — Can cause infinite retry loops when offline

## Batch 2 (do next — high value improvements)
- Finding 2: AI Module Chunk Size (967KB) — Performance concern for mobile/low-bandwidth
- Finding 6: Missing Embeddings Store in WebStorage — Semantic search persistence broken
- Finding 7: NativeSearch Category Hardcoded — Search results inaccurate on native platforms

## Batch 3 (do when time allows)
- Finding 3: TransformersEngine eval() Security Warning — Security hardening
- Finding 8: TriageScreen Desktop Layout — UX improvement
- Finding 9: ProtocolView Accessibility Gaps — ARIA labels missing

## Context the Executor needs
- Build command: `npm run build`
- Dev server: `npm run dev`
- Key patterns: 
  - Logger pattern: `const log = createLogger('ComponentName')`
  - Error handling: Dispatch CustomEvent for UI notifications
  - Platform detection: `Capacitor.isNativePlatform()`
  - Storage abstraction: db.get/store with quota error normalization
- Files that are fragile / heavily depended on:
  - `src/services/db.js` — Platform abstraction layer
  - `src/services/ai/RAGPipeline.js` — Core AI functionality
  - `src/services/clawdBot/ToolRegistry.js` — All tool definitions
  - `src/services/zim/ZimReader.js` — Content import critical path

---

## Finding 1: HybridSearch Dynamic Import Conflict
- **File(s):** 
  - `src/services/clawdBot/DevToolRegistry.js:1` (3 dynamic imports)
  - `src/services/clawdBot/ToolRegistry.js:1` (1 dynamic import)
  - `src/components/Search.jsx:1` (static import)
- **Severity:** HIGH
- **Category:** performance
- **Current behavior:** Vite build warns: "HybridSearch.js is dynamically imported by DevToolRegistry.js but also statically imported by Search.jsx, dynamic import will not move module into another chunk." This means the code splitting optimization is defeated.
- **Expected/better behavior:** Module should be consistently imported (either all dynamic or all static) to allow proper chunking and reduce initial bundle size.
- **Evidence:** Build output shows warning repeated 3 times. The ai-module chunk is 967KB (nearly 1MB), partially due to this issue.
- **Suggested fix:** 
  1. Remove dynamic imports from DevToolRegistry.js and ToolRegistry.js for HybridSearch
  2. Import HybridSearch statically at top of files
  3. OR make Search.jsx also use dynamic import (less ideal for search UX)
- **Dependencies:** None

## Finding 2: AI Module Chunk Size Exceeds 500KB Warning Threshold
- **File(s):** `vite.config.js:30-40`, `src/services/ai/AIArchitecture.js:1`
- **Severity:** MEDIUM
- **Category:** performance
- **Current behavior:** Build warns: "Some chunks are larger than 500 kB after minification." The ai-module chunk is 967KB (242KB gzipped). This includes TransformersEngine, AIModelManager, RAGPipeline.
- **Expected/better behavior:** Split ai-module into smaller chunks: embeddings (23MB model), LLM inference, RAG pipeline separately. Target <500KB per chunk.
- **Evidence:** Build output: `assets/ai-module-C086Mk10.js 966.95 kB │ gzip: 242.41 kB`. The vite.config.js manualChunks already attempts to split but includes too much in 'ai-module'.
- **Suggested fix:** 
  1. Create separate chunks: 'ai-embeddings', 'ai-inference', 'ai-rag'
  2. Move EmbeddingEngine to 'ai-embeddings' chunk (smaller, loads first)
  3. Keep TransformersEngine in 'ai-inference' (larger, loads on demand)
- **Dependencies:** None

## Finding 3: TransformersEngine Uses eval() - Security Risk
- **File(s):** `node_modules/onnxruntime-web/dist/ort-web.min.js:6:62546` (via `src/services/ai/TransformersEngine.js:15`)
- **Severity:** MEDIUM
- **Category:** security
- **Current behavior:** Build warns: "Use of eval in ort-web.min.js is strongly discouraged as it poses security risks and may cause issues with minification." This comes from the @xenova/transformers dependency.
- **Expected/better behavior:** Either configure CSP to allow eval for this specific case, or document the security implications. The FIXME comment in TransformersEngine.js acknowledges Windows incompatibility but not the eval issue.
- **Evidence:** Build output shows warning twice. TransformersEngine.js has FIXME comment about Windows native incompatibility.
- **Suggested fix:** 
  1. Add CSP headers in index.html allowing 'unsafe-eval' for script-src (documented security trade-off)
  2. OR add vite.config.js option to suppress this specific warning if accepted
  3. Document in SECURITY.md that eval is required for ONNX runtime
- **Dependencies:** None

## Finding 4: ZIM Reader Missing Zstandard and LZMA Compression Support
- **File(s):** `src/services/zim/ZimReader.js:280-320`
- **Severity:** HIGH
- **Category:** feature-gap
- **Current behavior:** When encountering Zstd (type 5) or LZMA (type 3) compressed ZIM files, throws error: "Zstandard compression not yet implemented" or "LZMA/XZ compression not yet implemented". Many modern ZIM files use zstd for better compression.
- **Expected/better behavior:** Should decompress zstd and lzma compressed content. This is critical for accessing modern Wikipedia ZIM dumps.
- **Evidence:** Code explicitly throws errors for COMPRESSION_ZSTD (5) and COMPRESSION_LZMA (3). Only COMPRESSION_NONE (0) and COMPRESSION_ZLIB (1) are implemented.
- **Suggested fix:** 
  1. `npm install zstddec-wasm` for zstd support (priority)
  2. `npm install xzdec-wasm` or `lzma-js` for lzma support
  3. Implement `_decompressZstd()` and `_decompressLzma()` methods following pattern of existing `_decompressZlib()`
  4. Test with actual ZIM files from https://download.kiwix.org/zim/
- **Dependencies:** Requires npm package installation, so should be done after build verification

## Finding 5: Content Sync Missing Offline Status Check Before Retry
- **File(s):** `src/services/contentSync.js` (referenced in TODO comment)
- **Severity:** HIGH
- **Category:** resilience
- **Current behavior:** TODO comment states: "Retry mechanism doesn't check navigator.onLine before scheduling" - can cause infinite retry loops when offline, wasting battery and creating noise in logs.
- **Expected/better behavior:** Before scheduling any retry, check `navigator.onLine`. If offline, wait for 'online' event before attempting retry.
- **Evidence:** Found TODO comment: `// TODO: [P1][Resilience] CONTENT_SYNC_OFFLINE_DETECTION`. The contentSync.js file handles background content synchronization.
- **Suggested fix:** 
  1. Add `if (!navigator.onLine) { queueForOnlineRetry(); return; }` at start of retry function
  2. Listen for window 'online' event to trigger queued retries
  3. Add exponential backoff with max retry limit (e.g., 5 attempts)
- **Dependencies:** None

## Finding 6: EmbeddingEngine Uses Non-existent 'embeddings_cache' Store
- **File(s):** `src/services/ai/EmbeddingEngine.js:30`, `src/services/storage/WebStorage.js:1`
- **Severity:** HIGH
- **Category:** bug
- **Current behavior:** EmbeddingEngine defines `const EMBEDDINGS_STORE = 'embeddings_cache'` and tries to use `db.get(EMBEDDINGS_STORE, key)`, but WebStorage.js doesn't define this store in `initDB()`. The `_getFromCache()` and `_saveToCache()` methods silently fail.
- **Expected/better behavior:** Should store computed embeddings in IndexedDB to avoid recomputing on every session. Currently embeddings are only cached in-memory (lost on refresh).
- **Evidence:** 
  - EmbeddingEngine.js line 30: `const EMBEDDINGS_STORE = 'embeddings_cache'`
  - WebStorage.js creates stores: datasets, data_content, guides, guide_content, map_tiles, health_content, survival_content, law_content, search_index, ai_models, content_packs, dataset_preferences, user_context, ink_stories, clawdBot_memory — NO 'embeddings_cache'
- **Suggested fix:** 
  1. Add to WebStorage.js initDB(): `if (!db.objectStoreNames.contains('embeddings_cache')) { db.createObjectStore('embeddings_cache', { keyPath: 'id' }); }`
  2. Bump DB_VERSION from 5 to 6
- **Dependencies:** None

## Finding 7: NativeSearch Returns Hardcoded 'general' Category
- **File(s):** `src/services/search/NativeSearch.js` (referenced in TODO)
- **Severity:** MEDIUM
- **Category:** bug
- **Current behavior:** TODO comment: "Search results use hardcoded 'general' fallback for category" — NativeSearch doesn't properly categorize results from SQLite, breaking category filtering.
- **Expected/better behavior:** Should extract actual category from the database (health_content, survival_content, law_content tables) and return it in search results.
- **Evidence:** Found TODO: `// TODO: [P4][Quality] NATIVE_SEARCH_CATEGORY_COLUMN`. The WebSearch.js properly categorizes by store name, but NativeSearch likely doesn't.
- **Suggested fix:** 
  1. Read NativeSearch.js implementation
  2. Modify SQLite query to include category column
  3. Map table name to category in results
- **Dependencies:** Requires reading NativeSearch.js to understand current implementation

## Finding 8: TriageScreen Desktop Layout Suboptimal
- **File(s):** `src/components/TriageScreen.jsx:20-35`
- **Severity:** LOW
- **Category:** code-quality
- **Current behavior:** TODO comment notes: "60vh may be too small on large screens", "Choice buttons could use horizontal layout on desktop", "Font sizes may be too large for desktop viewing"
- **Expected/better behavior:** Responsive design that uses more space on desktop while maintaining mobile usability.
- **Evidence:** TODO comment with detailed gap analysis. Current height classes: `h-[70vh] sm:h-[75vh] md:h-[80vh] lg:max-h-[600px]` — the max-h constraint wastes space on large screens.
- **Suggested fix:** 
  1. Remove `lg:max-h-[600px]` constraint
  2. Add `lg:flex-row` for side-by-side content/choices layout on wide screens
  3. Add media query for font size scaling
- **Dependencies:** None

## Finding 9: ProtocolView Missing ARIA Labels and Speech Synthesis Error Handling
- **File(s):** `src/components/ProtocolView.jsx` (referenced in TODOs)
- **Severity:** MEDIUM
- **Category:** code-quality
- **Current behavior:** Two TODOs: (1) "Checkboxes lack aria-labels and are visually hidden" - accessibility issue, (2) "onerror callback only resets speaking state but doesn't inform user" - UX gap
- **Expected/better behavior:** Checkboxes should have proper ARIA labels for screen readers. Speech synthesis errors should show user-facing error message.
- **Evidence:** TODO comments found in search. ProtocolView.jsx handles text-to-speech for emergency protocols.
- **Suggested fix:** 
  1. Add `aria-label` attributes to checkboxes describing the step
  2. Add error state UI when speech synthesis fails (e.g., "Speech unavailable, please read instructions")
- **Dependencies:** None

## Finding 10: DataManager and articleService Dynamic Import Conflicts
- **File(s):** 
  - `src/services/clawdBot/DevToolRegistry.js` (dynamic import)
  - `src/services/dataManager.js` (static import in MapComponent.jsx, Home.jsx, Resources.jsx, router.jsx)
  - `src/services/articleService.js` (static import in router.jsx)
- **Severity:** MEDIUM
- **Category:** performance
- **Current behavior:** Same issue as Finding 1 — dataManager.js and articleService.js are dynamically imported by DevToolRegistry but statically imported elsewhere. Vite warns this defeats code splitting.
- **Expected/better behavior:** Consistent import pattern to allow proper tree shaking and chunk optimization.
- **Evidence:** Build output: "dataManager.js is dynamically imported by DevToolRegistry.js but also statically imported..." and "articleService.js is dynamically imported..."
- **Suggested fix:** 
  1. Remove dynamic imports from DevToolRegistry.js for dataManager and articleService
  2. Import statically at top of file
- **Dependencies:** None
