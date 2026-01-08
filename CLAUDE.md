# CLAUDE.md - Urban-Offline Development Guide

## Project Overview

Urban-Offline is an **Offline-First Emergency Preparedness Application** that provides critical information and tools when internet connectivity is unavailable. It's a Progressive Web App (PWA) with native mobile support via Capacitor.

### Core Domains
- **Health & First Aid**: Medical guides, ICD-11 references, interactive triage flows
- **Law & Rights**: PACE codes, UK legislation, custody rights
- **Survival & Prep**: Flood zones, shelter building, water purification

## Tech Stack

- **Frontend**: React 19, React Router 7, Vanilla CSS with Tailwind-style utilities
- **Build**: Vite 7 with PWA plugin, ESBuild minification
- **Offline Storage**:
  - Web: IndexedDB via `idb` library
  - Native: SQLite via `@capacitor-community/sqlite` + Filesystem API
- **Search**: FlexSearch (web) / FTS5 (native SQLite)
- **AI**: WebLLM architecture with RAG pipeline (optional, lazy-loaded)
- **Interactive Stories**: Ink scripting language via `inkjs`
- **Maps**: Leaflet + React-Leaflet with offline tile support
- **Native**: Capacitor 7 (iOS + Android)

## Project Structure

```
src/
├── App.jsx              # Main router with lazy-loaded routes
├── main.jsx             # Entry point, initializes storage and search
├── index.css            # Global styles
├── components/          # Reusable UI components
│   ├── Layout.jsx       # App shell with header/navbar
│   ├── Search.jsx       # Global search component
│   ├── TriageScreen.jsx # Ink story player for interactive triage
│   ├── MapComponent.jsx # Leaflet map wrapper
│   └── OfflineIndicator.jsx
├── pages/               # Route components
│   ├── Home.jsx         # Dashboard with status and domain links
│   ├── Health.jsx       # Medical content browser
│   ├── Law.jsx          # Legal content browser
│   ├── Survival.jsx     # Survival content browser
│   ├── TriagePage.jsx   # Interactive triage flow wrapper
│   ├── Guides.jsx       # Static guides list
│   ├── Map.jsx          # Offline map viewer
│   ├── AIChat.jsx       # AI assistant interface
│   └── ArticleView.jsx  # Article detail view
├── services/
│   ├── db.js            # Platform-agnostic DB abstraction
│   ├── SearchService.js # Platform-agnostic search facade
│   ├── InkService.js    # Ink story engine wrapper
│   ├── storage/
│   │   ├── WebStorage.js    # IndexedDB implementation
│   │   ├── NativeStorage.js # SQLite + Filesystem implementation
│   │   └── schema.js        # Native SQLite schema (articles, FTS, attributions)
│   ├── search/
│   │   ├── WebSearch.js     # FlexSearch implementation
│   │   └── NativeSearch.js  # SQLite FTS5 implementation
│   └── ai/
│       ├── AIModelManager.js # Model download/load management
│       └── RAGPipeline.js    # Retrieval-augmented generation
└── utils/
    └── logger.js        # Namespaced logging utility
```

### Public Assets

```
public/
└── assets/
    ├── embeddings.json  # Pre-computed embeddings for semantic search
    └── ink/             # Compiled Ink stories (.ink.json)
        ├── health/      # Medical triage flows (choking, cpr, bleeding)
        ├── legal/       # Legal rights flows (arrest, custody, stop-search)
        ├── medical/     # Additional medical (burns, stroke, heat-illness)
        ├── survival/    # Survival flows (shelter, fire, water, signaling)
        └── source/      # Source .ink files (compile with inklecate)
```

### Scripts

```
scripts/
├── compile-ink.js       # Compile .ink files to .ink.json
├── fetch-content.js     # Download content to SQLite database
├── generate-embeddings.js # Generate semantic embeddings
├── validate-content.js  # Validate content integrity
├── analyze-bundle-size.js # Check against size budgets
└── test-native-platforms.js # Test Capacitor builds
```

## Development Commands

```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fetch/update content database
npm run fetch-content

# Capacitor commands
npm run cap:sync    # Sync web build to native projects
npm run cap:open    # Open native IDE (Xcode/Android Studio)
```

## Architecture Patterns

### Platform Abstraction
The app uses a facade pattern to abstract platform differences:

