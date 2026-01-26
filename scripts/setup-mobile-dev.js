#!/usr/bin/env node

/**
 * Mobile Development Setup Script
 * Automates the setup process for iOS and Android development
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Setting up Urban-Offline mobile development environment...\n');

// Helper function to execute commands
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      cwd: projectRoot,
      ...options 
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

// Helper function to check if command exists
function commandExists(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check prerequisites
function checkPrerequisites() {
  console.log('📋 Checking prerequisites...\n');
  
  const checks = [
    { name: 'Node.js', command: 'node --version', required: true },
    { name: 'npm', command: 'npm --version', required: true },
    { name: 'Capacitor CLI', command: 'npx cap --version', required: true },
    { name: 'Android Studio', command: 'which android-studio || where android-studio', required: false },
    { name: 'Xcode', command: 'xcodebuild -version', required: false, platform: 'darwin' }
  ];

  let allGood = true;
  
  checks.forEach(check => {
    if (check.platform && process.platform !== check.platform) {
      console.log(`⏭️  Skipping ${check.name} (platform specific)`);
      return;
    }
    
    if (commandExists(check.command)) {
      console.log(`✅ ${check.name} is installed`);
    } else {
      if (check.required) {
        console.log(`❌ ${check.name} is required but not found`);
        allGood = false;
      } else {
        console.log(`⚠️  ${check.name} is optional but not found`);
      }
    }
  });

  if (!allGood) {
    console.log('\n❌ Please install the missing prerequisites and try again.');
    process.exit(1);
  }
  
  console.log('\n✅ All prerequisites satisfied!\n');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...\n');
  exec('npm install');
  console.log('\n✅ Dependencies installed!\n');
}

// Build the web app
function buildWebApp() {
  console.log('🔨 Building web application...\n');
  exec('npm run build');
  console.log('\n✅ Web app built successfully!\n');
}

// Add native platforms
function addNativePlatforms() {
  console.log('📱 Adding native platforms...\n');
  
  // Check if platforms already exist
  const hasAndroid = existsSync(join(projectRoot, 'android'));
  const hasiOS = existsSync(join(projectRoot, 'ios'));
  
  if (!hasAndroid) {
    console.log('Adding Android platform...');
    exec('npx cap add android');
  } else {
    console.log('✅ Android platform already exists');
  }
  
  if (process.platform === 'darwin' && !hasiOS) {
    console.log('Adding iOS platform...');
    exec('npx cap add ios');
  } else if (process.platform !== 'darwin') {
    console.log('⏭️  Skipping iOS (not on macOS)');
  } else {
    console.log('✅ iOS platform already exists');
  }
  
  console.log('\n✅ Native platforms added!\n');
}

// Sync Capacitor
function syncCapacitor() {
  console.log('🔄 Syncing Capacitor...\n');
  exec('npm run cap:sync');
  console.log('\n✅ Capacitor synced!\n');
}

// Create development configuration
function createDevConfig() {
  console.log('⚙️  Creating development configuration...\n');
  
  const devConfig = {
    server: {
      url: "http://localhost:5173",
      cleartext: true
    },
    plugins: {
      CapacitorSQLite: {
        iosDatabaseLocation: "Library/CapacitorDatabase"
      }
    }
  };
  
  const configPath = join(projectRoot, 'capacitor.config.dev.json');
  writeFileSync(configPath, JSON.stringify(devConfig, null, 2));
  
  console.log('✅ Created capacitor.config.dev.json for live reload development\n');
}

// Create development scripts
function createDevScripts() {
  console.log('📝 Creating development scripts...\n');
  
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  // Add development scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev:mobile": "vite --host 0.0.0.0 --port 5173",
    "mobile:android": "npm run build && npm run cap:sync && cd android && ./gradlew assembleDebug",
    "mobile:ios": "npm run build && npm run cap:sync && cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug build",
    "mobile:open:android": "npm run cap:open android",
    "mobile:open:ios": "npm run cap:open ios",
    "mobile:logs:android": "adb logcat | grep -i urban",
    "mobile:logs:ios": "xcrun simctl spawn booted log show --predicate 'process == \\\"UrbanOffline\\\"'",
    "mobile:install:dev": "node scripts/setup-mobile-dev.js",
    "mobile:live-reload": "cp capacitor.config.dev.json capacitor.config.json && npm run dev:mobile"
  };
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Added mobile development scripts to package.json\n');
}

// Create debugging guide
function createDebuggingGuide() {
  console.log('🐛 Creating debugging guide...\n');
  
  const debugGuide = `# Mobile Debugging Quick Reference

## Android Debugging
\`\`\`bash
# View app logs
npm run mobile:logs:android

# Connect to device
adb devices

# Install debug build
cd android && ./gradlew installDebug

# Inspect WebView
# Open Chrome → chrome://inspect/#devices
\`\`\`

## iOS Debugging
\`\`\`bash
# View app logs
npm run mobile:logs:ios

# List simulators
xcrun simctl list devices

# Install to simulator
xcrun simctl install booted path/to/app.app

# Inspect WebView
# Open Safari → Develop → [Device Name] → UrbanOffline
\`\`\`

## Live Reload Development
\`\`\`bash
# Start live reload server
npm run mobile:live-reload

# In another terminal, run on device
npm run mobile:open:android  # or :ios
\`\`\`
`;

  writeFileSync(join(projectRoot, 'MOBILE_DEBUGGING.md'), debugGuide);
  console.log('✅ Created MOBILE_DEBUGGING.md\n');
}

// Main setup function
async function setupMobileDevelopment() {
  try {
    console.log('🏗️  Urban-Offline Mobile Development Setup\n');
    console.log('=' .repeat(50) + '\n');
    
    checkPrerequisites();
    installDependencies();
    buildWebApp();
    addNativePlatforms();
    syncCapacitor();
    createDevConfig();
    createDevScripts();
    createDebuggingGuide();
    
    console.log('🎉 Mobile development setup complete!\n');
    console.log('📚 Next steps:');
    console.log('1. Review MOBILE_DEVELOPMENT_GUIDE.md for detailed instructions');
    console.log('2. Check MOBILE_DEBUGGING.md for debugging tips');
    console.log('3. Run: npm run mobile:open:android  # or :ios');
    console.log('4. Start development: npm run dev:mobile');
    console.log('\n🚀 Happy coding!\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMobileDevelopment();
}

export { setupMobileDevelopment };