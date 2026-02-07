/**
 * ProUnlockBanner - Gradient banner prompting users to unlock pro AI models
 *
 * Shows above pro-locked models with:
 * - Feature list
 * - "Unlock All AI Models" CTA button
 * - "Restore Purchase" link
 */

import React, { useState } from 'react';
import { Sparkles, Lock, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { PurchaseManager } from '../services/ai/PurchaseManager';
import { createLogger } from '../utils/logger';

const log = createLogger('ProUnlockBanner');

const ProUnlockBanner = ({ onUnlocked }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState(null);

    const purchaseInfo = PurchaseManager.getPurchaseInfo();

    const handlePurchase = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const result = await PurchaseManager.purchasePro();
            if (result.success) {
                PurchaseManager.clearCache();
                if (onUnlocked) onUnlocked();
            } else {
                setError(result.error || 'Purchase failed');
            }
        } catch (err) {
            log.error('Purchase error', err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        setError(null);

        try {
            const result = await PurchaseManager.restorePurchase();
            if (result.success && result.restored) {
                PurchaseManager.clearCache();
                if (onUnlocked) onUnlocked();
            } else if (!result.restored) {
                setError('No previous purchase found');
            }
        } catch (err) {
            log.error('Restore error', err);
            setError(err.message);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-blue-600/20 border border-purple-500/30 p-5">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 opacity-10">
                <Sparkles size={100} className="text-purple-400" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <Lock size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100">Unlock Pro Models</h3>
                        <p className="text-xs text-slate-400">One-time purchase &bull; {purchaseInfo.price}</p>
                    </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-4">
                    {purchaseInfo.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <Sparkles size={12} className="text-purple-400 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>

                {/* Error message */}
                {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-3">
                        {error}
                    </div>
                )}

                {/* CTA buttons */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handlePurchase}
                        disabled={isProcessing || isRestoring}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Unlock All AI Models &mdash; {purchaseInfo.price}
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleRestore}
                        disabled={isProcessing || isRestoring}
                        className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors py-1 disabled:opacity-50"
                    >
                        {isRestoring ? (
                            <>
                                <Loader2 size={12} className="animate-spin" />
                                Restoring...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={12} />
                                Restore Purchase
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProUnlockBanner;
