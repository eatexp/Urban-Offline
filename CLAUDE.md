# CLAUDE.md - Urban-Offline

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Urban-Offline** is an offline-first emergency preparedness Progressive Web App (PWA) with native mobile support via Capacitor. It provides critical survival information, medical protocols, legal rights, and offline maps when infrastructure fails or connectivity is unavailable.

**Target Audience**: UK-focused with global expansion framework.

**Core Value Proposition**: Works entirely offline once content is downloaded.

## Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Vite dev server with hot reload (http://localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build
npm run lint             # ESLint check

# Content Pipeline
npm run fetch-content    # Fetch Wikipedia articles → content.db
npm run prebuild         # fetch-content + copy content.db to public/assets/

# Native Mobile (Capacitor)
npm run cap:sync         # Copy web build to native projects
npm run cap:open         # Open Xcode (iOS) or Android Studio
```

## Architecture

### Dual-Platform Strategy

| Platform | Storage | Search | LLM Inference |
|----------|---------|--------|---------------|
| **Web (PWA)** | IndexedDB via `idb` | FlexSearch | WebLLM (WASM) |
| **Native (Capacitor)** | SQLite + Filesystem | SQLite FTS5 | llama.cpp plugin |

### Platform Detection

```javascript
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform();
```

### Key Directory Structure

```
src/
├── components/           # React components
│   ├── MapComponent.jsx  # Leaflet offline maps
│   ├── OfflineTileLayer.jsx
│   ├── Search.jsx        # Hybrid search UI
│   ├── TriageScreen.jsx  # Interactive decision trees
│   └── ProtocolView.jsx  # Emergency protocol display
├── pages/                # Route pages
│   ├── Home.jsx
│   ├── Health.jsx        # Medical content
│   ├── Survival.jsx      # Survival guides
│   ├── Law.jsx           # Legal rights
│   ├── Map.jsx           # Offline navigation
│   ├── AIChat.jsx        # RAG-powered chat
│   └── Settings.jsx
├── services/
│   ├── db.js             # Storage abstraction entry point
│   ├── storage/
│   │   ├── WebStorage.js      # IndexedDB implementation
│   │   ├── NativeStorage.js   # SQLite + Filesystem
│   │   └── StorageInterface.js
│   ├── search/
│   │   ├── WebSearch.js       # FlexSearch
│   │   ├── NativeSearch.js    # SQLite FTS5
│   │   └── HybridSearch.js    # Combined search
│   ├── ai/
│   │   ├── AIArchitecture.js  # Model definitions, system prompts
│   │   ├── AIModelManager.js  # Model loading/management
│   │   ├── RAGPipeline.js     # Retrieval-augmented generation
│   │   ├── TransformersEngine.js
│   │   ├── EmbeddingEngine.js
│   │   ├── IntentClassifier.js
│   │   └── ProtocolGenerator.js
│   ├── triage/
│   │   └── TriageRouter.js    # Emergency triage logic
│   ├── tileManager.js         # Offline map tile management
│   ├── dataManager.js         # Region/dataset management
│   ├── InkService.js          # Interactive narratives
│   └── AttributionManager.js  # License compliance
├── context/
│   └── AppProvider.jsx   # Global state
├── hooks/
│   └── useOfflineData.js
└── router.jsx            # React Router config

public/assets/
├── ink/                  # Interactive decision trees (JSON)
│   ├── health/           # CPR, choking, bleeding
│   ├── medical/          # Burns, stroke, heat illness
│   ├── legal/            # Arrest rights, stop & search
│   └── survival/         # Fire, shelter, water, signaling
└── content.db            # Pre-bundled SQLite content
```

## Storage Abstraction Layer

**Entry Point**: `src/services/db.js`

The storage layer automatically routes to the correct implementation:

```javascript
// Web: IndexedDB via idb
// Native: SQLite + Filesystem hybrid
export const db = isNative ? NativeStorage : WebStorage;
```

### Web Storage (IndexedDB)

Object stores: `datasets`, `data_content`, `guides`, `guide_content`, `map_tiles`, `health_content`, `survival_content`, `law_content`, `search_index`

### Native Storage (SQLite + Filesystem)

- **SQLite**: Structured/queryable data, metadata
- **Filesystem**: Large blobs (map tiles, bulk content)
- Generic key-value: `kv_store (store_name, key, value)`

## AI System

### Supported Models (via transformers.js)

| Model | Size | Use Case |
|-------|------|----------|
| TinyLlama 1.1B | ~500 MB | Default, mobile-friendly |
| Phi-3 Mini 4K | ~800 MB | Better reasoning, power users |
| MiniLM Embeddings | ~23 MB | Semantic search |

### AI Pipeline Flow

```
User Query
    │
    ▼
