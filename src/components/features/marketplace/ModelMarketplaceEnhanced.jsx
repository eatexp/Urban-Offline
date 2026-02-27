/**
 * ModelMarketplaceEnhanced - Premium Device-Adaptive AI Model Store
 * 
 * Enhanced version with:
 * - Intelligent device-aware sorting (optimal models first)
 * - "Choose Any" functionality with tiered warnings
 * - Premium glass morphism UI
 * - Model comparison feature
 * - Advanced filtering and sorting
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 *             .clinerules §6 - 48px+ touch targets
 *             .clinerules §2 - Battery-aware AI
 */

import React from 'react';
import { ChevronRight, ArrowUpRight, Scale, Lock, Unlock, RotateCcw, Info } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useModelMarketplace } from '../hooks/useModelMarketplace';

// Components
import DeviceStatusBar from './marketplace/DeviceStatusBar';
import FilterBar from './marketplace/FilterBar';
import ModelCardEnhanced from './marketplace/ModelCardEnhanced';
import { Loader2 } from 'lucide-react';

const ModelMarketplaceEnhanced = () => {

    // Use custom hook for all logic
    const {
        activeTab,
        setActiveTab,
        sortBy,
        setSortBy,
        deviceProfile,
        isProfiling,
        filteredModels,
        installedModels,
        activeModel,
        downloadProgress,
        downloadStatus,
        resumeInfo,
        error,
        handleDownload,
        handleResume,
        handleSelect,
        handleDelete,
        refreshModels
    } = useModelMarketplace();

    // Unlock "Choose Any" mode (easter egg / pro feature)
    const [allowAnyDownload, setAllowAnyDownload] = React.useState(false);
    const unlockClickCount = React.useRef(0);

    const handleTitleClick = () => {
        unlockClickCount.current += 1;
        if (unlockClickCount.current === 7) {
            setAllowAnyDownload(prev => !prev);
            unlockClickCount.current = 0;
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 rounded-full bg-red-500/10 mb-4">
                    <Info size={32} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Marketplace Unavailable</h3>
                <p className="text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden">
            {/* 1. Device Status Bar */}
            <DeviceStatusBar profile={deviceProfile} />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-24">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div onClick={handleTitleClick} className="cursor-pointer select-none">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Model Marketplace
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Download AI models optimized for offline use
                            </p>
                        </div>
                        {allowAnyDownload && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium animate-pulse">
                                <Unlock size={12} />
                                Safety Limits Unlocked
                            </div>
                        )}
                    </div>

                    {/* 2. Filter & Sort Controls */}
                    <FilterBar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />

                    {/* Models Grid */}
                    {isProfiling ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 size={40} className="text-blue-400 animate-spin" />
                            <p className="text-slate-400 text-sm">Analyzing device capabilities...</p>
                        </div>
                    ) : filteredModels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence mode='popLayout'>
                                {filteredModels.map((model, index) => (
                                    <ModelCardEnhanced
                                        key={model.id}
                                        model={model}
                                        index={index}
                                        deviceProfile={deviceProfile}
                                        isInstalled={installedModels.includes(model.id)}
                                        isActive={activeModel === model.id}
                                        isDownloading={!!downloadProgress[model.id]}
                                        downloadProgress={downloadProgress[model.id] || 0}
                                        downloadStatus={downloadStatus[model.id] || ''}
                                        resumeInfo={resumeInfo[model.id]}
                                        onDownload={handleDownload}
                                        onResume={handleResume}
                                        onSelect={handleSelect}
                                        onDelete={handleDelete}
                                        allowAnyDownload={allowAnyDownload}
                                        showCompatibility={true}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                                <Info size={32} className="text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-300">No models found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                Try adjusting your filters or checking your internet connection.
                            </p>
                            <button
                                onClick={refreshModels}
                                className="mt-6 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors inline-flex items-center gap-2"
                            >
                                <RotateCcw size={14} />
                                Refresh
                            </button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-12 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Scale size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">How are scores calculated?</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Compatibility scores (0-100%) are calculated locally based on your device's RAM, available storage, battery level, and GPU capabilities.
                                    We recommend models with <span className="text-green-400 font-medium">85%+ score</span> for the best offline experience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add padding at bottom for safe area */}
                    <div className="h-4" />
                </div>
            </div>
        </div>
    );
};

export default ModelMarketplaceEnhanced;