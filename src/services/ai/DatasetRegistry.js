import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('DatasetRegistry');

/**
 * Dataset Registry - Manages which knowledge domains the AI can access
 *
 * Features:
 * - Enable/disable individual datasets (Health, Survival, Law, etc.)
 * - Preset configurations for common scenarios
 * - Persistent preferences in IndexedDB
 * - Privacy-focused (disable sensitive datasets in public)
 * - Training mode (focus on specific domains for skill practice)
 */

// Dataset Definitions
export const DATASETS = [
    {
        id: 'health',
        name: 'Health & Medical',
        description: 'Medical emergencies, first aid, CPR, triage protocols',
        store: 'health_content',
        enabled: true,
        category: 'medical',
        icon: 'Heart',
        color: 'red'
    },
    {
        id: 'survival',
        name: 'Survival Skills',
        description: 'Wilderness survival, shelter, water, fire, navigation',
        store: 'survival_content',
        enabled: true,
        category: 'survival',
        icon: 'Tent',
        color: 'orange'
    },
    {
        id: 'law',
        name: 'Legal Rights',
        description: 'PACE codes, arrest procedures, civil rights, UK legislation',
        store: 'law_content',
        enabled: true,
        category: 'legal',
        icon: 'Scale',
        color: 'blue'
    },
    {
        id: 'guides',
        name: 'General Guides',
        description: 'Reference materials, how-to guides, general knowledge',
        store: 'guide_content',
        enabled: true,
        category: 'reference',
        icon: 'BookOpen',
        color: 'slate'
    }
];

// Preset Configurations
export const DATASET_PRESETS = {
    all: {
        name: 'All Datasets',
        description: 'Enable all available knowledge domains',
        datasets: ['health', 'survival', 'law', 'guides']
    },
    'survival-only': {
        name: 'Survival Only',
        description: 'Focus on survival skills and wilderness knowledge',
        datasets: ['survival']
    },
    'medical-only': {
        name: 'Medical Only',
        description: 'Focus on health and medical emergency information',
        datasets: ['health']
    },
    'civil-unrest': {
        name: 'Civil Unrest',
        description: 'Legal rights and survival during breakdown of order',
        datasets: ['law', 'survival']
    },
    'infrastructure-failure': {
        name: 'Infrastructure Failure',
        description: 'Survival and health info for when systems fail',
        datasets: ['survival', 'health']
    },
    'privacy-mode': {
        name: 'Privacy Mode',
        description: 'Disable sensitive datasets (legal, medical) for public use',
        datasets: ['survival', 'guides']
    }
};

/**
 * DatasetRegistry Service
 */
class DatasetRegistry {
    constructor() {
        this._cache = null;
        this._initialized = false;
    }

    /**
     * Initialize the registry and load preferences from storage
     */
    async initialize() {
        if (this._initialized) return;

        try {
            // Load saved preferences from IndexedDB
            const savedPrefs = await db.getItem('dataset_preferences', 'current');

            if (savedPrefs) {
                // Merge saved preferences with default definitions
                this._cache = DATASETS.map(dataset => ({
                    ...dataset,
                    enabled: savedPrefs[dataset.id] !== undefined
                        ? savedPrefs[dataset.id]
                        : dataset.enabled
                }));
            } else {
                // Use defaults
                this._cache = [...DATASETS];
                // Save initial state
                await this._savePreferences();
            }

            this._initialized = true;
            log.info('DatasetRegistry initialized', {
                enabled: this._cache.filter(d => d.enabled).length,
                total: this._cache.length
            });
        } catch (error) {
            log.error('Failed to initialize DatasetRegistry', error);
            // Fallback to defaults
            this._cache = [...DATASETS];
            this._initialized = true;
        }
    }

    /**
     * Get all datasets with current enabled state
     * @returns {Promise<Array>} Array of dataset objects
     */
    async getAll() {
        await this.initialize();
        return [...this._cache];
    }

    /**
     * Get only enabled datasets
     * @returns {Promise<Array>} Array of enabled dataset objects
     */
    async getEnabledDatasets() {
        await this.initialize();
        return this._cache.filter(dataset => dataset.enabled);
    }

