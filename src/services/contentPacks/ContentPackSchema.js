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
    AI_MODEL: 'ai-model',
    ZIM_IMPORT: 'zim-import'  // User-imported ZIM files
};

// Resource Types
export const RESOURCE_TYPES = {
    ARTICLE: 'article',
    GUIDE: 'guide',
    INK_STORY: 'ink-story',
    MAP_TILES: 'map-tiles',
    PLACES: 'places',
    MODEL: 'model',
    VECTOR_INDEX: 'vector-index',
    ZIM_ARTICLE: 'zim-article'  // Articles from imported ZIM files
};

// Pack Status
export const PACK_STATUS = {
    NOT_INSTALLED: 'not-installed',
    DOWNLOADING: 'downloading',
    INSTALLING: 'installing',
    INSTALLED: 'installed',
    BUNDLED: 'bundled',
    UPDATE_AVAILABLE: 'update-available',
    ERROR: 'error'
};

/**
 * Bundled content packs — these ship with the app and are synced on first launch.
 * Used as fallback when the content-manifest.json can't be fetched.
 */
export const BUNDLED_PACKS = [
    {
        id: 'medical-core',
        name: 'Emergency Medical Guide',
        description: 'First aid, CPR, emergency triage, trauma care, medications, and anatomy reference. Sourced from Wikipedia WikiProject Medicine.',
        category: PACK_CATEGORIES.MEDICAL,
        version: '1.0.0',
        store: 'health_content',
        tags: ['first-aid', 'cpr', 'emergency', 'medical', 'trauma', 'medications'],
        icon: 'medical',
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'Wikipedia WikiProject Medicine',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors, licensed under CC-BY-SA 4.0'
        },
        dataUrl: '/assets/packs/medical-core.json',
        bundled: true
    },
    {
        id: 'legal-uk',
        name: 'UK Legal Rights',
        description: 'Know your rights: PACE codes, arrest procedures, stop & search, police encounters, and legal protections.',
        category: PACK_CATEGORIES.LEGAL,
        version: '1.0.0',
        store: 'law_content',
        tags: ['legal', 'rights', 'police', 'arrest', 'uk', 'pace'],
        icon: 'legal',
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'UK Government / legislation.gov.uk / Wikipedia',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors'
        },
        dataUrl: '/assets/packs/legal-uk.json',
        bundled: true
    },
    {
        id: 'survival-core',
        name: 'Survival Essentials',
        description: 'Water purification, shelter building, fire starting, navigation, and emergency preparedness.',
        category: PACK_CATEGORIES.SURVIVAL,
        version: '1.0.0',
        store: 'survival_content',
        tags: ['survival', 'emergency', 'water', 'shelter', 'fire', 'navigation'],
        icon: 'survival',
        dependencies: { required: [], optional: [] },
        metadata: {
            source: 'Wikipedia',
            license: 'CC-BY-SA-4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Content from Wikipedia contributors'
        },
        dataUrl: '/assets/packs/survival-core.json',
        bundled: true
    }
];

// Keep backward-compatible export name
export const EXAMPLE_PACKS = BUNDLED_PACKS;

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













