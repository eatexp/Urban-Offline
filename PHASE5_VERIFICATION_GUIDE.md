# Phase 5 Verification Guide - Native Polish & Haptics

**Created**: 2026-02-13  
**Status**: Ready for Testing  
**App URL**: http://localhost:5173/

---

## ✅ Pre-Check: Development Server

The dev server is running at: **http://localhost:5173/**

Open this URL in your browser, then press **F12** to open Developer Console.

---

## 🧪 Verification Scripts

Run these scripts **one by one** in the browser console.

### Script 1: Verify Audio Service (Browser + Native)

**Purpose**: Test all 5 procedural audio sounds

```javascript
// Import service dynamically
const TacticalAudioService = (await import('./src/services/audio/TacticalAudioService.js')).default.getInstance();

console.log('Testing Audio...');
const sounds = ['confirm-tone', 'alert-ping', 'error-buzz', 'lock-on'];

for (const sound of sounds) {
    console.log(`Playing: ${sound}`);
    await TacticalAudioService.play(sound);
    await new Promise(r => setTimeout(r, 800)); // Wait between sounds
}

console.log('Testing Loop (3 seconds)...');
await TacticalAudioService.startLoop('scan-sweep');
await new Promise(r => setTimeout(r, 3000));
await TacticalAudioService.stopLoop('scan-sweep');
console.log('Audio Test Complete');
```

**Expected Results**:
- ✅ You should hear 4 distinct tones (confirm, alert, error, lock-on)
- ✅ Scan-sweep loop should play for 3 seconds with frequency ramp
- ✅ No console errors
- ✅ "Audio Test Complete" message appears

---

### Script 2: Verify Signature Engine (Browser + Native)

**Purpose**: Test haptic signatures (audio will play on web, haptics only on native device)

```javascript
const TactileSignatureEngine = (await import('./src/services/haptics/TactileSignatureEngine.js')).default.getInstance();

console.log('Testing Haptic Signatures...');
// These will trigger audio + haptics (if supported)
await TactileSignatureEngine.fire('ai:complete');
await new Promise(r => setTimeout(r, 1000));

await TactileSignatureEngine.fire('alert:emergency');
await new Promise(r => setTimeout(r, 2000));

await TactileSignatureEngine.fire('cartridge:load');
console.log('Signature Test Complete');
```

**Expected Results**:
- ✅ You should hear 3 audio signatures (confirm-tone, alert-ping, confirm-tone)
- ✅ On native device: Feel 3 distinct vibration patterns
- ✅ No console errors
- ✅ "Signature Test Complete" message appears

---

### Script 3: Verify Toggle Switch

**Purpose**: Test enable/disable functionality

```javascript
const engine = (await import('./src/services/haptics/TactileSignatureEngine.js')).default.getInstance();
console.log('Disabling engine...');
engine.setEnabled(false);
await engine.fire('ai:complete'); // Should be silent/still
console.log('Enabling engine...');
engine.setEnabled(true);
await engine.fire('ai:complete'); // Should play/vibrate
console.log('Toggle Test Complete');
```

**Expected Results**:
- ✅ First `fire('ai:complete')` should be **silent** (disabled)
- ✅ Second `fire('ai:complete')` should **play audio** (enabled)
- ✅ No console errors

---

## 🖱️ Manual UI Tests

### Test 4: AI Chat Integration

1. **Navigate**: Click on the "AI Emergency Assistant" card at the bottom
2. **Action**: Ask a question (e.g., "What should I do in an earthquake?")
3. **Expected**:
   - ✅ Scan-sweep loop plays **while AI is thinking**
   - ✅ Scan-sweep stops when AI completes
   - ✅ Confirm-tone plays when response is ready
   - ✅ No audio glitches or overlaps

### Test 5: Map Cartridge Load (if available)

1. **Navigate**: Click on "Map" tab
2. **Action**: Load a cartridge (if available)
3. **Expected**:
   - ✅ Cartridge load signature plays (haptic + confirm-tone)
   - ✅ Feedback feels responsive

### Test 6: Background Audio Lifecycle

1. **Action**: Trigger audio (run Script 1), then switch to another browser tab
2. **Expected**:
   - ✅ Audio pauses/suspends automatically
   - ✅ When you switch back, AudioContext resumes
   - ✅ No "AudioContext suspended" errors in console

---

## 📋 Verification Checklist

Copy this to your report:

```
Phase 5 Verification Results
============================

Script 1: Audio Service
- [ ] All 4 sounds played correctly (confirm-tone, alert-ping, error-buzz, lock-on)
- [ ] Scan-sweep loop played for 3 seconds
- [ ] No console errors
- [ ] Status: _______________

Script 2: Signature Engine
- [ ] All 3 signatures fired (ai:complete, alert:emergency, cartridge:load)
- [ ] Audio played correctly
- [ ] Haptics worked on native device (or N/A for web)
- [ ] No console errors
- [ ] Status: _______________

Script 3: Toggle Switch
- [ ] Disabled state prevented audio/haptics
- [ ] Enabled state restored functionality
- [ ] No console errors
- [ ] Status: _______________

UI Integration
- [ ] AI Chat: Thinking loop plays during generation
- [ ] AI Chat: Complete tone plays when done
- [ ] Map: Cartridge load feedback works (or N/A)
- [ ] Background: Audio suspends/resumes correctly
- [ ] Status: _______________

Overall Assessment
- [ ] All tests passed
- [ ] Minor issues (specify): _______________
- [ ] Major issues (specify): _______________
- [ ] Ready for Phase 6: YES / NO
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch module"
**Solution**: Make sure paths use relative imports with `./` prefix

### Issue: "AudioContext suspended"
**Solution**: User interaction required first. Click anywhere on the page, then run scripts.

### Issue: No audio heard
**Solution**: 
1. Check system volume
2. Check browser isn't muted
3. Try with headphones
4. Check browser console for autoplay policy errors

### Issue: Haptics not working
**Solution**: This is expected on web browsers. Haptics only work on native iOS/Android devices via Capacitor.

---

## 🚀 Next Steps

Once verification is complete:

1. ✅ **If all tests pass**: Create PHASE5_VERIFICATION_REPORT.md with results
2. ✅ **If issues found**: Document them and determine if blocking
3. ✅ **When ready**: Proceed to Phase 6 (Real-Time Sync & PWA)

---

## 📝 Notes

- Audio uses Web Audio API (zero external files)
- Haptics use `@capacitor/haptics` (already in dependencies)
- Both services are singletons with lazy initialization
- All feedback is non-critical (silent failures for accessibility)
- AudioContext auto-suspends on background to save battery

---

**Good luck with testing! 🎯**
