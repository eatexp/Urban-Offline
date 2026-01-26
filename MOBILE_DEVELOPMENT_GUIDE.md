# Urban-Offline Mobile Development Guide
## iOS & Android Testing and Development Workflow

This guide provides the complete workflow for developing and testing the Urban-Offline emergency preparedness app on iOS and Android platforms using Capacitor.

## Prerequisites

### Required Software
- **Node.js** 18+ (LTS)
- **npm** or **yarn**
- **Git**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **Chrome DevTools** (for web debugging)

### Platform-Specific Requirements

#### Android Development
- Android Studio with Android SDK
- Java Development Kit (JDK) 11+
- Android device or emulator (API level 21+)

#### iOS Development
- macOS with Xcode 14+
- iOS device or simulator (iOS 13+)
- Apple Developer account (for device testing)

## Development Workflow Overview

```
Web Development → Native Build → Device Testing → Production
     ↓              ↓              ↓              ↓
  Chrome DevTools  Emulators     Real Devices   App Store
```

## Step 1: Initial Setup

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Build the Web App
```bash
npm run build
```

### 1.3 Add Native Platforms
```bash
# Add iOS platform (macOS only)
npx cap add ios

# Add Android platform
npx cap add android
```

### 1.4 Sync Capacitor
```bash
npm run cap:sync
```

## Step 2: Development Strategies

### Strategy A: Web-First Development (Recommended for UI/UX)

**Best for**: Rapid UI development, CSS styling, React component testing

```bash
# Start development server
npm run dev

# Open in browser
# Navigate to http://localhost:5173
```

**Testing Tools**:
- Chrome DevTools mobile emulation
- Responsive design mode
- Network throttling for offline testing
- Lighthouse for performance auditing

### Strategy B: Native-First Development

**Best for**: Testing native features (SQLite, file system, device APIs)

```bash
# Build for production
npm run build

# Sync with native platforms
npm run cap:sync

# Open native IDEs
npm run cap:open
```

## Step 3: Platform-Specific Setup

### Android Development

#### 3.1 Android Studio Setup
1. Open Android Studio
2. Import the `android` folder from your project
3. Let Gradle sync complete
4. Set up an Android Virtual Device (AVD) or connect physical device

#### 3.2 Enable Developer Options (Physical Device)
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Enable USB Debugging in Developer Options

#### 3.3 Run on Android
```bash
# Option 1: Using Android Studio
# Click Run button in Android Studio

# Option 2: Using command line
cd android
./gradlew assembleDebug
./gradlew installDebug
```

### iOS Development (macOS only)

#### 3.4 Xcode Setup
1. Open Xcode
2. Open the `ios/App/App.xcworkspace` file
3. Select your development team in Signing & Capabilities
4. Set up iOS Simulator or connect physical device

#### 3.5 Run on iOS
```bash
# Option 1: Using Xcode
# Click Run button in Xcode

# Option 2: Using command line
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -destination 'platform=iOS Simulator,name=iPhone 14' build
```

## Step 4: Live Reload Development (Advanced)

### 4.1 Set Up Live Reload
Capacitor supports live reload for rapid development:

```bash
# Find your local IP address
ipconfig getifaddr en0  # macOS
ipconfig                # Windows

# Create capacitor.config.json override
echo '{
  "server": {
    "url": "http://YOUR_IP:5173",
    "cleartext": true
  }
}' > capacitor.config.json
```

### 4.2 Development Workflow with Live Reload
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Sync and run on device
npm run cap:sync
npm run cap:open
```

## Step 5: Testing Strategies

### 5.1 Web Testing (Primary Development)
```bash
npm run dev
```
- Test responsive design
- Validate offline functionality
- Debug JavaScript/React components
- Test search and AI features

### 5.2 Emulator Testing (Feature Validation)
```bash
npm run build
npm run cap:sync
npm run cap:open
```
- Test native SQLite functionality
- Validate file system operations
- Test device-specific features
- Performance testing

### 5.3 Real Device Testing (Final Validation)
- Install on physical devices
- Test touch interactions
- Validate offline maps
- Test emergency protocols
- Performance under stress

## Step 6: Debugging Techniques

### Web Debugging
```bash
# Chrome DevTools
# - Elements panel for CSS debugging
# - Console for JavaScript errors
# - Network panel for API calls
# - Application panel for storage
```

### Native Debugging

#### Android
```bash
# View logs
adb logcat

