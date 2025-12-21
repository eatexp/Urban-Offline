/**
 * Content Pack Schema and Types
 * Defines the structure for downloadable content packs (Kiwix-style)
 * 
 * Content packs allow users to selectively download:
 * - Medical/Health content
 * - Legal/Rights content  
 * - Survival/Emergency content
 * - Region-specific data (maps, places)
 * - AI models for offline inference
 */

/**
 * Content Pack Manifest Structure
 * @typedef {Object} ContentPackManifest
 * @property {string} id - Unique pack identifier (e.g., 'medical-core-v1')
 * @property {string} name - Display name
 * @property {string} description - Detailed description
 * @property {string} category - 'medical' | 'legal' | 'survival' | 'region' | 'ai-model'
 * @property {string} version - Semantic version (e.g., '1.0.0')
 * @property {number} size - Size in bytes
 * @property {string} sizeDisplay - Human-readable size (e.g., '45 MB')
 * @property {string[]} tags - Searchable tags
 * @property {string} icon - Icon identifier or URL
 * @property {ContentPackResource[]} resources - List of resources in this pack
 * @property {ContentPackDependencies} dependencies - Required packs
 * @property {ContentPackMetadata} metadata - Source/license info
 * @property {string} checksum - SHA-256 hash for integrity verification
 * @property {string} downloadUrl - URL to download the pack
 * @property {string} updatedAt - ISO date of last update
 */

/**
 * Individual resource within a pack
 * @typedef {Object} ContentPackResource
 * @property {string} id - Resource ID
 * @property {string} type - 'article' | 'guide' | 'ink-story' | 'map-tiles' | 'places' | 'model'
 * @property {string} path - Path within the pack archive
 * @property {number} size - Size in bytes
 * @property {string} checksum - SHA-256 hash
 */

/**
 * Pack dependencies
 * @typedef {Object} ContentPackDependencies
 * @property {string[]} required - Pack IDs that must be installed first
 * @property {string[]} optional - Recommended additional packs
 */

/**
 * Pack metadata for attribution
 * @typedef {Object} ContentPackMetadata
 * @property {string} source - Primary source (e.g., 'Wikipedia', 'NHS', 'CDC')
 * @property {string} license - License identifier (e.g., 'CC-BY-SA-4.0', 'OGL-3.0')
 * @property {string} licenseUrl - URL to full license text
 * @property {string} attribution - Required attribution text
 * @property {string} lastVerified - ISO date when content was last verified
 */

// Pack Categories
export const PACK_CATEGORIES = {
    MEDICAL: 'medical',
    LEGAL: 'legal',
    SURVIVAL: 'survival',
    REGION: 'region',
    AI_MODEL: 'ai-model'
};

// Resource Types
export const RESOURCE_TYPES = {
    ARTICLE: 'article',
    GUIDE: 'guide',
    INK_STORY: 'ink-story',
    MAP_TILES: 'map-tiles',
    PLACES: 'places',
    MODEL: 'model',
    VECTOR_INDEX: 'vector-index'
};

// Pack Status
export const PACK_STATUS = {
    NOT_INSTALLED: 'not-installed',
    DOWNLOADING: 'downloading',
    INSTALLING: 'installing',
    INSTALLED: 'installed',
    UPDATE_AVAILABLE: 'update-available',
    ERROR: 'error'
};

/**
 * Example pack manifests (these would come from a server)
 */
