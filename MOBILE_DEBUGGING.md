# Mobile Debugging Guide for Urban-Offline

## Quick Reference Commands

### Android Debugging
```bash
# View app logs in real-time
npm run mobile:logs:android

# Connect to device and view all logs
adb logcat | grep -i "urban\|capacitor\|webview"

# Install debug build on device
cd android && ./gradlew installDebug

# List connected devices
adb devices

# Access app data directory (requires root)
adb shell
cd /data/data/com.urbanoffline.app/
ls -la

# Copy database for inspection
adb pull /data/data/com.urbanoffline.app/databases/ ./databases/
```

### iOS Debugging
```bash
# View app logs in real-time
npm run mobile:logs:ios

# List available simulators
xcrun simctl list devices

# Install app to booted simulator
xcrun simctl install booted ./ios/App/build/Debug-iphonesimulator/UrbanOffline.app

# Access simulator app data
cd ~/Library/Developer/CoreSimulator/Devices/[DEVICE-ID]/data/Containers/Data/Application/[APP-ID]/

# Copy database for inspection
cp Library/CapacitorDatabase/ ./desktop/
```

## WebView Debugging

### Android WebView Inspection
1. Enable Developer Options on device
2. Enable USB Debugging
3. Open Chrome and navigate to: `chrome://inspect/#devices`
4. Click "Inspect" under your app

### iOS WebView Inspection
1. Enable Developer Mode in Safari settings
2. Connect device or use simulator
3. Open Safari → Develop → [Device Name] → UrbanOffline
4. Use Web Inspector tools

## SQLite Database Debugging

### Android SQLite
```bash
# Connect to device shell
adb shell

# Navigate to app database directory
cd /data/data/com.urbanoffline.app/databases

# Open SQLite shell
sqlite3 databases

# List tables
.tables

# Query content
SELECT * FROM articles LIMIT 10;

# Check database integrity
PRAGMA integrity_check;
```

### iOS SQLite
```bash
# Find simulator device ID
xcrun simctl list devices | grep "iPhone"

# Navigate to device data
cd ~/Library/Developer/CoreSimulator/Devices/[DEVICE-ID]/data/Containers/Data/Application/[APP-ID]/Library/CapacitorDatabase/

# Open database with sqlite3
sqlite3 databases

# Same SQLite commands as Android
```

## Network and Offline Testing

### Simulate Network Conditions
```bash
# Android: Use device network settings
# Set to 2G/3G or airplane mode

# iOS: Use Network Link Conditioner
# Install from Xcode → Open Developer Tool → More Tools
```

### Test Offline Functionality
```bash
# Web: Chrome DevTools → Network → Offline
# Android: Settings → Airplane Mode
# iOS: Control Center → Airplane Mode
```

## Performance Debugging

### Memory Usage Monitoring
```bash
# Android memory profiling
adb shell dumpsys meminfo com.urbanoffline.app

# iOS memory usage
xcrun simctl spawn booted log show --predicate 'eventMessage contains "UrbanOffline"' --style json
```

### Bundle Size Analysis
```bash
# Generate bundle analysis
npm run build
npm run analyze-bundle

# Check native app size
# Android: cd android && ./gradlew assembleDebug && ls -la app/build/outputs/apk/debug/
# iOS: Check Xcode build logs for app size
```

## Native Feature Debugging

### SQLite Operations
```javascript
// Add debugging to your SQLite service
const debugSQL = true;

if (debugSQL) {
  console.log('[SQL]', query, params);
  
  try {
    const result = await db.query(query, params);
    console.log('[SQL Result]', result);
    return result;
  } catch (error) {
    console.error('[SQL Error]', error);
    throw error;
  }
}
```

### File System Operations
```javascript
// Add debugging to file operations
const debugFS = true;

if (debugFS) {
  console.log('[FS] Reading file:', filePath);
  
  try {
    const content = await Filesystem.readFile({ path: filePath });
    console.log('[FS] File size:', content.data.length);
    return content;
  } catch (error) {
    console.error('[FS Error]', error);
    throw error;
  }
}
```

### Device API Debugging
```javascript
// Add debugging to device operations
const debugDevice = true;

if (debugDevice) {
  console.log('[Device] Getting device info');
  
  try {
    const info = await Device.getInfo();
    console.log('[Device] Info:', info);
    return info;
  } catch (error) {
    console.error('[Device Error]', error);
    throw error;
  }
}
```

## Emergency Feature Testing

### Simulate Emergency Conditions
```bash
# Low battery (Android)
adb shell dumpsys battery set level 15

# Low memory (Android)
adb shell am send-trim-memory com.urbanoffline.app MODERATE

# Poor network (Android)
adb shell svc data disable
adb shell svc wifi disable
```

### Stress Testing Commands
```bash
# Rapid button press simulation
# Use UI automation tools or manual rapid tapping

# Multiple simultaneous operations
# Open multiple emergency protocols quickly

# Background/foreground switching
# Rapidly switch between apps
```

## Error Handling and Logging

### Centralized Logging
```javascript
// Create a mobile-specific logger
const mobileLogger = {
  log: (level, message, data) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry, data || '');
    
    // Send to native logs
    if (window.Capacitor) {
      Capacitor.Plugins.Console.log({ level, message, data });
    }
  },
  
  debug: (msg, data) => this.log('DEBUG', msg, data),
  info: (msg, data) => this.log('INFO', msg, data),
  warn: (msg, data) => this.log('WARN', msg, data),
  error: (msg, data) => this.log('ERROR', msg, data)
};
```

### Error Boundary for Native Features
```javascript
class NativeFeatureBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Native Feature Error]', error, errorInfo);
    
    // Log to native console
    if (window.Capacitor) {
      mobileLogger.error('Native feature error', {
        error: error.message,
        stack: error.stack,
        component: this.props.featureName
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Feature Temporarily Unavailable</h3>
          <p>Using fallback mode. Error: {this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Debugging Checklist

### Before Starting Development
- [ ] Device/emulator is connected and recognized
- [ ] Development tools are installed (Android Studio/Xcode)
- [ ] WebView debugging is enabled
- [ ] App is built in debug mode

### During Development
- [ ] Check logs regularly for warnings/errors
- [ ] Test offline functionality frequently
- [ ] Validate native plugin functionality
- [ ] Monitor memory usage and performance
- [ ] Test on multiple device sizes

### Before Production
- [ ] Remove all debug logging
- [ ] Test release build performance
- [ ] Validate all offline scenarios
- [ ] Check app store compliance
- [ ] Final security review

## Common Debugging Scenarios

### App Won't Start
1. Check native logs for crash information
2. Verify all plugins are properly installed
3. Check for JavaScript errors in WebView
4. Validate capacitor.config.json syntax

### Offline Features Not Working
1. Verify database is properly initialized
2. Check file system permissions
3. Test with airplane mode enabled
4. Validate data synchronization

### Search Not Returning Results
1. Check SQLite database integrity
2. Verify search index is built correctly
3. Test with different query types
4. Check for special characters in content

### Maps Not Loading Offline
1. Verify tile cache is populated
2. Check file system storage limits
3. Validate map region downloads
4. Test with different zoom levels

## Tools and Resources

### Essential Debugging Tools
- **Chrome DevTools**: WebView inspection
- **Android Studio**: Android debugging and profiling
- **Xcode**: iOS debugging and profiling
- **ADB**: Android device management
- **React Developer Tools**: Component debugging

### Useful Debugging Resources
- [Capacitor Debugging Guide](https://capacitorjs.com/docs/guides/debugging)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [iOS Simulator Guide](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/)
- [Chrome Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/)

This debugging guide provides comprehensive techniques for troubleshooting the Urban-Offline app across web, Android, and iOS platforms, with special focus on the offline-first emergency preparedness features that make this app unique.