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
 * Native IAP: Integrated with @capgo/native-purchases
 */

import { createLogger } from '../../utils/logger';
import { NativePurchases } from '@capgo/native-purchases';

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
     * Uses @capgo/native-purchases for native platforms
     *
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async purchasePro() {
        try {
            log.info('Initiating pro purchase', { productId: PRO_PRODUCT_ID });

            // Check if running on native platform
            const isNative = await this._isNativePlatform();

            if (isNative) {
                // =============================================================================
                // VERIFIED: [P3][Feature] PURCHASE_MANAGER_IAP_INTEGRATION
                // Implementation: Integrated @capgo/native-purchases for in-app purchases.
                //   - Fetches product info before purchase
                //   - Initiates purchase flow using Capacitor IAP plugin
                //   - Validates purchase and unlocks pro tier on success
                //   - Handles purchase errors gracefully
                // Priority: P3 | Effort: M (1-2 days) | Impact: Low (stubbed works in dev)
                // =============================================================================
                try {
                    // Get product info first
                    const products = await NativePurchases.getProducts({
                        productIdentifiers: [PRO_PRODUCT_ID]
                    });
                    
                    const product = products.products.find(p => p.productIdentifier === PRO_PRODUCT_ID);
                    if (!product) {
                        log.error('Product not found in store', { productId: PRO_PRODUCT_ID });
                        return { success: false, error: 'Product not available in store' };
                    }

                    // Initiate purchase
                    const result = await NativePurchases.purchaseProduct({
                        productIdentifier: PRO_PRODUCT_ID
                    });

                    if (result && result.productIdentifier === PRO_PRODUCT_ID) {
                        log.info('Purchase successful', { productId: PRO_PRODUCT_ID });
                        await this._setUnlocked(true);
                        return { success: true };
                    } else {
                        log.warn('Purchase cancelled or failed', result);
                        return { success: false, error: 'Purchase was cancelled or failed' };
                    }
                } catch (iapError) {
                    log.error('Native IAP error', iapError);
                    return { success: false, error: `Purchase failed: ${iapError.message}` };
                }
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
     * Uses @capgo/native-purchases for native platforms
     * @returns {Promise<{ success: boolean, restored: boolean, error?: string }>}
     */
    async restorePurchase() {
        try {
            log.info('Restoring purchase');

            const isNative = await this._isNativePlatform();

            if (isNative) {
                // =============================================================================
                // VERIFIED: [P3][Feature] PURCHASE_MANAGER_RESTORE_INTEGRATION
                // Implementation: Integrated purchase restore via @capgo/native-purchases.
                //   - Calls restorePurchases() to sync with app store receipts
                //   - Checks if PRO_PRODUCT_ID is in restored transactions
                //   - Unlocks pro tier if valid purchase is found
                //   - Handles errors gracefully with user-friendly messages
                // =============================================================================
                try {
                    const result = await NativePurchases.restorePurchases();
                    
                    // Check if our product is in the restored purchases
                    const restoredProduct = result.restoredPurchases.find(
                        p => p.productIdentifier === PRO_PRODUCT_ID
                    );

                    if (restoredProduct) {
                        log.info('Purchase restored', { productId: PRO_PRODUCT_ID });
                        await this._setUnlocked(true);
                        return { success: true, restored: true };
                    } else {
                        log.info('No purchase to restore');
                        return { success: true, restored: false };
                    }
                } catch (restoreError) {
                    log.error('Native restore error', restoreError);
                    return { 
                        success: false, 
                        restored: false, 
                        error: `Restore failed: ${restoreError.message}` 
                    };
                }
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