    /**
     * Get a specific dataset by ID
     * @param {string} datasetId - Dataset identifier
     * @returns {Promise<Object|null>} Dataset object or null
     */
    async getDataset(datasetId) {
        await this.initialize();
        return this._cache.find(d => d.id === datasetId) || null;
    }

    /**
     * Enable or disable a specific dataset
     * @param {string} datasetId - Dataset identifier
     * @param {boolean} enabled - Enable state
     * @returns {Promise<void>}
     */
    async setEnabled(datasetId, enabled) {
        await this.initialize();

        const dataset = this._cache.find(d => d.id === datasetId);
        if (!dataset) {
            throw new Error(`Dataset not found: ${datasetId}`);
        }

        dataset.enabled = enabled;
        await this._savePreferences();

        log.info(`Dataset ${enabled ? 'enabled' : 'disabled'}`, { datasetId });
    }

    /**
     * Apply a preset configuration
     * @param {string} presetId - Preset identifier
     * @returns {Promise<void>}
     */
    async applyPreset(presetId) {
        await this.initialize();

        const preset = DATASET_PRESETS[presetId];
        if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
        }

        // Disable all, then enable only preset datasets
        for (const dataset of this._cache) {
            dataset.enabled = preset.datasets.includes(dataset.id);
        }

        await this._savePreferences();

        log.info('Applied preset', {
            presetId,
            enabled: this._cache.filter(d => d.enabled).map(d => d.id)
        });
    }

    /**
     * Get currently active preset (if any matches)
     * @returns {Promise<string|null>} Preset ID or null
     */
    async getActivePreset() {
        await this.initialize();

        const enabledIds = this._cache
            .filter(d => d.enabled)
            .map(d => d.id)
            .sort()
            .join(',');

        for (const [presetId, preset] of Object.entries(DATASET_PRESETS)) {
            const presetIds = preset.datasets.sort().join(',');
            if (enabledIds === presetIds) {
                return presetId;
            }
        }

        return null; // Custom configuration
    }

    /**
     * Reset to default state (all enabled)
     * @returns {Promise<void>}
     */
    async reset() {
        await this.initialize();

        for (const dataset of this._cache) {
            dataset.enabled = true;
        }

        await this._savePreferences();
        log.info('Reset to defaults');
    }

    /**
     * Get IndexedDB store names for enabled datasets
     * Used by RAGPipeline for filtering
     * @returns {Promise<Array<string>>} Store names
     */
    async getEnabledStores() {
        const enabled = await this.getEnabledDatasets();
        return enabled.map(d => d.store).filter(Boolean);
    }

    /**
     * Save current preferences to IndexedDB
     * @private
     */
    async _savePreferences() {
        try {
            const prefs = {};
            for (const dataset of this._cache) {
                prefs[dataset.id] = dataset.enabled;
            }

            await db.setItem('dataset_preferences', 'current', prefs);
        } catch (error) {
            log.error('Failed to save dataset preferences', error);
        }
    }

    /**
     * Get dataset statistics
     * @returns {Promise<Object>} Stats object
     */
    async getStats() {
        await this.initialize();

        const enabled = this._cache.filter(d => d.enabled);
        const disabled = this._cache.filter(d => !d.enabled);

        return {
            total: this._cache.length,
            enabled: enabled.length,
            disabled: disabled.length,
            activePreset: await this.getActivePreset(),
            enabledIds: enabled.map(d => d.id),
            disabledIds: disabled.map(d => d.id)
        };
    }
}

// Export singleton instance
export const datasetRegistry = new DatasetRegistry();

// Export functions for convenience
export const getAll = () => datasetRegistry.getAll();
export const getEnabledDatasets = () => datasetRegistry.getEnabledDatasets();
export const getDataset = (id) => datasetRegistry.getDataset(id);
export const setEnabled = (id, enabled) => datasetRegistry.setEnabled(id, enabled);
export const applyPreset = (presetId) => datasetRegistry.applyPreset(presetId);
export const getActivePreset = () => datasetRegistry.getActivePreset();
export const reset = () => datasetRegistry.reset();
export const getEnabledStores = () => datasetRegistry.getEnabledStores();
export const getStats = () => datasetRegistry.getStats();
