import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('UserContextManager');

/**
 * User Context Manager
 *
 * Stores user's personal context for generating personalized emergency protocols.
 * All data is stored locally in encrypted IndexedDB - never synced to cloud.
 *
 * Context Categories:
 * 1. Inventory - Bug-out bag contents, supplies, equipment
 * 2. Medical - Allergies, medications, conditions, blood type
 * 3. Location - Home layout, work address, family locations, safe routes
 * 4. Resources - Current supplies (water, fuel, food, cash)
 */

// Context item types
export const CONTEXT_TYPES = {
    INVENTORY: 'inventory',
    MEDICAL: 'medical',
    LOCATION: 'location',
    RESOURCES: 'resources'
};

// Medical profile schema
export const MEDICAL_PROFILE_TEMPLATE = {
    allergies: [],                  // e.g., ['NSAIDs', 'penicillin']
    medications: [],                // e.g., [{name: 'Metformin', dosage: '500mg', frequency: 'twice daily'}]
    conditions: [],                 // e.g., ['Type 2 Diabetes', 'Asthma']
    bloodType: '',                  // e.g., 'O+'
    emergencyContacts: []           // e.g., [{name: 'Jane', phone: '+44...', relation: 'Wife'}]
};

// Location profile schema
export const LOCATION_PROFILE_TEMPLATE = {
    home: {
        address: '',
        postcode: '',
        floor: '',                  // e.g., 'ground floor', '3rd floor'
        layout: '',                 // e.g., '2-bed flat', 'terraced house'
        entryPoints: [],            // e.g., ['front door', 'back door', 'balcony']
        vulnerabilities: []         // e.g., ['ground floor windows', 'shared entrance']
    },
    work: {
        address: '',
        postcode: ''
    },
    family: [],                     // e.g., [{name: 'Jane', location: 'work', distance: '3 miles', contact: '+44...'}]
    safeRoutes: []                  // Pre-planned evacuation routes
};

// Resource tracking schema
export const RESOURCE_PROFILE_TEMPLATE = {
    water: {
        bottled: 0,                 // Number of bottles/liters
        stored: 0,                  // Liters in containers
        purificationMethod: ''      // e.g., 'tablets', 'filter', 'boiling'
    },
    food: {
        daysSupply: 0,
        nonPerishable: []           // e.g., ['tinned beans', 'rice', 'pasta']
    },
    fuel: {
        vehicleTank: '',            // e.g., 'full', 'half', 'empty'
        spare: 0                    // Liters
    },
    power: {
        battery: [],                // e.g., [{device: 'phone', percentage: 85}]
        powerBank: 0,               // mAh capacity
        generator: false
    },
    cash: 0,                        // Amount in local currency
    lastUpdated: null
};

/**
 * User Context Manager Service
 */
class UserContextManager {
    constructor() {
        this._initialized = false;
    }

    /**
     * Initialize the context manager
     */
    async initialize() {
        if (this._initialized) return;

        try {
            // Check if user_context store exists
            // If not, it will be created by storage layer
            this._initialized = true;
            log.info('UserContextManager initialized');
        } catch (error) {
            log.error('Failed to initialize UserContextManager', error);
            throw error;
        }
    }

    /**
     * Get all context data
     * @returns {Promise<Object>} All context categories
     */
    async getAll() {
        await this.initialize();

        try {
            const inventory = await this.getInventory();
            const medical = await this.getMedical();
            const location = await this.getLocation();
            const resources = await this.getResources();

            return {
                inventory,
                medical,
                location,
                resources
            };
        } catch (error) {
            log.error('Failed to get all context', error);
            return {
                inventory: { items: [] },
                medical: { ...MEDICAL_PROFILE_TEMPLATE },
                location: { ...LOCATION_PROFILE_TEMPLATE },
                resources: { ...RESOURCE_PROFILE_TEMPLATE }
            };
        }
    }

    /**
     * Get inventory context
     * @returns {Promise<Object>}
     */
    async getInventory() {
        await this.initialize();

        try {
            const data = await db.getItem('user_context', 'inventory');
            return data || { items: [], lastUpdated: null };
        } catch (error) {
            log.error('Failed to get inventory', error);
            return { items: [], lastUpdated: null };
        }
    }

