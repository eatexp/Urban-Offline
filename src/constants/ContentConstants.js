/**
 * Content Storage Constants
 * 
 * Defines the single source of truth for where content is stored in IndexedDB.
 * Used by:
 * - ContentPackManager (Writer)
 * - ZimContentService (Reader)
 * - RAGPipeline (AI Reader)
 */

// The main metadata store for installed packs
export const PACK_METADATA_STORE = 'content_packs';

// Category-specific content stores
// These must match the 'store' property in DatasetRegistry
export const CONTENT_STORES = {
    MEDICAL: 'health_content',
    LEGAL: 'law_content',
    SURVIVAL: 'survival_content',
    GUIDES: 'guide_content',
    REGION: 'region_content', // Maps/Places
    GENERAL: 'general_content' // Fallback
};

// Maps Pack Categories (from ContentPackSchema) to Content Stores
export const CATEGORY_TO_STORE_MAP = {
    'medical': CONTENT_STORES.MEDICAL,
    'legal': CONTENT_STORES.LEGAL,
    'survival': CONTENT_STORES.SURVIVAL,
    'region': CONTENT_STORES.REGION,
    'guide': CONTENT_STORES.GUIDES,
    'zim-import': CONTENT_STORES.GENERAL // Custom imports go here
};