export const EXAMPLE_PACKS = [
    {
        id: 'medical-core-v1',
        name: 'Essential Medical Guide',
        description: 'First aid, CPR, emergency triage decision trees, and common medical emergencies. Sourced from Wikipedia WikiProject Medicine.',
        category: PACK_CATEGORIES.MEDICAL,
        version: '1.2.0',
        size: 15 * 1024 * 1024, // 15 MB
        sizeDisplay: '15 MB',
        tags: ['first-aid', 'cpr', 'emergency', 'medical', 'triage'],
        icon: 'medical',
        resources: [
            { id: 'cpr-guide', type: RESOURCE_TYPES.ARTICLE, path: 'articles/cpr.json', size: 45000, checksum: '' },
            { id: 'first-aid-guide', type: RESOURCE_TYPES.ARTICLE, path: 'articles/first-aid.json', size: 67000, checksum: '' },
            { id: 'triage-breathing', type: RESOURCE_TYPES.INK_STORY, path: 'ink/breathing-emergency.ink.json', size: 12000, checksum: '' }
        ],
        dependencies: { required: [], optional: ['medical-advanced-v1'] },
        metadata: {
            source: 'Wikipedia WikiProject Medicine',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors, licensed under CC-BY-SA 4.0',
            lastVerified: '2024-12-01'
        },
        checksum: '',
        downloadUrl: '/packs/medical-core-v1.zip',
        updatedAt: '2024-12-15T00:00:00Z'
    },
    {
        id: 'legal-uk-v1',
        name: 'UK Legal Rights',
        description: 'Know your rights when dealing with police, arrests, searches, and legal procedures in the UK. Based on PACE codes and legislation.gov.uk.',
        category: PACK_CATEGORIES.LEGAL,
        version: '1.0.0',
        size: 8 * 1024 * 1024, // 8 MB
        sizeDisplay: '8 MB',
        tags: ['legal', 'rights', 'police', 'arrest', 'uk', 'pace'],
        icon: 'legal',
        resources: [
            { id: 'pace-codes', type: RESOURCE_TYPES.ARTICLE, path: 'articles/pace-codes.json', size: 120000, checksum: '' },
            { id: 'arrest-rights', type: RESOURCE_TYPES.INK_STORY, path: 'ink/arrest-rights.ink.json', size: 15000, checksum: '' }
        ],
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'UK Government / legislation.gov.uk',
            license: 'OGL-3.0',
            licenseUrl: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
            attribution: 'Contains public sector information licensed under the Open Government Licence v3.0',
            lastVerified: '2024-11-01'
        },
        checksum: '',
        downloadUrl: '/packs/legal-uk-v1.zip',
        updatedAt: '2024-11-15T00:00:00Z'
    },
    {
        id: 'survival-core-v1',
        name: 'Survival Essentials',
        description: 'Water purification, shelter building, fire starting, navigation, and emergency preparedness. Based on Red Cross and FEMA guidelines.',
        category: PACK_CATEGORIES.SURVIVAL,
        version: '1.1.0',
        size: 12 * 1024 * 1024, // 12 MB
        sizeDisplay: '12 MB',
        tags: ['survival', 'emergency', 'water', 'shelter', 'fire', 'navigation'],
        icon: 'survival',
        resources: [
            { id: 'water-purification', type: RESOURCE_TYPES.ARTICLE, path: 'articles/water-purification.json', size: 35000, checksum: '' },
            { id: 'shelter-building', type: RESOURCE_TYPES.ARTICLE, path: 'articles/shelter.json', size: 42000, checksum: '' }
        ],
        dependencies: { required: [], optional: ['region-wilderness-v1'] },
        metadata: {
            source: 'Red Cross / FEMA',
            license: 'Public Domain',
            licenseUrl: '',
            attribution: 'Based on American Red Cross and FEMA emergency preparedness materials',
            lastVerified: '2024-10-01'
        },
        checksum: '',
        downloadUrl: '/packs/survival-core-v1.zip',
        updatedAt: '2024-10-15T00:00:00Z'
    },
    {
        id: 'region-london-v1',
        name: 'London Offline Map',
        description: 'Offline map tiles and points of interest for Greater London including hospitals, shelters, and emergency services.',
        category: PACK_CATEGORIES.REGION,
        version: '1.0.0',
        size: 85 * 1024 * 1024, // 85 MB
        sizeDisplay: '85 MB',
        tags: ['london', 'uk', 'map', 'offline', 'hospitals', 'shelters'],
        icon: 'map',
        resources: [
            { id: 'london-tiles', type: RESOURCE_TYPES.MAP_TILES, path: 'tiles/', size: 75 * 1024 * 1024, checksum: '' },
            { id: 'london-hospitals', type: RESOURCE_TYPES.PLACES, path: 'places/hospitals.json', size: 250000, checksum: '' },
            { id: 'london-shelters', type: RESOURCE_TYPES.PLACES, path: 'places/shelters.json', size: 120000, checksum: '' }
        ],
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'OpenStreetMap',
            license: 'ODbL-1.0',
            licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
            attribution: '© OpenStreetMap contributors',
            lastVerified: '2024-12-01'
        },
        checksum: '',
        downloadUrl: '/packs/region-london-v1.zip',
        updatedAt: '2024-12-01T00:00:00Z'
    },
    {
        id: 'ai-phi3-mini-v1',
        name: 'Phi-3 Mini (Offline AI)',
        description: 'Microsoft Phi-3 Mini quantized model for offline AI assistance. Provides intelligent answers using your downloaded content.',
        category: PACK_CATEGORIES.AI_MODEL,
        version: '1.0.0',
        size: 2.3 * 1024 * 1024 * 1024, // 2.3 GB
        sizeDisplay: '2.3 GB',
        tags: ['ai', 'llm', 'offline', 'assistant', 'phi3'],
        icon: 'ai',
        resources: [
            { id: 'phi3-mini-q4', type: RESOURCE_TYPES.MODEL, path: 'models/phi3-mini-q4.gguf', size: 2.3 * 1024 * 1024 * 1024, checksum: '' }
        ],
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'Microsoft Research',
            license: 'MIT',
            licenseUrl: 'https://opensource.org/licenses/MIT',
            attribution: 'Phi-3 by Microsoft Research',
            lastVerified: '2024-12-01'
        },
        checksum: '',
        downloadUrl: '/packs/ai-phi3-mini-v1.gguf',
        updatedAt: '2024-12-01T00:00:00Z'
    }
];

/**
 * Validates a pack manifest structure
 * @param {Object} manifest - Pack manifest to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateManifest(manifest) {
    const errors = [];
    
    if (!manifest.id) errors.push('Missing pack ID');
    if (!manifest.name) errors.push('Missing pack name');
    if (!manifest.version) errors.push('Missing version');
    if (!manifest.category || !Object.values(PACK_CATEGORIES).includes(manifest.category)) {
        errors.push('Invalid or missing category');
    }
    if (typeof manifest.size !== 'number' || manifest.size <= 0) {
        errors.push('Invalid size');
    }
    if (!manifest.metadata?.license) {
        errors.push('Missing license information');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Formats bytes to human-readable string
 * @param {number} bytes 
 * @returns {string}
 */
export function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


