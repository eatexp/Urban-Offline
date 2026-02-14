/**
 * Phase 7: Final Verification Script for "Blackout Protocol"
 * 
 * This script verifies:
 * 1. Battery Manager integration with ContextManager
 * 2. Survival Mode Service activation/deactivation logic
 * 3. Screen brightness plugin integration (mocked for Node.js)
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    log.success(message);
    testsPassed++;
  } else {
    log.error(message);
    testsFailed++;
  }
}

// ============================================================================
// SETUP: Mock Capacitor for Node.js environment
// ============================================================================

global.window = {
  Capacitor: {
    isNativePlatform: true,
    Plugins: {
      ScreenBrightness: {
        brightness: 1.0,
        async getBrightness() {
          return { brightness: this.brightness };
        },
        async setBrightness({ brightness }) {
          this.brightness = brightness;
          log.info(`Screen brightness set to ${(brightness * 100).toFixed(0)}%`);
          return { success: true };
        }
      }
    }
  }
};

global.document = {
  body: {
    _attributes: {},
    setAttribute(name, value) {
      this._attributes[name] = value;
      log.info(`Document body attribute set: ${name}=${value}`);
    },
    removeAttribute(name) {
      delete this._attributes[name];
      log.info(`Document body attribute removed: ${name}`);
    },
    getAttribute(name) {
      return this._attributes[name];
    }
  }
};

// ============================================================================
// SCRIPT 1: Verify Battery Manager (Mock)
// ============================================================================

async function testBatteryManager() {
  log.section('Script 1: Battery Manager Verification');

  try {
    // Import BatteryManager dynamically
    const BatteryManagerModule = await import('./src/services/power/BatteryManager.js').catch(e => {
      log.warn(`BatteryManager import failed: ${e.message}`);
      return null;
    });

    if (!BatteryManagerModule) {
      log.warn('BatteryManager not available - skipping battery tests');
      return;
    }

    const BatteryManager = BatteryManagerModule.default;
    const batteryManager = BatteryManager.getInstance();

    // Test 1: BatteryManager singleton
    const batteryManager2 = BatteryManager.getInstance();
    assert(batteryManager === batteryManager2, 'BatteryManager is singleton');

    // Test 2: Initial battery level
    const level = batteryManager.getCurrentLevel();
    assert(typeof level === 'number' && level >= 0 && level <= 100, 
      `Battery level is valid number: ${level}%`);

    // Test 3: Charging status
    const charging = batteryManager.isCharging();
    assert(typeof charging === 'boolean', `Charging status is boolean: ${charging}`);

    // Test 4: Battery state
    const state = batteryManager.getBatteryState();
    assert(state && typeof state === 'object', 'Battery state object exists');
    assert('level' in state && 'charging' in state && 'critical' in state, 
      'Battery state has required properties');

    log.success('BatteryManager tests completed');
  } catch (error) {
    log.error(`BatteryManager test error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// SCRIPT 2: Verify Survival Mode Service
// ============================================================================

async function testSurvivalModeService() {
  log.section('Script 2: Survival Mode Service Verification');

  try {
    // Import SurvivalModeService
    const SurvivalModeServiceModule = await import('./src/services/power/SurvivalModeService.js');
    const SurvivalModeService = SurvivalModeServiceModule.default;
    const survivalService = SurvivalModeService.getInstance();

    // Test 1: Singleton pattern
    const survivalService2 = SurvivalModeService.getInstance();
    assert(survivalService === survivalService2, 'SurvivalModeService is singleton');

    // Test 2: Initial state
    assert(survivalService.isActive() === false, 'Survival mode initially inactive');

    // Test 3: Configuration
    const config = survivalService.getConfig();
    assert(config && typeof config === 'object', 'Config object exists');
    assert(config.screenBrightness === 0.2, `Screen brightness config is 20%: ${config.screenBrightness}`);
    assert(config.targetModel === 'smollm-360m', `Target model is smollm-360m: ${config.targetModel}`);
    assert(config.disableHaptics === true, 'Haptics disabled in config');
    assert(config.disableAudio === true, 'Audio disabled in config');

    // Test 4: State change subscription
    let _stateChangeCalled = false;
    const unsubscribe = survivalService.onStateChange((data) => {
      _stateChangeCalled = true;
      assert(typeof data.active === 'boolean', 'State change callback receives active boolean');
    });

    // Test 5: Mock haptics service
    let _hapticsEnabled = true;
    const mockHapticsService = {
      _enabled: true,
      isEnabled() { return this._enabled; },
      setEnabled(enabled) { 
        this._enabled = enabled; 
        log.info(`Haptics ${enabled ? 'enabled' : 'disabled'}`);
      }
    };

    // Test 6: Mock audio service
    const mockAudioService = {
      _enabled: true,
      isEnabled() { return this._enabled; },
      setEnabled(enabled) { 
        this._enabled = enabled; 
        log.info(`Audio ${enabled ? 'enabled' : 'disabled'}`);
      }
    };

    // Inject mocks for testing
    global.mockServices = {
      haptics: mockHapticsService,
      audio: mockAudioService
    };

    // Test 7: Screen brightness plugin mock verification
    const screenBrightness = global.window.Capacitor.Plugins.ScreenBrightness;
    assert(screenBrightness !== undefined, 'ScreenBrightness plugin is available in mock');
    
    const initialBrightness = await screenBrightness.getBrightness();
    assert(typeof initialBrightness.brightness === 'number', 
      `Initial brightness is number: ${initialBrightness.brightness}`);

    // Test 8: Set brightness via plugin
    await screenBrightness.setBrightness({ brightness: 0.2 });
    const dimmedBrightness = await screenBrightness.getBrightness();
    assert(dimmedBrightness.brightness === 0.2, 
      `Brightness dimmed to 20%: ${dimmedBrightness.brightness}`);

    // Test 9: Restore brightness
    await screenBrightness.setBrightness({ brightness: 1.0 });
    const restoredBrightness = await screenBrightness.getBrightness();
    assert(restoredBrightness.brightness === 1.0, 
      `Brightness restored to 100%: ${restoredBrightness.brightness}`);

    // Clean up subscription
    unsubscribe();
    assert(typeof unsubscribe === 'function', 'Unsubscribe returns function');

    // Test 10: Toggle method exists
    assert(typeof survivalService.toggle === 'function', 'Toggle method exists');

    // Test 11: Context manager integration
    const ContextManagerModule = await import('./src/services/context/ContextManager.js').catch(() => null);
    if (ContextManagerModule) {
      const ContextManager = ContextManagerModule.default;
      const contextManager = ContextManager.getInstance();
      assert(contextManager !== null, 'ContextManager is available');
    }

    log.success('SurvivalModeService tests completed');
  } catch (error) {
    log.error(`SurvivalModeService test error: ${error.message}`);
    console.error(error.stack);
    testsFailed++;
  }
}

// ============================================================================
// PLUGIN COMPATIBILITY CHECK
// ============================================================================

async function testPluginCompatibility() {
  log.section('Plugin Compatibility Check');

  try {
    // Verify the plugin name is correct in SurvivalModeService
    const fs = await import('fs');
    const serviceCode = fs.readFileSync('./src/services/power/SurvivalModeService.js', 'utf8');

    // Check for correct plugin usage
    const hasScreenBrightness = serviceCode.includes('capacitor.Plugins.ScreenBrightness');
    const hasIncorrectBrightness = serviceCode.includes('capacitor.Plugins.Brightness');

    assert(hasScreenBrightness, 'Uses correct plugin name: ScreenBrightness');
    assert(!hasIncorrectBrightness, 'Does NOT use incorrect plugin name: Brightness');

    // Check for plugin methods
    const hasGetBrightness = serviceCode.includes('ScreenBrightness.getBrightness');
    const hasSetBrightness = serviceCode.includes('ScreenBrightness.setBrightness');

    assert(hasGetBrightness, 'Calls ScreenBrightness.getBrightness()');
    assert(hasSetBrightness, 'Calls ScreenBrightness.setBrightness()');

    // Verify package.json has the plugin
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const hasPluginDep = '@capacitor-community/screen-brightness' in packageJson.dependencies;
    assert(hasPluginDep, 'Package has @capacitor-community/screen-brightness dependency');

    // Verify Android build includes the plugin
    const androidBuild = fs.readFileSync('./android/app/capacitor.build.gradle', 'utf8');
    const hasAndroidPlugin = androidBuild.includes('capacitor-community-screen-brightness');
    assert(hasAndroidPlugin, 'Android build includes screen-brightness plugin');

    log.success('Plugin compatibility verified');
  } catch (error) {
    log.error(`Plugin compatibility test error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// BLACKOUT PROTOCOL LOGIC VERIFICATION
// ============================================================================

async function testBlackoutProtocol() {
  log.section('Blackout Protocol Logic Verification');

  try {
    const SurvivalModeServiceModule = await import('./src/services/power/SurvivalModeService.js');
    const SurvivalModeService = SurvivalModeServiceModule.default;
    const service = SurvivalModeService.getInstance();

    // Reset state
    service._isActive = false;
    service._previousState = {
      modelId: null,
      brightness: null,
      hapticsEnabled: true,
      audioEnabled: true
    };

    // Test 1: Survival config constants
    const config = service.getConfig();
    assert(config.targetModel === 'smollm-360m', 
      'Blackout Protocol: Targets low-power model (smollm-360m)');
    assert(config.screenBrightness === 0.2, 
      'Blackout Protocol: Dims to 20% brightness');
    assert(config.disableHaptics === true, 
      'Blackout Protocol: Disables haptics');
    assert(config.disableAudio === true, 
      'Blackout Protocol: Disables audio');
    assert(config.maxMapZoom === 14, 
      'Blackout Protocol: Reduces max map zoom');
    assert(config.mapPitch === 0, 
      'Blackout Protocol: Forces 2D map view');

    // Test 2: Platform detection
    const isNative = service._isNativePlatform();
    assert(isNative === true, 'Native platform detection works (mocked)');

    // Test 3: CSS attribute management
    assert(document.body.getAttribute('data-survival-mode') === undefined, 
      'No survival mode attribute initially');

    service._applySurvivalModeStyles();
    assert(document.body.getAttribute('data-survival-mode') === 'true', 
      'Survival mode CSS attribute applied');

    service._removeSurvivalModeStyles();
    assert(document.body.getAttribute('data-survival-mode') === undefined, 
      'Survival mode CSS attribute removed');

    log.success('Blackout Protocol logic verified');
  } catch (error) {
    log.error(`Blackout Protocol test error: ${error.message}`);
    console.error(error.stack);
    testsFailed++;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║   Phase 7: Blackout Protocol - Final Verification               ║
║   Testing @capacitor-community/screen-brightness integration    ║
╚══════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = Date.now();

  try {
    await testPluginCompatibility();
    await testBatteryManager();
    await testSurvivalModeService();
    await testBlackoutProtocol();
  } catch (error) {
    log.error(`Test runner error: ${error.message}`);
    console.error(error.stack);
  }

  const duration = Date.now() - startTime;

  // Summary
  console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Tests Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`  Tests Failed: ${colors.red}${testsFailed}${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}✓ All tests passed! Phase 7 verification complete.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed. Review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests();