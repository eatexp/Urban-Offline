# Urban-Offline - Claude Development Guide

## Project Overview

Urban-Offline is an **Offline-First Emergency Preparedness Application** designed to provide critical information and tools when internet connectivity is unavailable. Built as a Progressive Web App (PWA) with native mobile support via Capacitor.

### Core Purpose
- Provide emergency guides, triage tools, and resource maps offline
- Support health, survival, and legal scenarios
- Work reliably without internet connectivity
- Enable AI-powered assistance with offline models

## Tech Stack

### Frontend
- **React 19.2.0** - UI library
- **React Router DOM 7.10.0** - Client-side routing
- **Vite 7.2.4** - Build tool and dev server
- **Vanilla CSS** - Custom styling (no CSS frameworks)

### Offline & PWA
- **vite-plugin-pwa 1.2.0** - Service worker and PWA manifest
- **@capacitor/core 7.4.4** - Native mobile platform support
- **idb 8.0.3** - IndexedDB wrapper for browser storage
- **@capacitor-community/sqlite 7.0.2** - SQLite for native platforms

### Features
- **Leaflet 1.9.4** + **react-leaflet 5.0.0** - Offline maps
- **FlexSearch 0.8.212** - Full-text search
- **inkjs 2.3.2** - Interactive story/triage flows
- **@xenova/transformers 2.17.2** - AI/ML models (offline inference)
- **lucide-react 0.555.0** - Icon library

## Project Structure

```
/home/user/Urban-Offline/
├── public/
│   └── assets/          # Static assets, bundled content.db
├── scripts/
│   └── fetch-content.js # Pre-build content fetching
├── src/
│   ├── components/      # Reusable React components
│   ├── data/            # Static data, guides (markdown)
│   ├── pages/           # Route-level page components
│   ├── services/        # Business logic & data services
│   │   ├── ai/          # AI model services
│   │   ├── contentPacks/# Content pack management
│   │   ├── search/      # Search indexing
│   │   ├── storage/     # Storage abstraction (IDB/SQLite)
│   │   └── triage/      # Triage flow engines
│   └── utils/           # Utility functions (logger, etc.)
├── package.json
├── vite.config.js
└── capacitor.config.json
```

## Key Architecture Patterns

### 1. Storage Abstraction
The app uses a dual-storage strategy:
- **Web**: IndexedDB via `idb` (services/db.js)
- **Native**: SQLite via Capacitor (services/storage/NativeStorage.js)

Services automatically detect platform using `Capacitor.isNativePlatform()`.

### 2. Service Layer
All data access goes through services in `src/services/`:
- `db.js` - Storage initialization
- `articleService.js` - Article CRUD operations
- `SearchService.js` - Full-text search indexing
- `contentSync.js` - Content synchronization
- `dataManager.js` - Data import/export
- `tileManager.js` - Offline map tile management

### 3. Triage Flows
Interactive decision trees using Ink.js stories:
- `services/triage/` - Flow engines for health/survival/law
- `components/TriageScreen.jsx` - UI renderer
- `pages/TriagePage.jsx` - Route handler

### 4. Offline-First
- Content pre-fetched during build: `npm run fetch-content`
- Service worker caches all assets
- IndexedDB/SQLite persists user data
- Maps use offline tile cache

## Development Workflow

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
# Runs Vite dev server on http://localhost:5173
```

### Build for Production
```bash
npm run build
# Runs prebuild hook (fetches content) then builds
```

### Preview Production Build
```bash
npm run preview
```

### Mobile Development
```bash
npm run cap:sync   # Sync web build to native platforms
npm run cap:open   # Open in Android Studio / Xcode
```

## Code Conventions

### File Naming
- **Components**: PascalCase (`TriageScreen.jsx`)
- **Services**: camelCase (`articleService.js`)
- **Pages**: PascalCase (`Home.jsx`)
- **Utilities**: camelCase (`logger.js`)

### Logging
Use the logger utility for consistent logging:
```javascript
import { createLogger } from './utils/logger';
const log = createLogger('ComponentName');

