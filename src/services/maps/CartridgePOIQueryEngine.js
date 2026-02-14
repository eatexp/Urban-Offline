/**
 * CartridgePOIQueryEngine
 * 
 * Search engine for Points of Interest (POIs) within map cartridges.
 * Provides fuzzy matching, proximity search, and type filtering.
 * 
 * Scoring Algorithm:
 *   score = (tagMatchCount / totalKeywords) * 0.6
 *         + (priorityWeight) * 0.3              // critical=1.0, high=0.7, normal=0.4
 *         + (exactNameMatch ? 0.1 : 0)
 * 
 * Confidence threshold: 0.5 (POIs scoring below this are not returned)
 */

import { MapCartridgeService } from './MapCartridgeService.js';

// Priority weights for search ranking
const PRIORITY_WEIGHTS = {
    critical: 1.0,
    high: 0.7,
    normal: 0.4
};

class CartridgePOIQueryEngine {
    constructor() {
        this._instance = null;
    }

    /**
     * Query POIs across cartridges using fuzzy keyword matching
     * 
     * @param {string} keywords - Search query (e.g., "hospital", "train station")
     * @param {string} [cartridgeId] - Optional: restrict to specific cartridge
     * @returns {{ poi, cartridge, confidence } | null}
     * 
     * @example
     * const result = queryPOI("hospital");
     * // Returns: { poi: {...}, cartridge: {...}, confidence: 0.92 }
     */
    queryPOI(keywords, cartridgeId = null) {
        // Input validation
        if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
            return null;
        }

        // Sanitize and split keywords
        const sanitized = keywords.trim().toLowerCase();
        const keywordArray = sanitized.split(/\s+/);

        // Get cartridges to search
        let cartridges;
        if (cartridgeId) {
            const singleCartridge = MapCartridgeService.getCartridge(cartridgeId);
            cartridges = singleCartridge ? [singleCartridge] : [];
        } else {
            cartridges = MapCartridgeService.getAllCartridges();
        }

        let bestMatch = null;
        let bestScore = 0;

