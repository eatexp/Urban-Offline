/**
 * Shared category configuration
 * Single source of truth for category metadata across the app
 * 
 * Used by: CategoryGrid, CitationChip, DatasetManager, ContentPackManager
 * Compliance: .clinerules §6 - Consistent category handling
 * 
 * SIMPLIFIED: 5 core categories with clear aliases
 * - medical: Health & medical emergencies
 * - survival: Survival skills & wilderness
 * - legal: Legal rights & procedures
 * - guides: General reference & guides
 * - maps: Regional maps & location data
 * - ai: AI models (special category)
 */

import { Heart, Tent, Scale, BookOpen, MapPin, Sparkles, Compass } from 'lucide-react';

/**
 * Category metadata with consistent styling and icons
 */
export const CATEGORY_CONFIG = {
    // ═════════════════════════════════════════════════════════════════
    // CORE CATEGORIES - Primary user-facing categories
    // ═════════════════════════════════════════════════════════════════
    
    medical: {
        id: 'medical',
        name: 'Medical & Health',
        shortName: 'Medical',
        description: 'First aid, CPR, emergency triage, medications, and health guides',
        icon: Heart,
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        textColor: '#ef4444',
        chipClass: 'citation-chip--medical',
        store: 'health_content',
        priority: 1,
        aliases: ['health', 'first-aid', 'emergency-medical']
    },
    
    survival: {
        id: 'survival',
        name: 'Survival Skills',
        shortName: 'Survival',
        description: 'Wilderness survival, shelter building, water purification, navigation',
        icon: Tent,
        color: '#f97316',
        bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
        borderColor: 'rgba(249, 115, 22, 0.2)',
        textColor: '#f97316',
        chipClass: 'citation-chip--survival',
        store: 'survival_content',
        priority: 2,
        aliases: ['emergency', 'wilderness', 'outdoor']
    },
    
    legal: {
        id: 'legal',
        name: 'Legal Rights',
        shortName: 'Legal',
        description: 'PACE codes, arrest procedures, civil rights, and legal protections',
        icon: Scale,
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        textColor: '#8b5cf6',
        chipClass: 'citation-chip--legal',
        store: 'law_content',
        priority: 3,
        aliases: ['law', 'rights', 'pace']
    },
    
    guides: {
        id: 'guides',
        name: 'General Guides',
        shortName: 'Guides',
        description: 'Reference materials, how-to guides, and general knowledge',
        icon: BookOpen,
        color: '#64748b',
        bgGradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)',
        borderColor: 'rgba(100, 116, 139, 0.2)',
        textColor: '#64748b',
        chipClass: 'citation-chip--general',
        store: 'guide_content',
        priority: 4,
        aliases: ['general', 'reference', 'docs']
    },
    
    maps: {
        id: 'maps',
        name: 'Maps & Locations',
        shortName: 'Maps',
        description: 'Offline maps, places, and location-specific information',
        icon: MapPin,
        color: '#10b981',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        textColor: '#10b981',
        chipClass: 'citation-chip--general',
        store: 'region_content',
        priority: 5,
        aliases: ['region', 'location', 'places']
    },
    
    // ═════════════════════════════════════════════════════════════════
    // SPECIAL CATEGORIES
    // ═════════════════════════════════════════════════════════════════
    
    ai: {
        id: 'ai',
        name: 'AI Models',
        shortName: 'AI',
        description: 'Local language models for offline AI assistance',
        icon: Sparkles,
        color: '#6366f1',
        bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        textColor: '#6366f1',
        chipClass: 'citation-chip--general',
        store: 'ai_models',
        priority: 6,
        aliases: ['models', 'llm']
    }
};

/**
 * Get category configuration by ID or alias
 * Falls back to 'general' if not found
 * 
 * @param {string} categoryId - Category ID or alias
 * @returns {Object} Category configuration
 */
export function getCategoryConfig(categoryId) {
    if (!categoryId) return CATEGORY_CONFIG.general;
    
    const normalizedId = categoryId.toLowerCase().trim();
    
    // Direct match
    if (CATEGORY_CONFIG[normalizedId]) {
        return CATEGORY_CONFIG[normalizedId];
    }
    
    // Check aliases
    for (const [, config] of Object.entries(CATEGORY_CONFIG)) {
        if (config.aliases?.includes(normalizedId)) {
            return config;
        }
    }
    
    // Partial match (e.g., "medical-emergency" matches "medical")
    for (const [catKey, config] of Object.entries(CATEGORY_CONFIG)) {
        if (normalizedId.includes(catKey) || catKey.includes(normalizedId)) {
            return config;
        }
    }
    
    return CATEGORY_CONFIG.general;
}

/**
 * Get all categories as array sorted by priority
 * 
 * @returns {Array} Sorted category configurations
 */
export function getAllCategories() {
    return Object.values(CATEGORY_CONFIG)
        .filter((cat, index, self) => 
            // Remove duplicates (aliases create multiple entries)
            index === self.findIndex(c => c.id === cat.id)
        )
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get icon component for a category
 * 
 * @param {string} categoryId - Category ID
 * @returns {Component} Lucide icon component
 */
export function getCategoryIcon(categoryId) {
    const config = getCategoryConfig(categoryId);
    return config.icon || BookOpen;
}

/**
 * Get category color
 * 
 * @param {string} categoryId - Category ID
 * @returns {string} Hex color code
 */
export function getCategoryColor(categoryId) {
    const config = getCategoryConfig(categoryId);
    return config.color || '#64748b';
}

/**
 * Get chip CSS class for citations
 * 
 * @param {string} categoryId - Category ID
 * @returns {string} CSS class name
 */
export function getCategoryChipClass(categoryId) {
    const config = getCategoryConfig(categoryId);
    return config.chipClass || 'citation-chip--general';
}

/**
 * Check if category is valid/exists
 * 
 * @param {string} categoryId - Category ID to check
 * @returns {boolean}
 */
export function isValidCategory(categoryId) {
    if (!categoryId) return false;
    const normalizedId = categoryId.toLowerCase().trim();
    return !!CATEGORY_CONFIG[normalizedId] || 
           Object.values(CATEGORY_CONFIG).some(c => c.aliases?.includes(normalizedId));
}

export default CATEGORY_CONFIG;