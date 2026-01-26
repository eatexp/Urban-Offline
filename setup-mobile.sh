#!/bin/bash

# Urban-Offline Mobile Development Quick Setup
# Run this script to quickly set up mobile development environment

set -e  # Exit on any error

echo "🚀 Urban-Offline Mobile Development Quick Setup"
echo "=============================================="
echo ""

# Check if we're on Windows (use different commands)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "⚠️  Windows detected. Please run setup-mobile.bat instead."
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js found: $NODE_VERSION"
    else
        log_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm found: $NPM_VERSION"
    else
        log_error "npm not found. Please install npm."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
    echo ""
}

# Build web app
build_web_app() {
    log_info "Building web application..."
    npm run build
    log_success "Web app built successfully"
    echo ""
}

# Setup mobile platforms
setup_mobile_platforms() {
    log_info "Setting up mobile platforms..."
    
    # Add Android platform
    if [ ! -d "android" ]; then
        log_info "Adding Android platform..."
        npx cap add android
        log_success "Android platform added"
    else
        log_success "Android platform already exists"
    fi
    
    # Add iOS platform (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ ! -d "ios" ]; then
            log_info "Adding iOS platform..."
            npx cap add ios
            log_success "iOS platform added"
        else
            log_success "iOS platform already exists"
        fi
    else
        log_warning "Skipping iOS platform (not on macOS)"
    fi
    
    echo ""
}

# Sync Capacitor
sync_capacitor() {
    log_info "Syncing Capacitor..."
    npm run cap:sync
    log_success "Capacitor synced"
    echo ""
}

# Create development configuration
create_dev_config() {
    log_info "Creating development configuration..."
    
    cat > capacitor.config.dev.json << EOF
{
  "appId": "com.urbanoffline.app",
  "appName": "UrbanOffline Dev",
  "webDir": "dist",
  "server": {
    "url": "http://localhost:5173",
    "cleartext": true,
    "allowNavigation": [
      "localhost",
      "192.168.*",
      "10.0.*"
    ]
  },
  "plugins": {
    "CapacitorSQLite": {
      "iosDatabaseLocation": "Library/CapacitorDatabase",
      "androidDatabaseLocation": "default"
    },
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": true,
      "backgroundColor": "#0f172a"
    }
  },
  "android": {
    "buildOptions": {
      "debuggable": true,
      "minifyEnabled": false
    }
  },
  "ios": {
    "buildOptions": {
      "debuggable": true,
      "minifyEnabled": false
    }
  }
}
EOF
    
    log_success "Development configuration created"
    echo ""
}

# Update package.json scripts
update_scripts() {
    log_info "Updating package.json scripts..."
    
    # Add mobile development scripts if they don't exist
    npm pkg set scripts.dev:mobile="vite --host 0.0.0.0 --port 5173"
    npm pkg set scripts.mobile:android="npm run build && npm run cap:sync && cd android && ./gradlew assembleDebug"
    npm pkg set scripts.mobile:ios="npm run build && npm run cap:sync && cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug build"
    npm pkg set scripts.mobile:open:android="npx cap open android"
    npm pkg set scripts.mobile:open:ios="npx cap open ios"
    npm pkg set scripts.mobile:logs:android="adb logcat | grep -i urban"
    npm pkg set scripts.mobile:logs:ios="xcrun simctl spawn booted log show --predicate 'process == \\\"UrbanOffline\\\"'"
    npm pkg set scripts.mobile:live-reload="cp capacitor.config.dev.json capacitor.config.json && npm run dev:mobile"
    
    log_success "Package.json scripts updated"
    echo ""
}

# Main setup function
main() {
    echo ""
    check_prerequisites
    install_dependencies
    build_web_app
    setup_mobile_platforms
    sync_capacitor
    create_dev_config
    update_scripts
    
    echo ""
    log_success "🎉 Mobile development setup complete!"
    echo ""
    log_info "📚 Next steps:"
    echo "   1. Review MOBILE_DEVELOPMENT_GUIDE.md for detailed instructions"
    echo "   2. Check MOBILE_DEBUGGING.md for debugging tips"
    echo "   3. Run: npm run mobile:open:android  # or :ios"
    echo "   4. Start development: npm run dev:mobile"
    echo ""
    log_info "🔧 Quick commands:"
    echo "   npm run dev:mobile          # Start development server with live reload"
    echo "   npm run mobile:open:android # Open Android Studio"
    echo "   npm run mobile:open:ios     # Open Xcode (macOS only)"
    echo "   npm run mobile:logs:android # View Android logs"
    echo "   npm run mobile:logs:ios     # View iOS logs"
    echo ""
}

# Run main function
main