        // Search algorithm
        cartridges.forEach(cartridge => {
            // Skip if no POIs in this cartridge
            if (!cartridge.pois || !Array.isArray(cartridge.pois)) {
                return;
            }

            cartridge.pois.forEach(poi => {
                // Count tag matches
                let tagMatchCount = 0;
                keywordArray.forEach(keyword => {
                    if (poi.tags.some(tag => tag.toLowerCase().includes(keyword))) {
                        tagMatchCount++;
                    }
                });

                // Check exact name match
                const exactNameMatch = poi.name.toLowerCase() === sanitized;

                // Get priority weight
                const priorityWeight = PRIORITY_WEIGHTS[poi.priority] || 0;

                // Calculate score
                const score = 
                    (tagMatchCount / keywordArray.length) * 0.6 +
                    priorityWeight * 0.3 +
                    (exactNameMatch ? 0.1 : 0);

                // Track best match
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        poi,
                        cartridge,
                        confidence: score
                    };
                }
            });
        });

        // Return result only if above confidence threshold
        return bestScore > 0.5 ? bestMatch : null;
    }

    /**
     * Calculate Haversine distance between two coordinates
     * 
     * @private
     * @param {[number, number]} coords1 - [lon, lat]
     * @param {[number, number]} coords2 - [lon, lat]
     * @returns {number} Distance in kilometers
     */
    _haversineDistance(coords1, coords2) {
        const EARTH_RADIUS_KM = 6371;

        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;

        // Convert to radians
        const toRad = (deg) => deg * (Math.PI / 180);
        const lat1Rad = toRad(lat1);
        const lat2Rad = toRad(lat2);
        const deltaLatRad = toRad(lat2 - lat1);
        const deltaLonRad = toRad(lon2 - lon1);

        // Haversine formula
        const a = 
            Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Find POIs within radius of coordinates
     * 
     * @param {[number, number]} coords - Center point [lon, lat]
     * @param {number} radiusKm - Search radius in kilometers
     * @param {string} [type] - Optional POI type filter
     * @returns {Array<POI>} Sorted by distance (nearest first)
     * 
     * @example
     * const pois = getNearbyPOIs([-0.12, 51.50], 2, "hospital");
     * // Returns hospitals within 2km, sorted by distance
     */
    getNearbyPOIs(coords, radiusKm, type = null) {
        // Input validation
        if (!Array.isArray(coords) || coords.length !== 2) {
            console.warn('[CartridgePOIQueryEngine] Invalid coords for getNearbyPOIs');
            return [];
        }

        if (typeof radiusKm !== 'number' || radiusKm <= 0) {
            console.warn('[CartridgePOIQueryEngine] Invalid radius for getNearbyPOIs');
            return [];
        }

        // Get all POIs from all cartridges
        const allPOIs = [];
        const cartridges = MapCartridgeService.getAllCartridges();

        cartridges.forEach(cartridge => {
            if (cartridge.pois && Array.isArray(cartridge.pois)) {
                cartridge.pois.forEach(poi => {
                    allPOIs.push({
                        ...poi,
                        cartridgeId: cartridge.id,
                        cartridgeTitle: cartridge.title
                    });
                });
            }
        });

        // Filter by distance and type
        const poisWithDistance = allPOIs
            .map(poi => {
                const distance = this._haversineDistance(coords, poi.coords);
                return { ...poi, distance };
            })
            .filter(poi => {
                // Distance filter
                if (poi.distance > radiusKm) return false;
                // Type filter (if provided)
                if (type && poi.type !== type.toLowerCase()) return false;
                return true;
            });

        // Sort by distance (nearest first)
        poisWithDistance.sort((a, b) => a.distance - b.distance);

        return poisWithDistance;
    }

    /**
     * Get all POIs of a specific type
     * 
     * @param {string} type - POI type ("hospital" | "transport" | "government" | "landmark")
     * @param {string} [cartridgeId] - Optional cartridge filter
     * @returns {Array<POI>}
     * 
     * @example
     * const hospitals = getPOIsByType("hospital");
     * // Returns all hospital POIs across all cartridges
     */
    getPOIsByType(type, cartridgeId = null) {
        // Input validation
        if (!type || typeof type !== 'string' || type.trim() === '') {
            console.warn('[CartridgePOIQueryEngine] Invalid type for getPOIsByType');
            return [];
        }

        const normalizedType = type.toLowerCase();

        // Get cartridges
        let cartridges;
        if (cartridgeId) {
            const singleCartridge = MapCartridgeService.getCartridge(cartridgeId);
            cartridges = singleCartridge ? [singleCartridge] : [];
        } else {
            cartridges = MapCartridgeService.getAllCartridges();
        }

        // Collect matching POIs
        const matchingPOIs = [];
        cartridges.forEach(cartridge => {
            if (cartridge.pois && Array.isArray(cartridge.pois)) {
                cartridge.pois.forEach(poi => {
                    if (poi.type === normalizedType) {
                        matchingPOIs.push({
                            ...poi,
                            cartridgeId: cartridge.id,
                            cartridgeTitle: cartridge.title
                        });
                    }
                });
            }
        });

        return matchingPOIs;
    }

    /**
     * Get singleton instance
     * @returns {CartridgePOIQueryEngine}
     */
    static getInstance() {
        if (!CartridgePOIQueryEngine._instance) {
            CartridgePOIQueryEngine._instance = new CartridgePOIQueryEngine();
        }
        return CartridgePOIQueryEngine._instance;
    }
}

// Singleton instance holder
CartridgePOIQueryEngine._instance = null;

// Export singleton instance
export const cartridgePOIQueryEngine = CartridgePOIQueryEngine.getInstance();

// Export class for testing
export default CartridgePOIQueryEngine;
