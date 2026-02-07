/**
 * PurchaseManager - Freemium tier management for AI models
 *
 * Handles:
 * - Checking pro unlock status
 * - Processing one-time purchase (£10)
 * - Restore purchase from app store
 * - Dev mode toggle for testing
 *
 * Storage: Uses @capacitor/preferences for persistent unlock flag
 * Native IAP: Stubbed for future Capacitor IAP plugin integration
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('PurchaseManager');

// Storage key for unlock status
const PRO_UNLOCK_KEY = 'ai_pro_unlocked';
const PRO_UNLOCK_DATE_KEY = 'ai_pro_unlocked_at';

// Product ID for app store IAP
const PRO_PRODUCT_ID = 'com.urbanoffline.ai_pro_unlock';

/**
 * Get Capacitor Preferences if available, fallback to localStorage
 */
const getStorage = async () => {
    try {
        const { Preferences } = await import('@capacitor/preferences');
        return {
            get: async (key) => {
                const result = await Preferences.get({ key });
                return result.value;
            },
            set: async (key, value) => {
                await Preferences.set({ key, value: String(value) });
            },
            remove: async (key) => {
                await Preferences.remove({ key });
            }
        };
    } catch (_e) {
        // Web fallback
        return {
            get: async (key) => localStorage.getItem(key),
            set: async (key, value) => localStorage.setItem(key, String(value)),
            remove: async (key) => localStorage.removeItem(key)
        };
    }
};

/**
 * Purchase Manager Service
 */
export const PurchaseManager = {
    _storage: null,
    _cachedStatus: null,

    /**
     * Initialize storage backend
     */
    async _ensureStorage() {
        if (!this._storage) {
            this._storage = await getStorage();
        }
        return this._storage;
    },

    /**
     * Check if pro tier is unlocked
     * @returns {Promise<boolean>}
     */
    async isProUnlocked() {
        try {
            // Return cached status if available (avoid repeated async calls)
            if (this._cachedStatus !== null) {
                return this._cachedStatus;
            }

            const storage = await this._ensureStorage();
            const value = await storage.get(PRO_UNLOCK_KEY);
            this._cachedStatus = value === 'true';
            return this._cachedStatus;
        } catch (error) {
            log.error('Failed to check pro status', error);
            return false;
        }
    },

    /**
     * Purchase pro unlock (one-time £10)
     * Currently stubbed - will integrate with Capacitor IAP plugin
     *
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async purchasePro() {
        try {
            log.info('Initiating pro purchase', { productId: PRO_PRODUCT_ID });

            // Check if running on native platform
            const isNative = await this._isNativePlatform();

            if (isNative) {
                // Native: Use Capacitor IAP plugin (stubbed)
                // TODO: Integrate with @capacitor-community/in-app-purchases
                // const { InAppPurchases } = await import('@capacitor-community/in-app-purchases');
                // const result = await InAppPurchases.purchase({ productId: PRO_PRODUCT_ID });

                log.warn('Native IAP not yet implemented - using dev unlock');
                return await this._setUnlocked(true);
            } else {
                // Web: Payment stub (could integrate Stripe, Paddle, etc.)
                // For now, just unlock directly (dev mode)
                log.warn('Web payment not yet implemented - using dev unlock');
                return await this._setUnlocked(true);
            }
        } catch (error) {
            log.error('Purchase failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Restore purchase from app store
     * @returns {Promise<{ success: boolean, restored: boolean, error?: string }>}
     */
    async restorePurchase() {
        try {
            log.info('Restoring purchase');

            const isNative = await this._isNativePlatform();

            if (isNative) {
                // Native: Restore from app store (stubbed)
                // TODO: Integrate with @capacitor-community/in-app-purchases
                // const { InAppPurchases } = await import('@capacitor-community/in-app-purchases');
                // const restored = await InAppPurchases.restorePurchases();
                // Check if PRO_PRODUCT_ID is in restored list

                log.warn('Native restore not yet implemented');
                return { success: true, restored: false, error: 'Restore not yet implemented for native' };
            } else {
                // Web: Check if already unlocked
                const isUnlocked = await this.isProUnlocked();
                return { success: true, restored: isUnlocked };
            }
        } catch (error) {
            log.error('Restore failed', error);
            return { success: false, restored: false, error: error.message };
        }
    },

    /**
     * Get purchase details for display
     */
    getPurchaseInfo() {
        return {
            productId: PRO_PRODUCT_ID,
            price: '£10.00',
            currency: 'GBP',
            description: 'Unlock all AI models',
            features: [
                'TinyLlama 1.1B - Balanced speed & quality',
                'Phi-3 Mini - Best reasoning ability',
                'SmolLM 1.7B - Highest quality responses',
                'All future pro models included'
            ]
        };
    },

    /**
     * Check if a specific model tier is accessible
     * @param {string} tier - 'free' or 'pro'
     * @returns {Promise<boolean>}
     */
    async canAccessTier(tier) {
        if (tier === 'free') return true;
        return this.isProUnlocked();
    },

    /**
     * Dev helper: Set unlock status directly (for testing)
     * @param {boolean} unlocked
     */
    async _devSetUnlocked(unlocked) {
        log.warn('DEV: Setting pro unlock status', { unlocked });
        return this._setUnlocked(unlocked);
    },

    /**
     * Internal: Set unlock status
     */
    async _setUnlocked(unlocked) {
        try {
            const storage = await this._ensureStorage();

            if (unlocked) {
                await storage.set(PRO_UNLOCK_KEY, 'true');
                await storage.set(PRO_UNLOCK_DATE_KEY, new Date().toISOString());
            } else {
                await storage.remove(PRO_UNLOCK_KEY);
                await storage.remove(PRO_UNLOCK_DATE_KEY);
            }

            this._cachedStatus = unlocked;
            log.info('Pro status updated', { unlocked });
            return { success: true };
        } catch (error) {
            log.error('Failed to update unlock status', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if running on native platform (iOS/Android)
     */
    async _isNativePlatform() {
        try {
            const { Capacitor } = await import('@capacitor/core');
            return Capacitor.isNativePlatform();
        } catch (_e) {
            return false;
        }
    },

    /**
     * Clear cached status (call after purchase/restore)
     */
    clearCache() {
        this._cachedStatus = null;
    }
};

export default PurchaseManager;
