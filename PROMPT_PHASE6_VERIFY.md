# Role
You are an expert QA Engineer.
Your goal is to **VERIFY** the "Phase 6: AI-Enhanced Cartridges" implementation.

# Context
We just implemented Phase 6, adding POI search, enhanced validation, and enriched `<<MAP:>>` tags.
We need to run the **verification steps** defined in `implementation_plan.md`.

# Instructions
1.  **Open the Browser Console** in the app.
2.  **Run the following scripts** one by one.

## Script 1: Verify POI Search Engine
```javascript
// Import engine dynamically
const engine = (await import('./src/services/maps/CartridgePOIQueryEngine.js')).default.getInstance();

console.log('Testing Exact Match...');
const hospital = engine.queryPOI('hospital');
console.log('Hospital Result:', hospital);
// Expected: St Thomas' Hospital (London) or Bellevue (NYC)

console.log('Testing Fuzzy Match...');
const train = engine.queryPOI('train station');
console.log('Train Result:', train);
// Expected: Waterloo or Penn Station

console.log('Testing Type Filter...');
const landmarks = engine.getPOIsByType('landmark');
console.log('Landmarks:', landmarks.map(p => p.name));
// Expected: Tower Bridge, Brooklyn Bridge, etc.
```

## Script 2: Verify Geolocation Search
```javascript
const engine = (await import('./src/services/maps/CartridgePOIQueryEngine.js')).default.getInstance();

// search near London center
console.log('Testing Nearby (London)...');
const nearby = engine.getNearbyPOIs([-0.12, 51.50], 2); // 2km radius
console.log('Nearby POIs:', nearby.map(p => `${p.name} (${p.distance.toFixed(2)}km)`));
// Expected: St Thomas, Waterloo, etc. sorted by distance
```

## Script 3: Verify Map Cartridge Service Validation
```javascript
const service = (await import('./src/services/maps/MapCartridgeService.js')).default;
console.log('All Cartridges:', service.getAllCartridges());
// Expected: Array including map-london and map-nyc, both with 'pois' array
```

# Manual UI Tests
1.  **Chat**: Ask "Where is the hospital?".
    *   **Verify**: AI responds with a green "POI LOCATED" card showing St Thomas' Hospital (or Bellevue).
    *   **Verify**: Map jumps to specific coords (zoom 16).
2.  **Chat**: Ask "Show me London".
    *   **Verify**: AI responds with cyan "SECTOR ACQUIRED" card.
    *   **Verify**: Map jumps to sector center (zoom 14).
3.  **Chat**: Ask "Find Waterloo Station".
    *   **Verify**: Transport icon appears on the card.

# Output
Report the results.
- [ ] Script 1 (Search) passed?
- [ ] Script 2 (Geo) passed?
- [ ] Script 3 (Validation) passed?
- [ ] UI Tests passed?

If successful, we are ready for **Phase 7**.
