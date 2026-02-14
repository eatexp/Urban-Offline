# Role
You are an expert QA Engineer and Developer.
Your goal is to **VERIFY** the "Phase 8: Production Hardening" implementation.

# Context
We just implemented Phase 8, adding error boundaries, validation, and guards.
We need to run the **verification steps** defined in `implementation_plan.md`.

# Instructions
1.  **Open the Browser Console** in the app.
2.  **Run the following scripts** one by one and report the results.

## Script 1: Verify MapCartridgeService Validation
```javascript
// Import service dynamically
const MapCartridgeService = (await import('./src/services/maps/MapCartridgeService.js')).default;

// Test 1: Check Validated Cartridges
console.log('Validated Cartridges:', MapCartridgeService.VALIDATED_CARTRIDGES);

// Test 2: Search Sanitization
console.log('Search "london":', await MapCartridgeService.search('london'));
console.log('Search "london!!@#":', await MapCartridgeService.search('london!!@#')); // Should match london
console.log('Search empty:', await MapCartridgeService.search('   ')); // Should be empty array
```

## Script 2: Verify TransformersEngine Switch Guard
```javascript
const TransformersEngine = (await import('./src/services/ai/TransformersEngine.js')).default;
const engine = TransformersEngine.getInstance();
console.log('Starting concurrent switch test...');
Promise.all([
    engine.switchModel('HuggingFaceTB/SmolLM-360M'),
    engine.switchModel('Qwen/Qwen2.5-0.5B-Instruct')
]).then(() => console.log('Promise.all resolved'))
  .catch(e => console.error('Caught expected error:', e.message));
// Expected: One succeeds, one throws "Model switch already in progress"
```

## Script 3: Verify ContextManager Freeze
```javascript
const ContextManager = (await import('./src/services/context/ContextManager.js')).default;
const ctx = ContextManager.getInstance();
const state = ctx.getState();
console.log('Is State Frozen?', Object.isFrozen(state));
try {
    state.system = {}; // Try to mutate
    console.error('Mutation SUCCEEDED (This is BAD)');
} catch (e) {
    console.log('Mutation BLOCKED (This is GOOD):', e.message);
}
```

# Manual UI Tests
Perform these actions in the UI:
1.  **Map Card Boundary**: Temporarily add `throw new Error('Test')` to `MiniMapCard.jsx` and verify the fallback UI appears in chat.
2.  **Status Bar Boundary**: Temporarily add `throw new Error('Test')` to `AmbientStatusBar.jsx` and verify the fallback UI appears in the header.
3.  **Invalid Cartridge**: Add a dummy invalid cartridge to `MapCartridgeService.js` (e.g. invalid ID) and verify it logs a warning and is excluded.

# Output
Report the results of all tests.
- [ ] Script 1 Passed?
- [ ] Script 2 Passed?
- [ ] Script 3 Passed?
- [ ] Manual Tests Passed?

If any test fails, **STOP and FIX** the issue before proceeding.
