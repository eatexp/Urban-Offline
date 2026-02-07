/**
 * AIModels - Dedicated AI Model Management Page
 *
 * Locally AI-style marketplace for browsing, downloading, and managing
 * local AI models. Features:
 * - Model cards with tier badges (Free/Pro)
 * - Storage usage indicator
 * - Filter tabs (All, Installed, Free, Pro, Fast, Quality)
 * - Pro unlock banner for locked models
 * - Local model import dialog
 * - Legacy models collapsible section
 * - Link to AI Chat for using models
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Brain, HardDrive, Upload, Loader2, AlertCircle,
    Check, MessageSquare, ChevronDown, ChevronRight,
    Sparkles, WifiOff, Wifi
} from 'lucide-react';
import { AIModelManager } from '../services/ai/AIModelManager';
import { PurchaseManager } from '../services/ai/PurchaseManager';
import { ModelImporter } from '../services/ai/ModelImporter';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { LEGACY_MODELS } from '../services/ai/AIArchitecture';
import ModelCard from '../components/ModelCard';
import ProUnlockBanner from '../components/ProUnlockBanner';
import ModelImportDialog from '../components/ModelImportDialog';
import { createLogger } from '../utils/logger';
import { triggerHaptic } from '../utils/haptics';

const log = createLogger('AIModels');

const AIModels = () => {
    // State
    const [models, setModels] = useState([]);
    const [importedModels, setImportedModels] = useState([]);
    const [installedModels, setInstalledModels] = useState(new Set());
    const [activeModel, setActiveModel] = useState(null);
    const [downloadingModel, setDownloadingModel] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [storageUsed, setStorageUsed] = useState({ bytes: 0, display: '0 MB', modelCount: 0 });
    const [filter, setFilter] = useState('all');
    const [recommendedModel, setRecommendedModel] = useState(null);
    const [isProUnlocked, setIsProUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showLegacy, setShowLegacy] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [error, setError] = useState(null);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // Check capabilities
                const capabilities = await AIModelManager.init();
                if (capabilities?.recommendedModel) {
                    setRecommendedModel(capabilities.recommendedModel.id);
                }

                // Check pro status
                const proStatus = await PurchaseManager.isProUnlocked();
                setIsProUnlocked(proStatus);

                // Load models
                await refreshModels();

            } catch (err) {
                log.error('Init failed', err);
                setError('Failed to initialize model manager');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Online/offline listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const refreshModels = useCallback(async () => {
        try {
            // Get all models with install status
            const allModels = await AIModelManager.getAvailableModels();
            setModels(allModels);

            // Track installed
            const installed = new Set(allModels.filter(m => m.isInstalled).map(m => m.id));
            setInstalledModels(installed);

            // Active model
            setActiveModel(AIModelManager.getCurrentModel());

            // Storage usage
            const usage = await AIModelManager.getStorageUsage();
            setStorageUsed(usage);

            // Imported models
            const imported = await ModelImporter.getImportedModels();
            setImportedModels(imported);

        } catch (err) {
            log.error('Failed to refresh models', err);
        }
    }, []);

    // Handle download
    const handleDownload = async (modelId) => {
        triggerHaptic('medium');
        setDownloadingModel(modelId);
        setDownloadProgress(0);

        const result = await AIModelManager.downloadModel(modelId, (progress, _message) => {
            setDownloadProgress(progress);
        });

        if (result.success) {
            setInstalledModels(prev => new Set([...prev, modelId]));
            await refreshModels();
            triggerHaptic('heavy');
        } else if (result.requiresPro) {
            // Scroll to unlock banner
            setFilter('all');
            triggerHaptic('light');
        } else {
            setError(result.error);
            setTimeout(() => setError(null), 3000);
        }

        setDownloadingModel(null);
    };

    // Handle model select
    const handleSelect = async (modelId) => {
        triggerHaptic('light');
        const result = await AIModelManager.loadModel(modelId, () => {});

        if (result.success) {
            setActiveModel(modelId);
            triggerHaptic('medium');
        }
    };

    // Handle delete
    const handleDelete = async (modelId) => {
        triggerHaptic('medium');
        const result = await AIModelManager.deleteModel(modelId);

        if (result.success) {
            setInstalledModels(prev => {
                const next = new Set(prev);
                next.delete(modelId);
                return next;
            });
            if (activeModel === modelId) setActiveModel(null);
            await refreshModels();
        }
    };

    // Handle imported model delete
    const handleDeleteImported = async (modelId) => {
        triggerHaptic('medium');
        const result = await ModelImporter.deleteImportedModel(modelId);
        if (result.success) {
            await refreshModels();
        }
    };

    // Handle pro unlock
    const handleProUnlocked = async () => {
        setIsProUnlocked(true);
        PurchaseManager.clearCache();
        triggerHaptic('heavy');
    };

    // Handle import complete
    const handleModelImported = async () => {
        await refreshModels();
        triggerHaptic('heavy');
    };

    // Filter models
    const allTransformersModels = Object.values(TRANSFORMERS_MODELS);
    const filteredModels = allTransformersModels.filter(model => {
        if (model.legacy) return false; // Legacy handled separately
        if (filter === 'all') return true;
        if (filter === 'installed') return installedModels.has(model.id);
        if (filter === 'free') return model.tier === 'free';
        if (filter === 'pro') return model.tier === 'pro';
        return model.category === filter;
    });

    // Check if there are any pro models that need unlocking
    const hasLockedProModels = !isProUnlocked && allTransformersModels.some(m => m.tier === 'pro');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin mb-4 text-purple-400" size={36} />
                <p className="text-slate-400">Loading models...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-slide-up pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Brain size={28} className="text-purple-400" />
                        AI Models
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Download and manage local AI models
                    </p>
                </div>

                {/* Online indicator */}
                <div className="flex items-center gap-1.5 text-xs">
                    {isOnline ? (
                        <>
                            <Wifi size={14} className="text-green-400" />
                            <span className="text-green-400">Online</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={14} className="text-orange-400" />
                            <span className="text-orange-400">Offline</span>
                        </>
                    )}
                </div>
            </div>

            {/* Storage info */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <HardDrive size={20} className="text-slate-400" />
                <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">
                        {storageUsed.display} used
                    </div>
                    <div className="text-xs text-slate-500">
                        {storageUsed.modelCount} model{storageUsed.modelCount !== 1 ? 's' : ''} installed
                        {importedModels.length > 0 && ` + ${importedModels.length} imported`}
                    </div>
                </div>

                {/* Go to chat */}
                <Link
                    to="/ai"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all"
                >
                    <MessageSquare size={14} />
                    Chat
                </Link>
            </div>

            {/* Offline capability badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/[0.08] border border-green-500/15 text-xs">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-400" />
                </div>
                <div className="text-slate-400">
                    <span className="text-green-400 font-semibold">Works offline</span>
                    {' '}with your downloaded content
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Pro Unlock Banner */}
            {hasLockedProModels && (
                <ProUnlockBanner onUnlocked={handleProUnlocked} />
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'installed', label: 'Installed' },
                    { id: 'free', label: 'Free' },
                    { id: 'pro', label: 'Pro' },
                    { id: 'lightweight', label: 'Fast' },
                    { id: 'quality', label: 'Quality' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setFilter(tab.id);
                            triggerHaptic('light');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            filter === tab.id
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                        {tab.id === 'installed' && installedModels.size > 0 && (
                            <span className={`ml-1.5 text-xs px-1.5 rounded-full ${
                                filter === tab.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-purple-500/20 text-purple-400'
                            }`}>
                                {installedModels.size}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Model list */}
            <div className="space-y-3">
                {filteredModels.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle size={36} className="mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-500">
                            {filter === 'installed'
                                ? 'No models installed yet'
                                : `No ${filter} models available`}
                        </p>
                        {filter === 'installed' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-3 text-sm text-purple-400 hover:text-purple-300"
                            >
                                Browse all models
                            </button>
                        )}
                    </div>
                ) : (
                    filteredModels.map(model => (
                        <ModelCard
                            key={model.id}
                            model={model}
                            isInstalled={installedModels.has(model.id)}
                            isActive={activeModel === model.id}
                            isDownloading={downloadingModel === model.id}
                            downloadProgress={downloadingModel === model.id ? downloadProgress : 0}
                            onDownload={handleDownload}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            deviceRecommended={recommendedModel === model.id}
                            isProLocked={model.tier === 'pro' && !isProUnlocked}
                            onUnlockClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        />
                    ))
                )}
            </div>

            {/* Imported Models Section */}
            {importedModels.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Imported Models
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                    </div>

                    {importedModels.map(model => (
                        <ModelCard
                            key={model.id}
                            model={{
                                ...model,
                                category: 'imported',
                                sizeDisplay: model.sizeDisplay || '—',
                                source: 'local'
                            }}
                            isInstalled={true}
                            isActive={activeModel === model.id}
                            isDownloading={false}
                            downloadProgress={0}
                            onDownload={() => {}}
                            onSelect={handleSelect}
                            onDelete={handleDeleteImported}
                            isProLocked={false}
                        />
                    ))}
                </div>
            )}

            {/* Legacy Models Section */}
            {LEGACY_MODELS.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowLegacy(!showLegacy)}
                        className="flex items-center gap-2 w-full text-left py-2"
                    >
                        {showLegacy ? (
                            <ChevronDown size={16} className="text-slate-500" />
                        ) : (
                            <ChevronRight size={16} className="text-slate-500" />
                        )}
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Legacy Models ({LEGACY_MODELS.length})
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                    </button>

                    {showLegacy && (
                        <div className="space-y-3 mt-2">
                            {LEGACY_MODELS.map(model => (
                                <ModelCard
                                    key={model.id}
                                    model={model}
                                    isInstalled={installedModels.has(model.id)}
                                    isActive={activeModel === model.id}
                                    isDownloading={false}
                                    downloadProgress={0}
                                    onDownload={handleDownload}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                    isProLocked={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Import button */}
            <button
                onClick={() => {
                    setShowImportDialog(true);
                    triggerHaptic('light');
                }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-dashed border-white/15 text-slate-400 hover:text-slate-300 hover:border-white/25 hover:bg-white/[0.02] transition-all text-sm font-medium"
            >
                <Upload size={18} />
                Import Custom Model (.onnx)
            </button>

            {/* Import dialog */}
            <ModelImportDialog
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                onImported={handleModelImported}
            />
        </div>
    );
};

export default AIModels;
