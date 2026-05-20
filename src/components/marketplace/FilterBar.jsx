/**
 * FilterBar Component
 * 
 * Handles filtering (tabs) and sorting (dropdown) for the Model Marketplace.
 */

import React from 'react';
import { Filter, Sparkles, Zap, Brain, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion, AnimatePresence } from 'framer-motion';

const FilterBar = ({
    activeTab,
    onTabChange,
    sortBy,
    onSortChange
}) => {
    // Dropdown state would be managed here or passed in if complex
    // For simplicity, we'll keep the select element approach unless a custom dropdown is needed
    // The original code used a native select for simplicity, let's stick to that for robust behavior

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            {/* Tabs */}
            <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
                <button
                    onClick={() => onTabChange('recommended')}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recommended' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                    {activeTab === 'recommended' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white/10 rounded-lg shadow-sm backdrop-blur-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Sparkles size={16} className={activeTab === 'recommended' ? 'text-amber-400' : ''} />
                    <span className="relative z-10">Recommended</span>
                </button>

                <button
                    onClick={() => onTabChange('fast')}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'fast' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                    {activeTab === 'fast' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white/10 rounded-lg shadow-sm backdrop-blur-sm"
                        />
                    )}
                    <Zap size={16} className={activeTab === 'fast' ? 'text-green-400' : ''} />
                    <span className="relative z-10">Fast</span>
                </button>

                <button
                    onClick={() => onTabChange('quality')}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quality' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                    {activeTab === 'quality' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white/10 rounded-lg shadow-sm backdrop-blur-sm"
                        />
                    )}
                    <Brain size={16} className={activeTab === 'quality' ? 'text-purple-400' : ''} />
                    <span className="relative z-10">Quality</span>
                </button>
            </div>

            {/* Sort Control */}
            <div className="relative w-full sm:w-auto">
                <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    aria-label="Sort models"
                    className="w-full sm:w-auto appearance-none bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-10 text-sm text-slate-300 focus:outline-none focus:border-white/20 transition-colors cursor-pointer hover:bg-white/5"
                >
                    <option value="compatibility">Sort by Compatibility</option>
                    <option value="quality">Sort by Quality</option>
                    <option value="size_asc">Sort by Size (Smallest)</option>
                    <option value="size_desc">Sort by Size (Largest)</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
};

export default FilterBar;
