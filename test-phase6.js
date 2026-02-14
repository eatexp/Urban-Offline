import CartridgePOIQueryEngine from './src/services/maps/CartridgePOIQueryEngine.js';
import { MapCartridgeService } from './src/services/maps/MapCartridgeService.js';

console.log('='.repeat(60));
console.log('PHASE 6 VERIFICATION TESTS');
console.log('='.repeat(60));

const engine = CartridgePOIQueryEngine.getInstance();

// Script 2: Verify Geolocation Search
console.log('\n--- Script 2: Geolocation Search ---');
console.log('Testing Nearby (London center)...');
const nearby = engine.getNearbyPOIs([-0.12, 51.50], 2); // 2km radius
console.log('Nearby POIs within 2km:', nearby.map(p => `${p.name} (${p.distance.toFixed(2)}km)`));
// Expected: St Thomas, Waterloo, etc. sorted by distance

// Script 3: Verify Map Cartridge Service Validation
console.log('\n--- Script 3: Map Cartridge Service Validation ---');
const allCartridges = MapCartridgeService.getAllCartridges();
console.log('All Cartridges:', allCartridges.length, 'cartridges found');
console.log('Cartridge IDs:', allCartridges.map(c => c.id));
console.log('POI counts:', allCartridges.map(c => ({ id: c.id, poiCount: c.pois?.length || 0 })));

// Check POI arrays exist
allCartridges.forEach(cartridge => {
    console.log(`\n${cartridge.id}:`);
    if (cartridge.pois && Array.isArray(cartridge.pois)) {
        console.log(`  ✓ Has ${cartridge.pois.length} POIs`);
        cartridge.pois.forEach(poi => {
            console.log(`    - ${poi.name} (${poi.type}) @ [${poi.coords.join(', ')}]`);
        });
    } else {
        console.log('  ✗ No POIs array');
    }
});

console.log('\n' + '='.repeat(60));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(60));