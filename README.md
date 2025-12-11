# Urban-Offline

## Overview
Urban-Offline is an Offline-First Emergency Preparedness Application designed to provide critical information and tools when internet connectivity is unavailable.

## Features
- **Offline Access**: Core functionality works without an internet connection
- **Emergency Guides**: First aid, survival, and legal rights guides
- **Interactive Triage**: Step-by-step decision trees for emergencies
- **Offline Maps**: Downloadable map tiles with POI markers
- **Wikipedia Content**: Curated medical and survival articles
- **Dark Theme**: Premium dark UI optimized for all conditions

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Web/PWA | Ready | Any modern browser, installable |
| Android | Configured | Via Capacitor |
| iOS | Configured | Via Capacitor (requires Mac) |
| Linux | Ready | Including Raspberry Pi |
| macOS | Ready | Intel and Apple Silicon |
| Windows | Ready | Windows 10/11 |

## Tech Stack
- **Vite**: Fast build tool and dev server
- **React 19**: UI library
- **VitePWA**: Progressive Web App support
- **Capacitor**: Native mobile builds
- **Leaflet**: Offline maps
- **Ink**: Interactive story engine
- **better-sqlite3**: Content database (build-time)
- **IndexedDB/idb**: Runtime storage

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/Urban-Offline.git
cd Urban-Offline

# Install dependencies
npm install
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev
```

### Production Build

```bash
# Full build with content
npm run prebuild && npm run build

# Or just build (without fetching content)
npm run build

# Preview production build
npm run preview
```

### Fetching Content

The app includes a Wikipedia content pipeline for offline articles:

```bash
# Fetch curated articles (requires internet)
npm run fetch-content

# This creates content.db with ~80 emergency/medical articles
```

## Platform-Specific Setup

### Linux / Raspberry Pi

```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools for native modules
sudo apt-get install -y build-essential python3

# Install and build
npm install
npm run dev
```

**Note for ARM devices (Pi, etc.)**: The `better-sqlite3` package compiles native bindings. This may take a few minutes on first install.

### macOS

```bash
# Install Xcode command line tools (if not installed)
xcode-select --install

# Install Node.js via Homebrew (recommended)
brew install node

# Install and build
npm install
npm run dev
```

### Windows

```bash
# Install Node.js from https://nodejs.org/

# You may need windows-build-tools for native modules:
npm install --global windows-build-tools

# Install and build
npm install
npm run dev
```

## Mobile Builds (Capacitor)

### Android

```bash
# Add Android platform (first time only)
npx cap add android

# Build and sync
npm run build
npm run cap:sync

# Open in Android Studio
npm run cap:open android
```

### iOS (macOS only)

```bash
# Add iOS platform (first time only)
npx cap add ios

# Build and sync
npm run build
npm run cap:sync

# Open in Xcode
npm run cap:open ios
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run prebuild` | Fetch content and prepare assets |
| `npm run fetch-content` | Download Wikipedia articles |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run cap:sync` | Sync web build to native projects |
| `npm run cap:open` | Open native project in IDE |

## Project Structure

```
Urban-Offline/
├── public/           # Static assets
│   └── assets/       # Content database (after prebuild)
├── scripts/          # Build scripts
│   ├── prebuild.js   # Cross-platform prebuild
│   ├── fetch-content.js  # Wikipedia fetcher
│   └── verify-db.js  # Database validator
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── services/     # Data and storage services
│   └── data/         # Static data and Ink stories
└── dist/             # Production build output
```

## Troubleshooting

### `better-sqlite3` fails to install
This package requires native compilation. Ensure you have:
- Python 3.x installed
- C++ build tools (gcc/g++ on Linux, Xcode on Mac, windows-build-tools on Windows)

### App works but no content
Run `npm run fetch-content` to download Wikipedia articles, then rebuild.

### Maps not loading offline
Download a region first via Resources page while online.

## License
ISC
