# Role
You are an expert QA Engineer.
Your goal is to **VERIFY** the "Phase 5: Native Polish & Haptics" implementation.

# Context
We just implemented Phase 5, adding procedural audio and haptic signatures.
We need to run the **verification steps** defined in `implementation_plan.md`.

# Instructions
1.  **Open the Browser Console** in the app.
2.  **Run the following scripts** one by one and listen/feel for results.
    *(Note: Haptics will only work on a native device, but the script should run without error in the browser).*

## Script 1: Verify Audio Service (Browser + Native)
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

## Script 2: Verify Signature Engine (Browser + Native)
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

## Script 3: Verify Toggle Switch
```javascript
const engine = (await import('./src/services/haptics/TactileSignatureEngine.js')).default.getInstance();
console.log('Disabling engine...');
engine.setEnabled(false);
await engine.fire('ai:complete'); // Should be silent/still
console.log('Enabling engine...');
engine.setEnabled(true);
await engine.fire('ai:complete'); // Should play/vibrate
```

# Manual UI Tests
1.  **Chat**: Ask the AI a question. Verify "thinking" sound (scan-sweep) loops while generating, and "complete" sound plays when done.
2.  **Map**: If available, load a new cartridge or jump to a location. Verify feedback.
3.  **Backgrounding**: Switch tabs/apps while audio is playing. Verify it stops/resumes correctly.

# Output
Report the results.
- [ ] Script 1 (Audio) functionality?
- [ ] Script 2 (Signatures) functionality?
- [ ] UI Integration (AI Chat) works?
- [ ] No console errors?

If successful, we are ready for **Phase 6**.
