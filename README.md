# Urban-Offline

**Your survival toolkit when systems fail.**

Urban-Offline is an offline-first emergency preparedness application designed for civil unrest, infrastructure collapse, and survival scenarios. When the power grid fails, internet goes down, or civil order breaks down, this app provides critical information to keep you safe.

> **V1.0 "Operation Blackout" — Release Candidate**  
> *Implementation complete. Field testing required before production certification.*

---

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

---

## Core Features

### 🤖 AI-Powered Emergency Assistant
- **Local LLM models**: Phi-3, SmolLM-360M, TinyLlama (runs offline)
- **Retrieval-Augmented Generation (RAG)**: Accurate answers with real-time citations
- **Progressive response streaming**: See AI thinking in real-time
- **Dataset toggles**: Enable/disable knowledge domains for scenario-specific responses
- **Grokopedia**: Offline Wikipedia browser with ZIM file support

### 🗺️ Generative AI Maps
- **CartridgePOIQueryEngine**: Intelligent POI search within map cartridges
- Natural language queries: "Where is the nearest hospital?"
- Precise coordinate responses with distance calculations
- OpenStreetMap tiles with offline caching
- Water sources, shelters, evacuation routes

### 🔋 Offline Survival Mode
- **Battery-aware power saving**: Automatic activation at ≤10% battery
- **AI model switching**: Auto-downgrades to SmolLM-360M for lowest power consumption
- **Screen dimming**: Reduces brightness to 20% on native devices
- **Resource disable**: Haptics, audio, and animations disabled
- **Manual override**: Toggle survival mode from AmbientStatusBar

### 🎮 Tactile Feedback & Audio
- **TactileSignatureEngine**: 8 distinct haptic signatures
  - AI thinking pulses
  - Map interaction feedback
  - Emergency alerts
  - UI confirmation tones
- **TacticalAudioService**: Procedural Web Audio API sound effects
  - Zero audio files — fully offline capable
  - Scan-sweep, lock-on, alert-ping, confirm-tone, error-buzz

### 📚 Interactive Decision Trees
- **Ink.js-based triage systems**: Emergency scenario guidance
- Step-by-step crisis navigation
- Civil unrest protocols
- Medical emergency triage
- Life-safety reliability (deterministic, not AI-based)

### 📦 Content Pack System
- **ZIM/Kiwix integration**: Immutable, versioned content packs
- **SHA-256 validation**: Checksum verification on import
- **Delta updates**: Efficient content updates (only changed chunks)
- **Embeddings pre-computed**: RAG-ready at install time
- Region packs: 95-140 MB each

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 6, React Router 7 |
| **Styling** | Tailwind CSS v4 + Custom Design System |
| **Mobile** | Capacitor 7.4.4 (iOS/Android) |
| **Storage** | IndexedDB (Web), SQLite + Filesystem (Native) |
| **Search** | FlexSearch (Web), SQLite FTS5 (Native) |
| **Maps** | Leaflet + React-Leaflet with PMTiles |
| **AI/ML** | WebLLM, Transformers.js, ONNX Runtime |
| **Triage** | Ink.js for interactive narratives |
| **Content** | ZIM format via libzim-wasm |

---

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- npm or pnpm

### Installation
```bash
git clone https://github.com/eatexp/Urban-Offline.git
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
Fetch offline content and generate embeddings:
```bash
npm run fetch-content
npm run generate-embeddings
```

### Production Build
```bash
npm run build
```

Output in `dist/` directory.

### Mobile Development

1. Build web assets:
```bash
npm run build
```

2. Sync to native projects:
```bash
npx cap sync
```

3. Open native IDE:
```bash
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

---

## Project Structure

```
src/
├── pages/              # Route components (Home, AIChat, Library, Map, Grokopedia)
├── components/         # UI components
│   ├── ai-visualizations/  # AI thinking visualizations
│   ├── chat/           # Chat interface components
│   └── grokopedia/     # Wikipedia browser components
├── services/           # Business logic
│   ├── ai/             # AI models, RAG pipeline, TransformersEngine
│   ├── contentPacks/   # Content pack management
│   ├── maps/           # Map cartridges, PMTiles integration
│   ├── storage/        # Platform-agnostic storage
│   ├── triage/         # Ink.js decision trees
│   └── zim/            # ZIM file reading
├── contexts/           # React contexts (ThemeContext)
├── hooks/              # Custom React hooks
├── utils/              # Utilities (platform, logger, checksum)
└── styles/             # CSS design system

public/assets/
├── content-manifest.json   # Semantic versioning for content
├── packs/              # Content packs (legal-uk, medical-core, survival-core)
├── embeddings.json     # RAG embeddings
├── ink/                # Compiled Ink narratives
└── wasm/               # WebAssembly modules (zstd, xz)

scripts/
├── fetch-content.js    # Wikipedia content fetcher
├── compile-ink.js      # Ink story compiler
├── generate-embeddings.js
├── quality-audit.js    # Code quality gates
└── quality-gates.js    # Pre-commit hooks
```

---

## Geographic Coverage

**Currently UK-focused** with framework for global expansion:
- London (primary)
- NYC (secondary)
- San Francisco (secondary)

Content includes:
- PACE Codes and UK legislation
- NHS hospital locations
- Environment Agency flood data
- UK grid vulnerabilities

---

## Quality Assurance

- **Lint**: ESLint with React hooks rules (`npm run lint`)
- **Tests**: Vitest test suite (`npm run test`)
- **Quality Gates**: Automated pre-commit hooks via Husky
- **Bundle Analysis**: Size monitoring with `scripts/analyze-bundle-size.js`

---

## Development Roadmap

### ✅ V1.0 "Operation Blackout" (Current — Release Candidate)
- Offline Survival Mode with battery-aware AI switching
- Generative AI Maps with POI queries
- Tactile haptics and procedural audio
- RAG-enhanced chat with citations
- Cross-platform iOS/Android parity

### 🚧 V1.1 (Planned)
- Dynamic POI database imports
- Mesh networking protocols
- Resource inventory tracking
- Additional region content packs

### 🔮 Future
- Satellite map integration
- Offline weather forecasting
- Community-contributed survival guides
- Hardware sensor integration (compass, barometer)

---

## License

MIT License — See [LICENSE](LICENSE)

## Contributing

Contributions welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and feature requests, use the [GitHub issue tracker](https://github.com/eatexp/Urban-Offline/issues).

---

**Built for personal resilience. Designed for when systems fail.**

*"In the dark, when the grid goes down, this app is the last thing standing."*

---

## Acknowledgments

- [Ink](https://www.inklestudios.com/ink/) — Interactive narrative scripting
- [Kiwix](https://kiwix.org/) — Offline Wikipedia access
- [OpenStreetMap](https://www.openstreetmap.org/) — Map data
- [Hugging Face](https://huggingface.co/) — Transformer models
- [Capacitor](https://capacitorjs.com/) — Cross-platform native runtime