log.info('Message');
log.warn('Warning');
log.error('Error', error);
```

### Styling
- Use vanilla CSS in component files or global `index.css`
- Follow existing class naming patterns (kebab-case)
- Avoid inline styles except for dynamic values
- No CSS-in-JS libraries

### Error Handling
- Use ErrorBoundary component for React errors
- Services should catch and log errors appropriately
- User-facing errors should be clear and actionable

## Key Components

### Layout & Navigation
- `components/Layout.jsx` - App shell with navigation
- `components/Navbar.jsx` - Bottom navigation bar
- `components/ErrorBoundary.jsx` - Error boundary wrapper

### Pages
- `pages/Home.jsx` - Landing page
- `pages/Health.jsx`, `Survival.jsx`, `Law.jsx` - Domain pages
- `pages/Guides.jsx` - Guide browser
- `pages/TriagePage.jsx` - Interactive triage
- `pages/Map.jsx` - Offline map viewer
- `pages/AIChat.jsx` - AI assistant interface
- `pages/Settings.jsx` - App settings

### Specialized Components
- `components/Search.jsx` - Search interface
- `components/OfflineTileLayer.jsx` - Custom map tile layer
- `components/DatasetManager.jsx` - Content pack management
- `components/TriageScreen.jsx` - Triage flow renderer

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx` (assuming router config is there)
3. Add navigation link in `components/Navbar.jsx` if needed

### Adding a New Service
1. Create file in `src/services/newService.js`
2. Export functions/classes
3. Import and use in components
4. Consider storage layer (IDB vs SQLite)

### Adding Content
1. Articles go through `articleService.js`
2. Guides are markdown in `src/data/guides/`
3. Content packs managed via `DatasetManager`

### Updating Dependencies
```bash
npm update
# Check for breaking changes in major versions
# Test thoroughly - this is an offline-first app!
```

## Testing Offline Functionality

### In Browser
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload and test functionality

### Storage Inspection
- **IndexedDB**: DevTools → Application → IndexedDB
- **SQLite**: Use native platform debugging tools

## Important Notes

### Build Pipeline
- `prebuild` script fetches content and copies `content.db` to `public/assets/`
- Content must be available offline before build
- Windows-specific commands in `package.json` (mkdir, copy)

### Platform Differences
Always check `Capacitor.isNativePlatform()` when:
- Accessing storage (IDB vs SQLite)
- Using device features
- Loading assets

### Performance
- Lazy load heavy components (AI models, maps)
- Index content incrementally
- Cache aggressively but invalidate appropriately

## Troubleshooting

### Service Worker Issues
```bash
# Clear service worker in DevTools
# Application → Service Workers → Unregister
```

### Storage Issues
```javascript
// Check storage initialization
await initStorage();
```

### Build Failures
- Ensure `content.db` exists or can be created
- Check Node.js version compatibility
- Clear `node_modules` and reinstall

## Git Workflow

### Branch Strategy
- Develop on feature branches starting with `claude/`
- Branch naming: `claude/feature-name-<session-id>`
- Commit frequently with clear messages
- Push to feature branch when complete

### Current Branch
Working on: `claude/update-claude-md-SqWWN`

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Capacitor Documentation](https://capacitorjs.com)
- [Leaflet Documentation](https://leafletjs.com)
- [PWA Documentation](https://web.dev/progressive-web-apps)

## Questions?

When working on this project:
1. **Check services first** - Most logic is in `src/services/`
2. **Respect offline-first** - Always consider no-network scenarios
3. **Test on both platforms** - Web and native behave differently
4. **Log appropriately** - Use the logger utility
5. **Keep it simple** - Vanilla CSS, minimal dependencies

---

*Last updated: 2026-01-25*
