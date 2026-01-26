# Urban-Offline

**Your survival toolkit when systems fail.**

Urban-Offline is an offline-first emergency preparedness application designed for civil unrest, infrastructure collapse, and survival scenarios. When the power grid fails, internet goes down, or civil order breaks down, this app provides critical information to keep you safe.

## Primary Focus: Civil Unrest & Breakdown of Order

- Shelter-in-place vs. evacuation decision frameworks
- Safe navigation during riots and civil disturbances
- Resource security and protection strategies
- Communication alternatives when networks fail
- UK-focused content with global expansion capability

## Comprehensive Survival Coverage

- **Infrastructure Failure**: Power, water, internet, transportation outages
- **Wilderness Survival**: Fire, shelter, water, foraging, navigation
- **Medical Emergencies**: First aid, triage, CPR when hospitals unreachable
- **Legal Rights**: Know your rights during police encounters or martial law
- **Environmental Hazards**: Floods, storms, extreme weather

## Core Features

### Offline-First Architecture
- All critical functionality works without internet connection
- Progressive Web App (PWA) with service worker caching
- Native iOS/Android support via Capacitor
- Local AI models for intelligent emergency assistance

### Interactive Decision Trees
- Ink-based triage systems for emergency scenarios
- Step-by-step guidance through crisis situations
- Civil unrest navigation protocols
- Medical emergency triage

### Offline Maps & Resources
- OpenStreetMap tiles downloaded by region
- Water sources, shelters, evacuation routes
- Points of interest for survival scenarios
- Works completely offline once installed

### AI-Powered Emergency Assistant
- Local LLM models (Phi-3, TinyLlama)
- Retrieval-Augmented Generation (RAG) for accurate answers
- Offline knowledge base with source citations
- Toggleable datasets for scenario-specific responses

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Styling**: Tailwind v4 + Custom Design System (CSS Variables)
- **Storage**: IndexedDB (Web), SQLite + Filesystem (Native)
- **Search**: FlexSearch (Web), SQLite FTS5 (Native)
- **Maps**: Leaflet + React-Leaflet with OSM tiles
- **AI**: WebLLM, Transformers.js for local inference
- **Triage**: Ink.js for interactive narratives
- **Mobile**: Capacitor for iOS/Android

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- npm or yarn

### Installation
```bash
git clone https://github.com/yourusername/Urban-Offline.git
cd Urban-Offline
npm install
```

### Development
Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173`

### Building Content
Fetch offline content (Wikipedia articles):
```bash
npm run fetch-content
```

### Production Build
Build for web deployment:
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Mobile Development (Capacitor)

1. Build the web app:
```bash
npm run build
```

2. Sync to native projects:
```bash
npm run cap:sync
```

3. Open in native IDE:
```bash
npm run cap:open
```

Then build/run from Xcode (iOS) or Android Studio.

## Project Structure

```
src/
├── pages/           # Page components (Home, Survival, Health, Law, Map)
├── components/      # Reusable UI components (Navbar, Layout, Search)
├── services/        # Business logic layer
│   ├── storage/     # Platform-agnostic storage (Web/Native)
│   ├── search/      # Search implementations (FlexSearch/FTS5)
│   ├── ai/          # AI models and RAG pipeline
│   ├── triage/      # Interactive decision trees
│   └── contentPacks/# Content pack management
├── utils/           # Utilities (logger, etc.)
└── data/            # Static data files

public/assets/
├── content.db       # Pre-built SQLite database
├── embeddings.json  # Semantic embeddings for RAG
└── ink/             # Compiled Ink narrative files

scripts/
├── fetch-content.js # Wikipedia content fetcher
├── compile-ink.js   # Ink story compiler
└── generate-embeddings.js # Embedding generator
```

## Geographic Coverage

Currently UK-focused with framework for global expansion:
- London (primary)
- NYC (secondary)
- San Francisco (secondary)

Content includes UK-specific:
- PACE Codes and UK legislation
- NHS hospital locations
- Environment Agency flood data
- UK grid vulnerabilities

## Offline Content

The app comes pre-loaded with 50+ Wikipedia articles covering:
- Medical emergencies (CPR, bleeding, choking, hypothermia)
- Survival skills (water, shelter, fire, navigation)
- Legal rights (arrest procedures, PACE codes, human rights)

Additional content can be downloaded as region packs (95-140 MB each).

## Development Roadmap

### Current Focus
- ✅ Core vision alignment (survival-first)
- ✅ Dataset toggle system for AI
- 🚧 Civil unrest content expansion
- 🚧 Infrastructure failure scenarios
- 🚧 Map enhancements (survival POIs)

### Future Enhancements
- Content packs for more regions
- Mesh networking protocols
- Resource inventory tracking
- Scenario planning tools
- Time-based decision trees

## License

[Your License Here]

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Built for personal resilience. Designed for when systems fail.**