    /**
     * Set inventory context
     * @param {Array} items - Array of inventory items
     */
    async setInventory(items) {
        await this.initialize();

        try {
            const data = {
                items,
                lastUpdated: new Date().toISOString()
            };

            await db.setItem('user_context', 'inventory', data);
            log.info('Inventory updated', { count: items.length });
        } catch (error) {
            log.error('Failed to set inventory', error);
            throw error;
        }
    }

    /**
     * Add single inventory item
     * @param {Object} item - Item to add
     */
    async addInventoryItem(item) {
        const current = await this.getInventory();
        const items = current.items || [];

        // Add unique ID if not present
        const newItem = {
            id: Date.now().toString(),
            ...item,
            addedAt: new Date().toISOString()
        };

        items.push(newItem);
        await this.setInventory(items);

        return newItem;
    }

    /**
     * Remove inventory item by ID
     * @param {string} itemId
     */
    async removeInventoryItem(itemId) {
        const current = await this.getInventory();
        const items = (current.items || []).filter(item => item.id !== itemId);
        await this.setInventory(items);
    }

    /**
     * Get medical profile
     * @returns {Promise<Object>}
     */
    async getMedical() {
        await this.initialize();

        try {
            const data = await db.getItem('user_context', 'medical');
            return data || { ...MEDICAL_PROFILE_TEMPLATE };
        } catch (error) {
            log.error('Failed to get medical profile', error);
            return { ...MEDICAL_PROFILE_TEMPLATE };
        }
    }

    /**
     * Set medical profile
     * @param {Object} profile
     */
    async setMedical(profile) {
        await this.initialize();

        try {
            const data = {
                ...MEDICAL_PROFILE_TEMPLATE,
                ...profile,
                lastUpdated: new Date().toISOString()
            };

            await db.setItem('user_context', 'medical', data);
            log.info('Medical profile updated');
        } catch (error) {
            log.error('Failed to set medical profile', error);
            throw error;
        }
    }

    /**
     * Get location profile
     * @returns {Promise<Object>}
     */
    async getLocation() {
        await this.initialize();

        try {
            const data = await db.getItem('user_context', 'location');
            return data || { ...LOCATION_PROFILE_TEMPLATE };
        } catch (error) {
            log.error('Failed to get location profile', error);
            return { ...LOCATION_PROFILE_TEMPLATE };
        }
    }

    /**
     * Set location profile
     * @param {Object} profile
     */
    async setLocation(profile) {
        await this.initialize();

        try {
            const data = {
                ...LOCATION_PROFILE_TEMPLATE,
                ...profile,
                lastUpdated: new Date().toISOString()
            };

            await db.setItem('user_context', 'location', data);
            log.info('Location profile updated');
        } catch (error) {
            log.error('Failed to set location profile', error);
            throw error;
        }
    }

    /**
     * Get resources profile
     * @returns {Promise<Object>}
     */
    async getResources() {
        await this.initialize();

        try {
            const data = await db.getItem('user_context', 'resources');
            return data || { ...RESOURCE_PROFILE_TEMPLATE };
        } catch (error) {
            log.error('Failed to get resources profile', error);
            return { ...RESOURCE_PROFILE_TEMPLATE };
        }
    }

    /**
     * Set resources profile
     * @param {Object} profile
     */
    async setResources(profile) {
        await this.initialize();

        try {
            const data = {
                ...RESOURCE_PROFILE_TEMPLATE,
                ...profile,
                lastUpdated: new Date().toISOString()
            };

            await db.setItem('user_context', 'resources', data);
            log.info('Resources profile updated');
        } catch (error) {
            log.error('Failed to set resources profile', error);
            throw error;
        }
    }

