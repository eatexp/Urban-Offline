/**
 * SectorResolver.js
 * 
 * Hybrid sector detection service that resolves geographic coordinates
 * to human-readable sector names.
 * 
 * Strategy:
 * 1. Primary: Check against MapCartridgeService registry (fast, offline)
 * 2. Secondary: Fallback to general region name based on coordinates
 * 
 * Used by OfflineMap to provide dynamic sector context to ContextManager.
 */

import { MapCartridgeService } from './MapCartridgeService';

/**
 * Bounding box definitions for registered cartridges
 * Format: [minLng, minLat, maxLng, maxLat]
 */
const CARTRIDGE_BOUNDS = {
    'map-london': [-0.5103, 51.2868, 0.3340, 51.6918], // Greater London
    'map-nyc': [-74.2591, 40.4774, -73.7004, 40.9176]  // NYC Metro
};

/**
 * General region fallbacks for coordinates outside cartridge bounds
 * These provide rough geographic context when no cartridge matches
 */
const GENERAL_REGIONS = [
    { name: 'United Kingdom', bounds: [-8.6493, 49.8826, 1.7632, 60.8606] },
    { name: 'United States', bounds: [-125.0, 24.3963, -66.9346, 49.3844] },
    { name: 'Europe', bounds: [-10.0, 35.0, 40.0, 71.0] },
    { name: 'North America', bounds: [-170.0, 15.0, -50.0, 72.0] },
    { name: 'Asia', bounds: [25.0, -10.0, 180.0, 80.0] }
];

/**
 * Check if a point is within a bounding box
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {Array} bounds - [minLng, minLat, maxLng, maxLat]
 * @returns {boolean}
 */
function isPointInBounds(lng, lat, bounds) {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/**
 * Resolve coordinates to a sector name
 * @param {Array} center - [lng, lat]
 * @returns {string} Sector name or 'Unknown'
 */
export function resolveSector(center) {
    if (!center || !Array.isArray(center) || center.length < 2) {
        return 'Unknown';
    }

    const [lng, lat] = center;

    // Validate coordinates
    if (typeof lng !== 'number' || typeof lat !== 'number' ||
        isNaN(lng) || isNaN(lat) ||
        lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return 'Unknown';
    }

    // Primary: Check cartridge registry
    for (const [cartridgeId, bounds] of Object.entries(CARTRIDGE_BOUNDS)) {
        if (isPointInBounds(lng, lat, bounds)) {
            const cartridge = MapCartridgeService.getCartridge(cartridgeId);
            if (cartridge) {
                // Extract clean name from title (e.g., "London, UK" -> "London")
                const name = cartridge.title.split(',')[0].trim();
                return name;
            }
        }
    }

    // Secondary: Check general regions
    for (const region of GENERAL_REGIONS) {
        if (isPointInBounds(lng, lat, region.bounds)) {
            return region.name;
        }
    }

    // Fallback: Return 'Unknown' if no match
    return 'Unknown';
}

/**
 * Get sector with confidence level
 * @param {Array} center - [lng, lat]
 * @returns {Object} { sector: string, confidence: 'high' | 'medium' | 'low' }
 */
export function resolveSectorWithConfidence(center) {
    if (!center || !Array.isArray(center) || center.length < 2) {
        return { sector: 'Unknown', confidence: 'low' };
    }

    const [lng, lat] = center;

    // Check cartridge registry (high confidence)
    for (const [cartridgeId, bounds] of Object.entries(CARTRIDGE_BOUNDS)) {
        if (isPointInBounds(lng, lat, bounds)) {
            const cartridge = MapCartridgeService.getCartridge(cartridgeId);
            if (cartridge) {
                const name = cartridge.title.split(',')[0].trim();
                return { sector: name, confidence: 'high' };
            }
        }
    }

    // Check general regions (medium confidence)
    for (const region of GENERAL_REGIONS) {
        if (isPointInBounds(lng, lat, region.bounds)) {
            return { sector: region.name, confidence: 'medium' };
        }
    }

    // Unknown (low confidence)
    return { sector: 'Unknown', confidence: 'low' };
}

/**
 * Cache for resolved sectors to avoid repeated lookups
 * Key: "lng,lat" (rounded to 4 decimals)
 * Value: { sector, timestamp }
 */
const sectorCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve sector with caching
 * @param {Array} center - [lng, lat]
 * @returns {string}
 */
export function resolveSectorCached(center) {
    if (!center || !Array.isArray(center) || center.length < 2) {
        return 'Unknown';
    }

    const [lng, lat] = center;

    // Create cache key (round to 4 decimals for ~11m precision)
    const cacheKey = `${lng.toFixed(4)},${lat.toFixed(4)}`;

    // Check cache
    const cached = sectorCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.sector;
    }

    // Resolve and cache
    const sector = resolveSector(center);
    sectorCache.set(cacheKey, { sector, timestamp: Date.now() });

    // Cleanup old entries (keep cache size reasonable)
    if (sectorCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of sectorCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                sectorCache.delete(key);
            }
        }
    }

    return sector;
}

/**
 * Clear the sector cache (useful for testing or manual refresh)
 */
export function clearSectorCache() {
    sectorCache.clear();
}

/**
 * Resolve cartridge metadata for a given location
 * @param {Array} center - [lng, lat]
 * @returns {Object|null} Cartridge object or null
 */
export function resolveCartridgeForSector(center) {
    if (!center || !Array.isArray(center) || center.length < 2) return null;
    const [lng, lat] = center;

    for (const [cartridgeId, bounds] of Object.entries(CARTRIDGE_BOUNDS)) {
        if (isPointInBounds(lng, lat, bounds)) {
            return MapCartridgeService.getCartridge(cartridgeId);
        }
    }
    return null;
}

