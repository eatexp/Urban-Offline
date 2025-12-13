# Urban-Offline

Offline-first emergency preparedness PWA with native mobile support via Capacitor.

## Quick Start

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

## Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7
- **PWA**: vite-plugin-pwa with service worker
- **Native**: Capacitor 7 (Android/iOS)
- **Storage**: IndexedDB (web via idb), SQLite (native via @capacitor-community/sqlite)
- **Maps**: Leaflet + react-leaflet with offline tile caching
- **Interactive Guides**: Ink.js (inkjs) for branching triage stories
- **Search**: FlexSearch for full-text search
- **Icons**: lucide-react
- **Security**: DOMPurify for HTML sanitization

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout.jsx       # Main app layout with navbar
│   ├── Search.jsx       # Search with keyboard navigation
│   ├── TriageScreen.jsx # Interactive Ink.js story player
│   ├── ErrorBoundary.jsx# React error boundary
│   └── DatasetManager.jsx # Region data management
├── pages/               # Route pages
│   ├── Home.jsx         # Dashboard
│   ├── Health.jsx       # Medical category
│   ├── Law.jsx          # Legal rights category
│   ├── Survival.jsx     # Survival category
│   ├── Resources.jsx    # Dev tools (dev mode only)
│   ├── ArticleView.jsx  # Article display (XSS-sanitized)
│   └── TriagePage.jsx   # Triage guide launcher
├── services/            # Business logic
│   ├── storage/         # Platform-specific storage
│   │   ├── StorageInterface.js # Abstract interface
│   │   ├── WebStorage.js       # IndexedDB implementation
│   │   └── NativeStorage.js    # SQLite implementation
│   ├── search/          # Platform-specific search
│   ├── triage/          # Triage routing config
│   ├── InkService.js    # Ink story engine wrapper
│   ├── SearchService.js # FlexSearch wrapper
│   └── tileManager.js   # Offline map tiles
├── utils/               # Utilities
│   └── markdownRenderer.jsx # Lightweight MD renderer
├── data/guides/         # Static markdown guides
└── index.css            # Global styles (dark theme)

public/
├── assets/
│   ├── ink/             # Compiled Ink.js stories (.ink.json)
│   └── content.db       # SQLite content database
└── icon.svg             # App icon

scripts/                 # Build scripts (cross-platform Node.js)
├── prebuild.js          # Pre-build asset preparation
├── fetch-content.js     # Content fetching
└── compile-ink.js       # Ink story compiler
```

## Key Patterns

### Storage Abstraction
The app uses `StorageInterface` with platform-specific implementations:
- Web: `WebStorage` uses IndexedDB via `idb` library
- Native: `NativeStorage` uses SQLite via Capacitor plugin

### Triage System
Interactive decision trees using Ink.js:
1. Stories defined in `/public/assets/ink/source/*.ink`
2. Compiled to JSON via `scripts/compile-ink.js`
3. Played via `InkService` + `TriageScreen` component
4. Routes configured in `services/triage/TriageRouter.js`

### Security
- HTML content sanitized with DOMPurify (see `ArticleView.jsx`)
- CSP header in `index.html`
- Story ID validation against allowlist in `TriagePage.jsx`
- Dev tools hidden in production (`Resources.jsx`)

### Accessibility
- Full keyboard navigation in Search component
- ARIA labels throughout
- Reduced motion support in CSS
- Focus visible outlines

## Common Tasks

### Add a new triage guide
1. Create `.ink` file in `public/assets/ink/source/`
2. Run `node scripts/compile-ink.js` to compile
3. Add route to `src/services/triage/TriageRouter.js`

### Add a new category page
1. Create page in `src/pages/`
2. Add route in `src/App.jsx`
3. Add nav item in `src/components/Navbar.jsx`

### Modify storage schema
Edit `src/services/storage/schema.js`

## Build Targets

- **Web PWA**: `npm run build` (outputs to `dist/`)
- **Android**: `npm run build && npx cap sync android && npx cap open android`
- **iOS**: `npm run build && npx cap sync ios && npx cap open ios`

## Environment

- Node.js 18+
- Works on Mac, Linux, Windows, Raspberry Pi
- Mobile: Android 5+, iOS 13+

## Code Style

- React functional components with hooks
- ES modules throughout
- Tailwind-style utility classes in CSS
- Dark theme with CSS custom properties