    /**
     * Get context summary for protocol generation
     * Returns formatted string suitable for LLM prompts
     * @returns {Promise<string>}
     */
    async getContextSummary() {
        const context = await this.getAll();

        let summary = '';

        // Inventory summary
        if (context.inventory.items && context.inventory.items.length > 0) {
            summary += '**Inventory:**\n';
            context.inventory.items.forEach(item => {
                summary += `- ${item.name}${item.quantity ? ` (x${item.quantity})` : ''}\n`;
            });
            summary += '\n';
        }

        // Medical summary
        if (context.medical.allergies && context.medical.allergies.length > 0) {
            summary += `**Allergies:** ${context.medical.allergies.join(', ')}\n`;
        }
        if (context.medical.conditions && context.medical.conditions.length > 0) {
            summary += `**Medical Conditions:** ${context.medical.conditions.join(', ')}\n`;
        }
        if (context.medical.medications && context.medical.medications.length > 0) {
            summary += `**Medications:** ${context.medical.medications.map(m => m.name).join(', ')}\n`;
        }
        if (summary.includes('**')) summary += '\n';

        // Location summary
        if (context.location.home.address) {
            summary += `**Home:** ${context.location.home.layout || 'residence'}, ${context.location.home.floor || 'unknown floor'}\n`;
            if (context.location.home.vulnerabilities && context.location.home.vulnerabilities.length > 0) {
                summary += `  Vulnerabilities: ${context.location.home.vulnerabilities.join(', ')}\n`;
            }
        }
        if (context.location.family && context.location.family.length > 0) {
            summary += `**Family Locations:**\n`;
            context.location.family.forEach(person => {
                summary += `- ${person.name} at ${person.location} (${person.distance})\n`;
            });
        }
        if (summary.includes('**Home:**')) summary += '\n';

        // Resources summary
        const waterTotal = (context.resources.water.bottled || 0) + (context.resources.water.stored || 0);
        if (waterTotal > 0) {
            summary += `**Water:** ${waterTotal} liters\n`;
        }
        if (context.resources.food.daysSupply > 0) {
            summary += `**Food:** ${context.resources.food.daysSupply} days supply\n`;
        }
        if (context.resources.cash > 0) {
            summary += `**Cash:** £${context.resources.cash}\n`;
        }

        return summary || 'No user context configured.';
    }

    /**
     * Clear all context data
     */
    async clearAll() {
        await this.initialize();

        try {
            await db.delete('user_context', 'inventory');
            await db.delete('user_context', 'medical');
            await db.delete('user_context', 'location');
            await db.delete('user_context', 'resources');

            log.info('All context data cleared');
        } catch (error) {
            log.error('Failed to clear context', error);
            throw error;
        }
    }

    /**
     * Export all context as JSON (for backup)
     */
    async exportJSON() {
        const context = await this.getAll();
        return JSON.stringify(context, null, 2);
    }

    /**
     * Import context from JSON (for restore)
     * @param {string} jsonString
     */
    async importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.inventory) await this.setInventory(data.inventory.items || []);
            if (data.medical) await this.setMedical(data.medical);
            if (data.location) await this.setLocation(data.location);
            if (data.resources) await this.setResources(data.resources);

            log.info('Context imported successfully');
        } catch (error) {
            log.error('Failed to import context', error);
            throw new Error('Invalid context data format');
        }
    }
}

// Export singleton instance
export const userContextManager = new UserContextManager();

// Export convenience functions
export const getAll = () => userContextManager.getAll();
export const getInventory = () => userContextManager.getInventory();
export const setInventory = (items) => userContextManager.setInventory(items);
export const addInventoryItem = (item) => userContextManager.addInventoryItem(item);
export const removeInventoryItem = (id) => userContextManager.removeInventoryItem(id);
export const getMedical = () => userContextManager.getMedical();
export const setMedical = (profile) => userContextManager.setMedical(profile);
export const getLocation = () => userContextManager.getLocation();
export const setLocation = (profile) => userContextManager.setLocation(profile);
export const getResources = () => userContextManager.getResources();
export const setResources = (profile) => userContextManager.setResources(profile);
export const getContextSummary = () => userContextManager.getContextSummary();
export const clearAll = () => userContextManager.clearAll();
export const exportJSON = () => userContextManager.exportJSON();
export const importJSON = (json) => userContextManager.importJSON(json);
