// scripts/test-native-platforms.js
// Checks native platform prerequisites and guides testing

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

function _checkCommand(command, args = ['--version']) {
    try {
        execSync(`${command} ${args.join(' ')}`, { 
            stdio: 'pipe',
            timeout: 5000 
        });
        return { available: true, error: null };
    } catch (_e) {
        return { available: false, error: _e.message };
    }
}

function checkDirectory(path) {
    return existsSync(path);
}

function analyzeNativePlatforms() {
    console.log('=== Urban-Offline Native Platform Testing Report ===\n');

    const report = {
        timestamp: new Date().toISOString(),
        prerequisites: {
            node: { available: false, version: null },
            npm: { available: false, version: null },
            capacitor: { available: false, version: null },
            xcode: { available: false, path: null },
            androidStudio: { available: false, path: null },
            iosSimulator: { available: false },
            androidEmulator: { available: false }
        },
        project: {
            capacitorConfig: false,
            nativeProjects: {
                ios: false,
                android: false
            }
        },
        recommendations: []
    };

    // Check Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
        report.prerequisites.node = { available: true, version: nodeVersion };
    } catch (e) {
        report.prerequisites.node = { available: false, error: e.message };
        report.recommendations.push('Install Node.js (LTS version recommended)');
    }

    // Check npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
        report.prerequisites.npm = { available: true, version: npmVersion };
    } catch (e) {
        report.prerequisites.npm = { available: false, error: e.message };
        report.recommendations.push('Install npm (comes with Node.js)');
    }

    // Check Capacitor CLI
    try {
        const capVersion = execSync('npx cap --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
        report.prerequisites.capacitor = { available: true, version: capVersion };
    } catch (e) {
        report.prerequisites.capacitor = { available: false, error: e.message };
        report.recommendations.push('Install Capacitor: npm install -g @capacitor/cli');
    }

    // Check Xcode (macOS only)
    if (process.platform === 'darwin') {
        const xcodePath = '/Applications/Xcode.app';
        if (checkDirectory(xcodePath)) {
            report.prerequisites.xcode = { available: true, path: xcodePath };
            
            // Check for iOS Simulator
            try {
                execSync('xcrun simctl list devices', { stdio: 'pipe', timeout: 5000 });
                report.prerequisites.iosSimulator = { available: true };
            } catch (_e) {
                report.prerequisites.iosSimulator = { available: false };
                report.recommendations.push('Install Xcode Command Line Tools: xcode-select --install');
            }
        } else {
            report.prerequisites.xcode = { available: false };
            report.recommendations.push('Install Xcode from Mac App Store for iOS development');
        }
    } else {
        report.prerequisites.xcode = { available: false, note: 'macOS required for iOS development' };
    }

    // Check Android Studio
    const androidPaths = [
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        join(process.env.HOME || process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk'),
        'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Android\\Sdk',
        join(process.env.HOME || '', 'Library', 'Android', 'sdk')
    ].filter(Boolean);

    let androidFound = false;
    for (const path of androidPaths) {
        if (checkDirectory(path)) {
            report.prerequisites.androidStudio = { available: true, path };
            androidFound = true;
            break;
        }
    }

    if (!androidFound) {
        report.prerequisites.androidStudio = { available: false };
        report.recommendations.push('Install Android Studio and set ANDROID_HOME environment variable');
    }

    // Check for Android emulator
    if (androidFound) {
        try {
            execSync('adb devices', { stdio: 'pipe', timeout: 5000 });
            report.prerequisites.androidEmulator = { available: true };
        } catch (_e) {
            report.prerequisites.androidEmulator = { available: false };
            report.recommendations.push('Start Android emulator or connect physical device');
        }
    }

    // Check project configuration
    const capacitorConfig = join(PROJECT_ROOT, 'capacitor.config.json');
    report.project.capacitorConfig = existsSync(capacitorConfig);

    if (report.project.capacitorConfig) {
        try {
            const config = JSON.parse(readFileSync(capacitorConfig, 'utf8'));
            console.log('Capacitor Config:', config.appId, config.appName);
        } catch (_e) {
            // Config parse failed
        }
    }

    // Check for native project directories
    const iosDir = join(PROJECT_ROOT, 'ios');
    const androidDir = join(PROJECT_ROOT, 'android');

    report.project.nativeProjects.ios = checkDirectory(iosDir);
    report.project.nativeProjects.android = checkDirectory(androidDir);

    if (!report.project.nativeProjects.ios && report.prerequisites.capacitor.available) {
        report.recommendations.push('Run: npm run cap:sync (creates iOS project if on macOS)');
    }

    if (!report.project.nativeProjects.android && report.prerequisites.capacitor.available) {
        report.recommendations.push('Run: npm run cap:sync (creates Android project)');
    }

    return report;
}

function printReport(report) {
    console.log('📱 NATIVE PLATFORM TESTING REPORT\n');

    console.log('Prerequisites:');
    console.log(`  Node.js: ${report.prerequisites.node.available ? '✅' : '❌'} ${report.prerequisites.node.version || ''}`);
    console.log(`  npm: ${report.prerequisites.npm.available ? '✅' : '❌'} ${report.prerequisites.npm.version || ''}`);
    console.log(`  Capacitor CLI: ${report.prerequisites.capacitor.available ? '✅' : '❌'} ${report.prerequisites.capacitor.version || ''}`);
    console.log(`  Xcode: ${report.prerequisites.xcode.available ? '✅' : '❌'} ${report.prerequisites.xcode.note || ''}`);
    console.log(`  iOS Simulator: ${report.prerequisites.iosSimulator.available ? '✅' : '❌'}`);
    console.log(`  Android Studio/SDK: ${report.prerequisites.androidStudio.available ? '✅' : '❌'}`);
    console.log(`  Android Emulator: ${report.prerequisites.androidEmulator.available ? '✅' : '❌'}\n`);

    console.log('Project Status:');
    console.log(`  Capacitor Config: ${report.project.capacitorConfig ? '✅' : '❌'}`);
    console.log(`  iOS Project: ${report.project.nativeProjects.ios ? '✅' : '❌'}`);
    console.log(`  Android Project: ${report.project.nativeProjects.android ? '✅' : '❌'}\n`);

    if (report.recommendations.length > 0) {
        console.log('📋 Next Steps:');
        report.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });
        console.log();
    }

    // Testing checklist
    console.log('🧪 Testing Checklist:\n');
    
    console.log('Storage Abstraction Layer:');
    console.log('  [ ] NativeStorage.js SQLite operations work on iOS');
    console.log('  [ ] NativeStorage.js SQLite operations work on Android');
    console.log('  [ ] Filesystem tile storage works on iOS');
    console.log('  [ ] Filesystem tile storage works on Android');
    console.log('  [ ] Platform detection (Capacitor.isNativePlatform()) works correctly\n');

    console.log('Search Functionality:');
    console.log('  [ ] NativeSearch.js FTS5 queries work on iOS');
    console.log('  [ ] NativeSearch.js FTS5 queries work on Android');
    console.log('  [ ] Search results match web implementation\n');

    console.log('UI Components:');
    console.log('  [ ] All pages render correctly on iOS');
    console.log('  [ ] All pages render correctly on Android');
    console.log('  [ ] Ink triage scripts work on native platforms');
    console.log('  [ ] Map component displays offline tiles\n');

    console.log('Offline Functionality:');
    console.log('  [ ] App works in airplane mode (iOS)');
    console.log('  [ ] App works in airplane mode (Android)');
    console.log('  [ ] Content loads from local database');
    console.log('  [ ] No network requests when offline\n');

    console.log('Performance:');
    console.log('  [ ] Cold start time <2s (measure on device)');
    console.log('  [ ] No memory leaks during extended use');
    console.log('  [ ] Battery usage acceptable\n');

    const canTest = 
        report.prerequisites.node.available &&
        report.prerequisites.npm.available &&
        report.prerequisites.capacitor.available &&
        (report.prerequisites.xcode.available || report.prerequisites.androidStudio.available);

    console.log(`\n📊 Status: ${canTest ? '✅ Ready for Testing' : '⚠️  Prerequisites Missing'}\n`);
}

async function saveReport(report) {
    const reportPath = join(PROJECT_ROOT, 'native-platform-report.json');
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to: native-platform-report.json`);
}

// Main execution
async function main() {
    const report = analyzeNativePlatforms();
    printReport(report);
    await saveReport(report);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});




