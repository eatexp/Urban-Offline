# Role
You are an expert QA Engineer.
Your goal is to **VERIFY** the "Phase 7: Offline Survival Mode" implementation.

# Context
Phase 7 is implemented. We need to verify the "Blackout Protocol".
This involves checking battery monitoring, style overrides, and functionality disabling.

# Instructions
1.  **Open the Browser Console** in the app.
2.  **Run the following scripts** one by one.

## Script 1: Verify Battery Manager (Mock)
```javascript
// Import service dynamically
const BatteryManager = (await import('./src/services/power/BatteryManager.js')).default.getInstance();
const ContextManager = (await import('./src/services/context/ContextManager.js')).default.getInstance();

console.log('Current Battery:', BatteryManager.getCurrentLevel() + '%', BatteryManager.isCharging() ? '(Charging)' : '');

// Test Listener via ContextManager (BatteryManager emits to Context)
const unsubscribe = ContextManager.subscribe((state) => {
    console.log('Context Update (Battery):', state.device.battery, state.device.batteryState);
});

// Mock Critical Level (if method available or via event simulation)
// Note: Web API is read-only, so we mostly verify we are reading correct values
console.log('Initial State:', BatteryManager.getBatteryState());

// Clean up listener after 30 seconds
setTimeout(() => {
    unsubscribe();
    console.log('Test Listener removed.');
}, 30000);
```

## Script 2: Verify Survival Mode Service
```javascript
const SurvivalModeService = (await import('./src/services/power/SurvivalModeService.js')).default.getInstance();

console.log('Activating Survival Mode...');
await SurvivalModeService.activate();
console.log('Active?', SurvivalModeService.isActive);

// Verify side effects manually:
// 1. Is Haptics disabled?
const haptics = (await import('./src/services/haptics/TactileSignatureEngine.js')).default.getInstance();
console.log('Haptics Enabled?', haptics.isEnabled()); // Should be false

// 2. Is Audio disabled?
const audio = (await import('./src/services/audio/TacticalAudioService.js')).default.getInstance();
console.log('Audio Enabled?', audio.isEnabled()); // Should be false

console.log('Deactivating Survival Mode...');
await SurvivalModeService.deactivate();
console.log('Active?', SurvivalModeService.isActive);
console.log('Haptics Restored?', haptics.isEnabled()); // Should be true
```

# Manual UI Tests
1.  **Toggle**: Open AmbientStatusBar (top right), click "Activate Survival Mode".
    *   **Verify**: UI loses blurring/transparency (High Contrast).
    *   **Verify**: Sticky overlay appears ("⚡ SURVIVAL MODE").
    *   **Verify**: Map enters flat/low-res mode (if visible).
2.  **Navigation**: Navigate around.
    *   **Verify**: Animations are disabled.
3.  **Deactivate**: Click "Exit" on the overlay.
    *   **Verify**: UI returns to normal (Blur/transparency restored).

# Output
Report the results.
- [ ] Script 1 (Battery) operational?
- [ ] Script 2 (Service) logic correct?
- [ ] Manual Toggle works?
- [ ] CSS Overrides applied correctly?

If successful, **Version 1.0 is Implementation Complete**.