Intent Classifier → Triage (Ink) / AI Chat (RAG) / Search (Hybrid)
    │
    ▼
RAG Pipeline
├── Query → Vector embedding
├── Retrieve chunks from IndexedDB
├── Build context with documents
├── Generate response with local LLM
└── Format with source citations
```

### Configuration (`src/services/ai/AIArchitecture.js`)

- System prompts: `SYSTEM_PROMPTS.medical`, `.survival`, `.general`, `.protocol`
- Fallback templates for offline mode without AI models
- Device capability detection: WebGPU, WASM SIMD, memory, storage

## Offline Map System

**Tile Manager** (`src/services/tileManager.js`):
- Downloads OSM tiles for regions (zoom levels 10-14)
- Batch processing: 5 tiles/batch, 200ms delay
- 3-attempt retry with exponential backoff
- Checks local storage before network fallback

**Components**:
- `MapComponent.jsx` - Leaflet integration
- `OfflineTileLayer.jsx` - Custom tile layer for offline

## Interactive Decision Trees (Ink)

**Service**: `src/services/InkService.js`

Uses the [Ink](https://github.com/inkle/ink) narrative engine for step-by-step emergency guidance:

- Health: CPR, choking, severe bleeding
- Medical: Burns, stroke recognition, heat illness, hypothermia
- Legal: Arrest rights, custody rights, stop and search
- Survival: Fire making, shelter, water purification, signaling

JSON files in `public/assets/ink/`

## Content Pipeline

**Script**: `scripts/fetch-content.js`

1. Fetches Wikipedia articles via REST API
2. Rate-limited (300ms delay, User-Agent header)
3. Creates SQLite database with articles table
4. Converts HTML to plain text for indexing
5. Output: `content.db` → bundled in `public/assets/`

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@capacitor/core` | Native platform bridge |
| `@capacitor-community/sqlite` | Native SQLite |
| `@capacitor/filesystem` | Native file access |
| `@xenova/transformers` | Browser ML inference |
| `flexsearch` | Web full-text search |
| `idb` | IndexedDB wrapper |
| `inkjs` | Interactive narratives |
| `leaflet`, `react-leaflet` | Maps |
| `vite-plugin-pwa` | Service worker/PWA |

## Build Configuration

**Vite** (`vite.config.js`):
- Code splitting: `react-vendor`, `ui-vendor`, `ai-module`, `map-module`
- Legacy browser support via `@vitejs/plugin-legacy`
- PWA manifest with auto-update

**Capacitor** (`capacitor.config.json`):
- App ID: `com.urbanoffline.app`
- Web directory: `dist/`

## Development Patterns

### Adding New Content Category

1. Create page in `src/pages/`
2. Add route in `src/router.jsx`
3. Create storage schema in `src/services/storage/schema.js`
4. Add search index configuration
5. Create Ink decision trees in `public/assets/ink/`

### Platform-Specific Code

```javascript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
    // Native-specific code
} else {
    // Web-specific code
}
```

### Error Handling

- `ErrorBoundary.jsx` wraps app for graceful degradation
- AI system has fallback templates when models unavailable
- Offline indicator shows connectivity status

## Testing

Currently no test framework configured. Recommended:
- Vitest for unit tests
- Playwright for E2E
- Test offline scenarios with service worker

## Attribution & Compliance

**AttributionManager** (`src/services/AttributionManager.js`) tracks:
- CC-BY-SA 3.0 (Wikipedia/WikiProject Medicine)
- OGL v3.0 (UK legislation)
- OpenStreetMap tile attribution

## Common Tasks

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview  # Test production build
```

### Update Content Database
```bash
npm run fetch-content
```

### Build for Native
```bash
npm run build
npm run cap:sync
npm run cap:open  # Opens Xcode or Android Studio
```

### Add New Ink Story
1. Write `.ink` file
2. Compile to JSON using inklecate
3. Place in `public/assets/ink/[category]/`
4. Register in relevant page component