```javascript
// db.js - automatically uses correct storage backend
import { db } from './services/db';
await db.get('health_content', 'hypothermia');

// SearchService.js - uses FlexSearch (web) or FTS5 (native)
import { SearchService } from './services/SearchService';
await SearchService.search('burn treatment');
```

### Storage Stores (IndexedDB/SQLite)
- `datasets` - Region metadata
- `data_content` - GeoJSON and content blobs
- `guides` / `guide_content` - Guide metadata and content
- `health_content` - Medical articles
- `survival_content` - Survival content
- `law_content` - Legal content
- `map_tiles` - Offline map tiles
- `search_index` - Persisted FlexSearch index
- `ai_models` - Downloaded AI model metadata
- `content_packs` - Content pack metadata

### Code Splitting
Vite is configured with manual chunks for optimal caching:
- `react-vendor` - React, ReactDOM, React Router
- `ui-vendor` - Lucide icons
- `ai-module` - AI services (lazy loaded)
- `map-module` - Leaflet (lazy loaded)

### Lazy Loading
Non-critical pages use React.lazy() for code splitting:
```javascript
const Health = lazy(() => import('./pages/Health'));
```

## Ink Interactive Stories

Interactive triage flows use the Ink scripting language:

1. **Source files**: `public/assets/ink/source/*.ink`
2. **Compile**: `node scripts/compile-ink.js` (requires inklecate CLI)
3. **Output**: `public/assets/ink/*.ink.json`

Usage in components:
```javascript
import { inkService } from '../services/InkService';
await inkService.loadStory('health/choking.ink.json');
const state = inkService.continue(); // Get text + choices
inkService.choose(0); // Select a choice
```

## Size Budget

Target: **500MB total** for offline-first operation

Current allocation (from `size-budget.json`):
- Code (dist/): ~50MB budget, ~1.6MB actual
- Content (DB + assets): ~150MB budget, ~27MB actual
- Maps: ~200MB budget
- Buffer: ~100MB

## Native Development (Capacitor)

Configuration in `capacitor.config.json`:
```json
{
  "appId": "com.urbanoffline.app",
  "appName": "UrbanOffline",
  "webDir": "dist"
}
```

Native storage uses:
- **SQLite** for structured data and FTS5 search
- **Filesystem API** for large content blobs (stored in Documents directory)

Build workflow:
```bash
npm run build        # Build web app
npm run cap:sync     # Copy to native projects
npm run cap:open     # Open in Xcode/Android Studio
```

## Key Implementation Details

### Logger Usage
All services use namespaced logging:
```javascript
import { createLogger } from '../utils/logger';
const log = createLogger('MyService');
log.info('Message', { data });
log.error('Error', error);
```

### Error Boundaries
The app wraps routes in ErrorBoundary with dev/prod modes:
```javascript
<ErrorBoundary showDetails={import.meta.env.DEV}>
```

### Offline Detection
`OfflineIndicator` component shows network status in the header.

### ESLint Configuration
- Unused vars: Error (except `^[A-Z_]` pattern and `^_` prefixed args)
- React Hooks rules enforced
- Scripts folder has Node.js globals enabled

## Content Sources

The app aggregates content from:
- WikiMed / Medical Wikipedia (CC-BY-SA)
- UK Government OGL content (PACE codes, legislation)
- Custom triage flows (Ink scripts)

Attribution compliance is tracked in the `attributions` SQLite table.

## Testing

Currently no test framework is configured. Scripts in `/scripts` provide:
- Content validation (`validate-content.js`)
- Native platform testing (`test-native-platforms.js`)
- Bundle size analysis (`analyze-bundle-size.js`)

## Common Tasks

### Adding a new page
1. Create component in `src/pages/NewPage.jsx`
2. Add lazy import in `App.jsx`
3. Add route in the Routes configuration

### Adding a new Ink story
1. Create `.ink` file in `public/assets/ink/source/category/`
2. Run `node scripts/compile-ink.js`
3. Reference as `category/storyname.ink.json` in components

### Adding content to a domain
1. Add to appropriate store (`health_content`, `survival_content`, `law_content`)
2. SearchService will index on next init

### Updating the native app
1. `npm run build`
2. `npm run cap:sync`
3. Open native IDE and build/deploy