# Inspect WebView
chrome://inspect/#devices

# Debug SQLite
adb shell
cd /data/data/com.urbanoffline.app/databases
sqlite3 databases
```

#### iOS
```bash
# View logs in Xcode console
# Safari Web Inspector for WebView
# Safari → Develop → [Device Name] → App
```

## Step 7: Offline Testing

### 7.1 Simulate Offline Conditions
```bash
# Web: Chrome DevTools Network tab → Offline
# Android: Airplane mode
# iOS: Airplane mode
```

### 7.2 Test Offline Features
- Content accessibility without internet
- Map functionality offline
- Search performance
- AI assistant responses
- Emergency protocols

## Step 8: Performance Testing

### 8.1 Bundle Size Analysis
```bash
npm run build
npm run analyze-bundle
```

### 8.2 Native Performance
- Cold start time
- Memory usage
- Battery consumption
- Storage footprint

## Step 9: Emergency Scenario Testing

### 9.1 Stress Testing
- Rapid button presses
- Multiple simultaneous actions
- Low battery conditions
- Poor network conditions

### 9.2 Accessibility Testing
- Screen reader compatibility
- High contrast mode
- Large text settings
- Voice control

## Step 10: Deployment Preparation

### 10.1 Build for Production
```bash
npm run build
npm run cap:sync
```

### 10.2 Test Production Build
```bash
# Android
cd android
./gradlew assembleRelease

# iOS
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release build
```

## Common Issues and Solutions

### Issue: Capacitor Sync Fails
```bash
# Solution: Clean and rebuild
rm -rf android ios
npx cap add android
npx cap add ios
npm run cap:sync
```

### Issue: Live Reload Not Working
```bash
# Solution: Check IP address and firewall
# Ensure device and computer are on same network
# Check firewall settings
```

### Issue: Native Plugins Not Found
```bash
# Solution: Reinstall dependencies
npm install
cd ios && pod install
```

## Development Best Practices

### 1. **Web-First Approach**
- Develop 80% of features in web browser
- Use native testing for device-specific features only
- Rapid iteration with hot reload

### 2. **Progressive Enhancement**
- Ensure core functionality works without native features
- Add native capabilities as enhancements
- Graceful degradation for unsupported features

### 3. **Offline-First Testing**
- Always test with airplane mode
- Validate data persistence
- Test emergency scenarios without internet

### 4. **Performance Monitoring**
- Regular bundle size checks
- Memory usage monitoring
- Battery consumption testing

## Recommended Development Schedule

### Week 1-2: Web Development
- Core UI/UX implementation
- Offline functionality
- Search and AI features

### Week 3: Native Integration
- SQLite database setup
- File system operations
- Native plugin integration

### Week 4: Device Testing
- Real device validation
- Performance optimization
- Emergency scenario testing

### Week 5: Polish & Deployment
- Bug fixes and optimization
- App store preparation
- Final testing and release

## Tools and Resources

### Essential Tools
- **Chrome DevTools**: Web development and debugging
- **Android Studio**: Android development and emulation
- **Xcode**: iOS development and simulation
- **ADB**: Android debugging
- **React Developer Tools**: React component debugging

### Useful Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Native Debugging Guide](https://reactnative.dev/docs/debugging)
- [Chrome DevTools Mobile](https://developer.chrome.com/docs/devtools/device-mode/)

This guide provides a comprehensive workflow for developing and testing the Urban-Offline app across both iOS and Android platforms while maintaining the critical offline-first functionality that makes this emergency preparedness app unique.