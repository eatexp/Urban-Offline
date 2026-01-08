# CLAUDE.md - Urban-Offline Development Guide

## Vision & Mission

### Core Mission
Urban-Offline is a fully **"airgapped" emergency preparedness application** designed to remain operational when modern, cloud-centric infrastructure fails. In a crisis—natural disaster, grid failure, or network outage—reliance on connected services becomes a critical vulnerability. This app serves as a resilient, life-saving alternative providing intelligence entirely on-device.

### Value Proposition
**"Download once, use anywhere"** — A single-download resource that works under any conditions:
- **Complete Offline Functionality**: All critical features work without internet
- **Universal Accessibility**: Dependable for international travel, remote operations, or local emergencies
- **Comprehensive Emergency Reference**: ~150MB compressed knowledge base eliminating external dependencies

### Why This Architecture?
The life-or-death context renders conventional solutions inadequate:
- **Static PDFs are inert** — no interactivity, no search, no guidance
- **Pure generative AI is dangerous** — hallucination risk is unacceptable for medical advice
- **Cloud services fail when needed most** — network outages coincide with emergencies

The **Three-Layer Hybrid Intelligence Model** solves this by balancing:
1. **Speed** — instant intent classification (3-10ms)
2. **Safety** — deterministic, pre-authored protocols with zero hallucination
3. **Depth** — comprehensive knowledge retrieval via hybrid search

### Key Principles
- **Absolute reliability** in network-denied environments
- **Zero AI hallucination** in life-or-death scenarios (Ink narrative engine)
- **Lightweight & battery-efficient** on-device ML (~1-2 mAh per 1,000 inferences)
- **Open-source licensed content** only (CC-BY-SA, OGL, Public Domain)
- **500MB total size budget** for accessibility on limited storage devices

### Target Success Metrics
- **App size**: < 480MB (leaving buffer)
- **Cold start**: < 2 seconds
- **Search latency**: < 1 second
- **Emergency scenario success**: >90% find critical info within 30 seconds
- **User trust rating**: >4/5 on "I would trust this app in a real emergency"

---

## Project Overview

Urban-Offline is an **Offline-First Emergency Preparedness Application** that provides critical information and tools when internet connectivity is unavailable. It's a Progressive Web App (PWA) with native mobile support via Capacitor.

### Core Domains (4 Pillars)
- **Health & First Aid**: Medical guides (WikiProject Medicine), interactive triage flows, first aid protocols
- **Law & Rights**: PACE codes, UK legislation, custody rights, stop-and-search guidance
- **Survival & Prep**: Shelter building, water purification, fire-making, signaling
- **Maps & Navigation**: Offline maps, emergency locations (hospitals, shelters, water), flood zones

## Three-Layer Hybrid Intelligence Architecture

The app employs a deliberate architecture to ensure safety, speed, and reliability:

### Layer 1: Intent Router
- **Function**: Acts as the "triage nurse" — instantly classifies natural language queries into structured intents (e.g., "my arm is cut bad" → `injury.hemorrhage.arm`)
- **Technology**: Lightweight ML classifier (MLTextClassifier on native, or keyword matching on web)
- **Performance**: 3-10ms latency, 99%+ accuracy on 20-50 predefined emergency intents
- **Fallback**: Low confidence queries route to Layer 3 search

### Layer 2: Narrative Engine (Ink)
- **Function**: Acts as the "specialist clinician" — executes pre-authored, branching conversation trees for high-stakes scenarios
- **Technology**: Ink scripting language (deterministic state machine)
- **Safety**: Zero hallucination risk — every response is human-authored and medically verified
- **Examples**: CPR guidance, severe bleeding control, choking response, custody rights

### Layer 3: Knowledge Engine
- **Function**: Acts as the "reference library" — hybrid search for informational queries
- **Technology**:
  - Web: FlexSearch (in-memory full-text)
  - Native: SQLite FTS5 + sqlite-vec (semantic vectors)
- **Hybrid Search**: Combines keyword precision with semantic understanding via Reciprocal Rank Fusion

---

## Tech Stack

- **Frontend**: React 19, React Router 7, Vanilla CSS with Tailwind-style utilities
- **Build**: Vite 7 with PWA plugin, ESBuild minification
- **Offline Storage**:
  - Web: IndexedDB via `idb` library
  - Native: SQLite via `@capacitor-community/sqlite` + Filesystem API
- **Search**: FlexSearch (web) / FTS5 + semantic vectors (native SQLite)
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

## Content Strategy & Licensing

### Critical Licensing Decision
**NHS content is excluded** — The NHS Syndication License requires UK geographic verification, conflicting with the "download once, use anywhere" value proposition. All content uses globally-permissive licenses.

### Approved Content Sources

| Content Type | Source | License | Est. Size |
|-------------|--------|---------|-----------|
| Medical Reference | WikiProject Medicine (ZIM) | CC-BY-SA | ~200-250MB |
| Medical Protocols | OpenWHO, CDC Guidelines | CC-BY-NC / Public Domain | ~20MB |
| UK Legal | legislation.gov.uk | OGL (Open Government) | ~10-20MB |
| Emergency Guides | FEMA, Red Cross | Public Domain | ~10MB |
| Mapping | OpenStreetMap | ODbL | ~150-200MB |
| Flood Data | UK Environment Agency | OGL | ~15-20MB |

### Compliance Requirements
- **Attribution Manifest**: All sources must be attributed in-app
- **Share-alike tracking**: `attributions` table tracks CC-BY-SA requirements
- **No proprietary map data**: Mapbox/Google Maps licenses prohibit offline redistribution

### Interactive Triage Content
Custom Ink scripts authored for:
- Medical emergencies (CPR, choking, bleeding, burns, stroke)
- Legal scenarios (arrest rights, custody, stop-and-search)
- Survival situations (shelter, fire, water, signaling)

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
