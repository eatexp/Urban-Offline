/**
 * MapCartridgeService
 * 
 * Manages the registry of available offline map cartridges.
 * Provides search functionality to find maps by name or region.
 * 
 * POI (Point of Interest) Schema:
 * Each cartridge can include a `pois` array with embedded location data:
 * {
 *   name: string        - Display name (e.g., "St Thomas' Hospital")
 *   type: string        - POI category: "hospital" | "transport" | "government" | "landmark"
 *   coords: [lon, lat]  - WGS84 coordinates
 *   tags: string[]      - Search keywords (e.g., ['nhs', 'emergency', 'a&e'])
 *   priority: string    - "critical" | "high" | "normal" (affects search ranking)
 *   description: string - Human-readable context
 * }
 * 
 * Future: Scan filesystem for .pmtiles files and extract metadata.
 * Current: Static registry for demo purposes.
 */

/**
 * Validates a cartridge object against schema
 * @param {Object} cartridge - Cartridge to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCartridge(cartridge) {
    const errors = [];

    // Required fields
    if (!cartridge.id) errors.push('Missing required field: id');
    if (!cartridge.title) errors.push('Missing required field: title');
    if (!cartridge.category) errors.push('Missing required field: category');
    if (!cartridge.payload) errors.push('Missing required field: payload');

    // ID pattern: lowercase alphanumeric with hyphens
    if (cartridge.id && !/^[a-z0-9-]+$/.test(cartridge.id)) {
        errors.push(`Invalid id format: "${cartridge.id}" (must be lowercase alphanumeric with hyphens)`);
    }

    // Payload validation
    if (cartridge.payload) {
        if (!cartridge.payload.center) {
            errors.push('Missing payload.center');
        } else if (!Array.isArray(cartridge.payload.center) || cartridge.payload.center.length !== 2) {
            errors.push('payload.center must be [lon, lat] array');
        } else {
            const [lon, lat] = cartridge.payload.center;
            if (typeof lon !== 'number' || lon < -180 || lon > 180) {
                errors.push(`Invalid longitude: ${lon} (must be -180 to 180)`);
            }
            if (typeof lat !== 'number' || lat < -90 || lat > 90) {
                errors.push(`Invalid latitude: ${lat} (must be -90 to 90)`);
            }
        }

        if (cartridge.payload.zoom === undefined) {
            errors.push('Missing payload.zoom');
        } else if (typeof cartridge.payload.zoom !== 'number' || cartridge.payload.zoom < 0 || cartridge.payload.zoom > 22) {
            errors.push(`Invalid zoom: ${cartridge.payload.zoom} (must be 0-22)`);
        }
    }

    // POI validation (optional field)
    if (cartridge.pois !== undefined) {
        if (!Array.isArray(cartridge.pois)) {
            errors.push('pois must be an array');
        } else {
            cartridge.pois.forEach((poi, index) => {
                const poiPrefix = `pois[${index}]`;
                
                // Validate name
                if (!poi.name || typeof poi.name !== 'string' || poi.name.trim() === '') {
                    errors.push(`${poiPrefix}: name must be a non-empty string`);
                }
                
                // Validate type
                if (!poi.type || typeof poi.type !== 'string' || poi.type.trim() === '') {
                    errors.push(`${poiPrefix}: type must be a non-empty string`);
                }
                
                // Validate coords
                if (!Array.isArray(poi.coords) || poi.coords.length !== 2) {
                    errors.push(`${poiPrefix}: coords must be [lon, lat] array`);
                } else {
                    const [lon, lat] = poi.coords;
                    if (typeof lon !== 'number' || lon < -180 || lon > 180) {
                        errors.push(`${poiPrefix}: Invalid longitude ${lon} (must be -180 to 180)`);
                    }
                    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
                        errors.push(`${poiPrefix}: Invalid latitude ${lat} (must be -90 to 90)`);
                    }
                }
                
                // Validate tags
                if (!Array.isArray(poi.tags) || poi.tags.length === 0) {
                    errors.push(`${poiPrefix}: tags must be a non-empty array`);
                }
                
                // Validate priority
                const validPriorities = ['critical', 'high', 'normal'];
                if (!poi.priority || !validPriorities.includes(poi.priority)) {
                    errors.push(`${poiPrefix}: priority must be one of: ${validPriorities.join(', ')}`);
                }
                
                // Validate description
                if (!poi.description || typeof poi.description !== 'string' || poi.description.trim() === '') {
                    errors.push(`${poiPrefix}: description must be a non-empty string`);
                }
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

const INSTALLED_CARTRIDGES = [
    {
        id: 'map-london',
        title: 'London, UK',
        description: 'Sector: Greater London [High Res]',
        category: 'map',
        tags: ['london', 'uk', 'england', 'capital', 'city'],
        size: '500MB',
        resolution: 'high', // High-res local PMTiles cartridge
        payload: {
            center: [-0.1276, 51.5074],
            zoom: 14,
            pitch: 45 // Tactical view
        },
        pois: [
            {
                name: "St Thomas' Hospital",
                type: 'hospital',
                coords: [-0.1175, 51.4985],
                tags: ['nhs', 'emergency', 'a&e', 'hospital', 'medical'],
                priority: 'critical',
                description: 'Major NHS hospital with A&E. South bank of Thames.'
            },
            {
                name: 'Waterloo Station',
                type: 'transport',
                coords: [-0.1134, 51.5031],
                tags: ['rail', 'tube', 'train', 'evacuation', 'transport'],
                priority: 'high',
                description: 'Major rail terminus. Evacuation route hub.'
            },
            {
                name: 'City Hall (Emergency HQ)',
                type: 'government',
                coords: [-0.0786, 51.5045],
                tags: ['government', 'emergency', 'coordination', 'city hall'],
                priority: 'critical',
                description: 'London emergency coordination center.'
            },
            {
                name: 'Tower Bridge',
                type: 'landmark',
                coords: [-0.0754, 51.5055],
                tags: ['bridge', 'crossing', 'thames', 'landmark'],
                priority: 'normal',
                description: 'Thames crossing point. Iconic landmark.'
            }
        ]
    },
    // Demo placeholder for "New York" to show search breadth
    {
        id: 'map-nyc',
        title: 'New York City, USA',
        description: 'Sector: Manhattan/Brooklyn [Partially Cached]',
        category: 'map',
        tags: ['nyc', 'new york', 'usa', 'america', 'manhattan'],
        size: 'N/A (Remote)',
        resolution: 'low', // Remote/low-res global basemap
        payload: {
            center: [-74.0060, 40.7128],
            zoom: 13,
            pitch: 0
        },
        pois: [
            {
                name: 'Bellevue Hospital',
                type: 'hospital',
                coords: [-73.9753, 40.7391],
                tags: ['hospital', 'emergency', 'medical', 'er'],
                priority: 'critical',
                description: 'Historic public hospital with emergency services.'
            },
            {
                name: 'Penn Station',
                type: 'transport',
                coords: [-73.9930, 40.7506],
                tags: ['train', 'rail', 'subway', 'transport', 'evacuation'],
                priority: 'high',
                description: 'Major transportation hub. Amtrak and subway access.'
            },
            {
                name: 'NYC City Hall',
                type: 'government',
                coords: [-74.0060, 40.7128],
                tags: ['government', 'emergency', 'coordination', 'city hall'],
                priority: 'critical',
                description: 'NYC emergency coordination center.'
            },
            {
                name: 'Brooklyn Bridge',
                type: 'landmark',
                coords: [-73.9969, 40.7061],
                tags: ['bridge', 'crossing', 'landmark', 'east river'],
                priority: 'normal',
                description: 'Historic bridge connecting Manhattan and Brooklyn.'
            }
        ]
    }
];

// Validate all cartridges on initialization
const VALIDATED_CARTRIDGES = INSTALLED_CARTRIDGES.filter(cartridge => {
    const result = validateCartridge(cartridge);
    if (!result.valid) {
        console.warn(`[MapCartridgeService] Invalid cartridge "${cartridge.id}" excluded:`, result.errors);
        return false;
    }
    return true;
});

export const MapCartridgeService = {
    /**
     * Search available map cartridges
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        // Sanitize input
        const sanitized = query
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ''); // Remove special chars except spaces and hyphens

        if (!sanitized) return [];

        return VALIDATED_CARTRIDGES.filter(cartridge => {
            // Title match
            if (cartridge.title.toLowerCase().includes(sanitized)) return true;
            // Tag match
            if (cartridge.tags.some(tag => tag.includes(sanitized))) return true;
            return false;
        }).map(cartridge => ({
            ...cartridge,
            // Override display title for "Tactical" feel in search results
            displayTitle: `SECTOR: ${cartridge.title.toUpperCase()}`,
            // Add a specific type so Search.jsx knows how to render/icon
            type: 'map_sector'
        }));
    },

    /**
     * Get a specific cartridge by ID
     */
    getCartridge(id) {
        return VALIDATED_CARTRIDGES.find(c => c.id === id);
    },

    /**
     * Get all validated cartridges
     * Used by CartridgePOIQueryEngine to search across all cartridges
     * @returns {Array} Array of all validated cartridge objects
     */
    getAllCartridges() {
        return VALIDATED_CARTRIDGES;
    }
};
