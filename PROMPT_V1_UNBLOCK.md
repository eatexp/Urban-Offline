# Urban-Offline V1.0 — UNBLOCK & CERTIFY PROTOCOL
## For: Claude Sonnet 4.6 | Priority: P0 → P3 Execution Ladder

---

## EXECUTIVE SUMMARY

**Current State:** V1.0 RC is feature-complete (Phases 1-8 implemented) but **BUILD IS BROKEN**.  
**Blocker:** `Navbar.jsx` imports `ImpactStyle` from `HapticsService.js` — export doesn't exist.  
**Goal:** Unblock build → Verify web tests → Setup Android CLI → Execute native certification.

**Status at Start:**
- Build: ❌ FAILING (export mismatch)
- Code Review Tests: 9/10 PASS
- Web Manual Test: 0/1 executed
- Native Tests: 0/4 executed
- Android Studio: ❌ Not installed

---

## P0: UNBLOCK THE BUILD (CRITICAL — DO FIRST)

### The Problem
```bash
npm run build
# ERROR: "ImpactStyle" is not exported by "src/services/HapticsService.js"
# File: src/components/Navbar.jsx:4:25
```

### Your Task
1. **Read** `src/services/HapticsService.js` — identify what IS exported
2. **Read** `src/components/Navbar.jsx` — see how `ImpactStyle` is being used
3. **Fix the mismatch** — either:
   - Option A: Add `ImpactStyle` export to HapticsService.js (if it's a valid haptic style)
   - Option B: Fix Navbar.jsx to import from correct source (e.g., `@capacitor/haptics`)
4. **Verify fix:**
   ```bash
   npm run build
   # Should produce dist/ with index.html and assets
   ```

### Success Criteria
- [ ] `npm run build` completes with 0 errors
- [ ] `dist/index.html` exists
- [ ] No "ImpactStyle" export errors in build log

---

## P1: WEB VERIFICATION (Test 11 — 5 Minutes)

Once build passes, execute the only pending web test:

### Test 11: Auto-Prompt at Critical Battery

```bash
# Terminal 1: Serve the build
npm run build
npx vite preview --port 4173

# Terminal 2: Open Chrome
# Navigate to http://localhost:4173
# Open DevTools → More Tools → Sensors → Battery
```

| Step | Action | Expected | Verify |
|------|--------|----------|--------|
| 11.1 | Set battery to 8% | Auto-prompt appears | ✓/✗ |
| 11.2 | Check prompt text | Shows "Critical Battery" warning | ✓/✗ |
| 11.3 | Click "Activate" | Survival mode activates (overlay appears) | ✓/✗ |
| 11.4 | Set battery to 8% again | Prompt reappears | ✓/✗ |
| 11.5 | Click "Dismiss" | Prompt closes | ✓/✗ |
| 11.6 | Set to 8% again | No prompt (dismissed until refresh) | ✓/✗ |

**Document results in this file:**
```
## Test 11 Results (ADD YOUR RESULTS)

| Step | Result | Notes |
|------|--------|-------|
| 11.1 | ✅/❌ | |
| 11.2 | ✅/❌ | |
| 11.3 | ✅/❌ | |
| 11.4 | ✅/❌ | |
| 11.5 | ✅/❌ | |
| 11.6 | ✅/❌ | |

**Result:** ✅ PASS / ❌ FAIL
```

---

## P2: ANDROID CLI ENVIRONMENT SETUP

**Constraints:** Windows 11, NO Android Studio GUI, CLI only.

### Step 2.1: Verify Android Studio Installation

```bash
# Check if Android Studio exists
where studio64.exe 2>nul || where studio.exe 2>nul

# Check ANDROID_HOME
echo %ANDROID_HOME%

# Check adb
adb --version
```

**If NOT installed:**
```powershell
# Download and install Android Studio (command-line approach):
# 1. Download from: https://developer.android.com/studio
# 2. Run installer with default settings
# 3. Ensure "Android SDK" and "Android Virtual Device" are checked

# Set environment variables (PowerShell as Admin):
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$path = [Environment]::GetEnvironmentVariable("Path","User")
[Environment]::SetEnvironmentVariable("Path", "$path;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin", "User")

# Restart terminal
```

### Step 2.2: Sync Capacitor Project

```bash
# Ensure web build is current
npm run build

# Sync Capacitor (copies web build to android/)
npx cap sync android

# Verify android/ directory has been updated
dir android\app\src\main\assets\public\
```

### Step 2.3: Build Debug APK (CLI Only)

```bash
cd android

# Build debug APK via Gradle wrapper (NO Android Studio GUI)
.\gradlew assembleDebug

# Verify output
dir app\build\outputs\apk\debug\app-debug.apk
```

**Expected:** Build succeeds, APK at `app/build/outputs/apk/debug/app-debug.apk`

### Step 2.4: Deploy to Device/Emulator

**Option A: Physical Device**
```bash
# Enable Developer Options + USB Debugging on device
# Connect USB, allow debugging prompt

# Verify device connected
adb devices

# Install APK
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Launch app
adb shell am start -n com.urbanoffline.app/.MainActivity
```

**Option B: Create & Use Emulator (CLI)**
```bash
# List available AVDs
emulator -list-avds

# If none exist, you MUST create via Android Studio GUI once:
# Tools → Device Manager → Create Device → Pixel 6 API 33

# Start emulator
emulator -avd Pixel_6_API_33

# Wait for boot, then install
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

### Success Criteria
- [ ] Android Studio installed
- [ ] `adb --version` returns version info
- [ ] `.\gradlew assembleDebug` succeeds
- [ ] `app-debug.apk` exists
- [ ] App installs on device/emulator via `adb install`
- [ ] App launches via `adb shell am start`

---

## P3: NATIVE FIELD TEST CERTIFICATION

Execute the 4 pending native tests. Document ALL results in this file.

### Test 2: BatteryManager — Native (Android)

| Step | Action | Expected | Result | Notes |
|------|--------|----------|--------|-------|
| 2.1 | App launches | No crashes | ⬜ | |
| 2.2 | Check AmbientStatusBar | Battery % visible | ⬜ | |
| 2.3 | Plug/unplug charger | Status updates | ⬜ | |
| 2.4 | Battery events | Fire correctly | ⬜ | |

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 5: Haptics Disable

| Step | Action | Expected | Result | Notes |
|------|--------|----------|--------|-------|
| 5.1 | Survival mode ON | No haptics | ⬜ | |
| 5.2 | Press buttons | Silent (no vibration) | ⬜ | |

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 7: Brightness Dim (Native Only)

| Step | Action | Expected | Result | Notes |
|------|--------|----------|--------|-------|
| 7.1 | Record brightness | _____% | ⬜ | |
| 7.2 | Activate survival | Dims to ~20% | ⬜ | |
| 7.3 | Verify dim | Visible dimming | ⬜ | |
| 7.4 | Deactivate | Restores | ⬜ | |

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 12: State Restoration

| State | Before | After Survival | Restored? | Notes |
|-------|--------|----------------|-----------|-------|
| AI Model | ______ | SmolLM-360M | ⬜ | |
| Haptics | ______ | Disabled | ⬜ | |
| Audio | ______ | Disabled | ⬜ | |
| Brightness | ______% | 20% | ⬜ | |

**Result:** ⬜ PASS / ⬜ FAIL

---

## COMMUNICATION PROTOCOL

**Report at EACH gate completion:**

### P0 Complete (Build Fixed)
```markdown
## P0: BUILD STATUS — ✅ FIXED
- Error: `ImpactStyle` export missing
- Fix: [Option A/B — describe what you did]
- Build: `npm run build` exits 0
- Output: `dist/index.html` verified
```

### P1 Complete (Test 11)
```markdown
## P1: TEST 11 — ✅ PASS / ❌ FAIL
- Browser: [Chrome version]
- Results: [Fill in table above]
- Issues: [Any problems found]
```

### P2 Complete (Android CLI Setup)
```markdown
## P2: ANDROID CLI — ✅ READY
- Android Studio: Installed at [path]
- ADB: [version]
- APK Build: ✅ Success
- Device/Emulator: [Device model or emulator name]
- App Launch: ✅ Launches via adb
```

### P3 Complete (Native Certification)
```markdown
## P3: NATIVE CERTIFICATION — ✅ COMPLETE
- Test 2: [PASS/FAIL — notes]
- Test 5: [PASS/FAIL — notes]
- Test 7: [PASS/FAIL — notes]
- Test 12: [PASS/FAIL — notes]
- Overall: [V1.0 CERTIFIED / NEEDS FIXES]
```

---

## CRITICAL CONSTRAINTS (DO NOT VIOLATE)

1. **NO Xcode/iOS work** — Windows only, no macOS access
2. **NO Android Studio GUI workflows** — CLI only (`.\gradlew`, `adb`)
3. **NO `pod install` or iOS suggestions**
4. **Web preview first** — Test on web before native when possible
5. **Auto-correct syntax errors** — Don't ask, just fix and report

---

## DECISION GATES

### Gate 1: After P0 (Build Fixed)
- ✅ **Proceed to P1** if build succeeds
- ❌ **Stop and report** if build still fails after 3 attempts

### Gate 2: After P1 (Test 11)
- ✅ **Proceed to P2** regardless of Test 11 result (document failures)
- ❌ **Stop only** if build breaks again

### Gate 3: After P2 (Android CLI)
- ✅ **Proceed to P3** if APK builds and installs
- ❌ **Stop and report** if:
  - Gradle build fails persistently
  - ADB cannot connect to device/emulator
  - App crashes on launch (need `adb logcat` output)

### Gate 4: After P3 (Native Tests)
- ✅ **V1.0 CERTIFIED** if all 4 tests pass
- ⚠️ **CONDITIONAL CERTIFICATION** if 3/4 pass (document the failure)
- ❌ **NOT CERTIFIED** if 2 or more tests fail (create fix plan)

---

## DEBUGGING COMMANDS

```bash
# App crashes on launch?
adb logcat *:E | findstr "AndroidRuntime"

# Check if app is installed
adb shell pm list packages | findstr urbanoffline

# Force stop app
adb shell am force-stop com.urbanoffline.app

# Clear app data
adb shell pm clear com.urbanoffline.app

# Check device battery level via ADB
adb shell dumpsys battery

# Screenshot (if visual check needed)
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

---

## SUCCESS CRITERIA SUMMARY

| Phase | Task | Success Metric |
|-------|------|----------------|
| P0 | Fix build | `npm run build` exits 0 |
| P1 | Test 11 | Results documented in file |
| P2 | Android CLI | APK installs & launches |
| P3 | Native tests | 4 tests executed, results logged |

**End Goal:** V1.0 certified for Android or documented blockers for next iteration.

---

*"Field testing separates prototypes from production. Execute the protocol."*

**Document Version:** 4.0 (Unblock & Certify Edition)  
**Target:** V1.0 Android Certification  
**Start Date:** 2026-02-20