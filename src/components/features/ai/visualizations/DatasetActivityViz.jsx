/**
 * DatasetActivityViz - Real-time Dataset Usage Visualization
 * 
 * Premium glass-morphism visualization showing:
 * - Active datasets with glowing indicators
 * - Query hit counters per dataset
 * - Real-time activity pulses
 * - Category-based color coding
 * - Search method indicators (semantic vs keyword)
 * 
 * Compliance: .clinerules §6 - Native feel, premium animations
 */

import React, { useMemo } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, BookOpen, Scale, Heart, Database,
    Zap, Search, Brain, ChevronRight, Sparkles,
    TrendingUp, Clock, BarChart3
} from 'lucide-react';
import { HapticsService } from '../../services/HapticsService';

// Dataset configurations with colors
const DATASET_CONFIG = {
    health: {
        id: 'health',
        name: 'Health & Medical',
        icon: Heart,
        color: 'from-red-500 to-rose-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        glowColor: 'shadow-red-500/30',
        textColor: 'text-red-400',
        description: 'Medical emergencies, first aid'
    },
    survival: {
        id: 'survival',
        name: 'Survival Skills',
        icon: BookOpen,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        glowColor: 'shadow-amber-500/30',
        textColor: 'text-amber-400',
        description: 'Wilderness, shelter, navigation'
    },
    law: {
        id: 'law',
        name: 'Legal Rights',
        icon: Scale,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        glowColor: 'shadow-blue-500/30',
        textColor: 'text-blue-400',
        description: 'PACE, rights, procedures'
    },
    guides: {
        id: 'guides',
        name: 'General Guides',
        icon: Database,
        color: 'from-slate-500 to-gray-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        glowColor: 'shadow-slate-500/30',
        textColor: 'text-slate-400',
        description: 'Reference, preparedness'
    }
};

/**
 * Individual Dataset Card
 */
const DatasetCard = ({
    dataset,
    isActive,
    hitCount,
    isSearching,
    searchMethod,
    lastQuery,
    onToggle
}) => {
    const config = DATASET_CONFIG[dataset.id] || DATASET_CONFIG.guides;
    const Icon = config.icon;

    const handleClick = () => {
        HapticsService.impact('light');
        onToggle?.(dataset.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
                relative rounded-xl border p-3 transition-all duration-300 cursor-pointer
                ${isActive ? config.bgColor : 'bg-white/5'}
                ${isActive ? config.borderColor : 'border-white/10'}
                ${isActive ? config.glowColor : ''}
                ${isSearching ? 'ring-2 ring-white/20' : ''}
                hover:border-white/20
            `}
            onClick={handleClick}
        >
            {/* Active glow effect */}
            {isActive && isSearching && (
                <motion.div
                    className={`absolute -inset-px rounded-xl bg-gradient-to-r ${config.color} opacity-20 blur-md`}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}

            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isActive ? 'bg-gradient-to-br ' + config.color : 'bg-white/5'}
                    `}>
                        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                    </div>

                    {/* Hit counter */}
                    <div className="text-right">
                        <motion.div
                            key={hitCount}
                            initial={{ scale: 1.5, color: '#fff' }}
                            animate={{ scale: 1, color: 'inherit' }}
                            className={`text-lg font-bold ${isActive ? config.textColor : 'text-slate-500'}`}
                        >
                            {hitCount}
                        </motion.div>
                        <p className="text-[10px] text-slate-500">hits</p>
                    </div>
                </div>

                {/* Name & Description */}
                <h4 className={`text-sm font-semibold mb-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {config.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">
                    {config.description}
                </p>

                {/* Search method indicator */}
                {isActive && isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-1.5"
                    >
                        {searchMethod === 'semantic' ? (
                            <>
                                <Brain size={10} className="text-purple-400" />
                                <span className="text-[10px] text-purple-400">AI Search</span>
                            </>
                        ) : (
                            <>
                                <Search size={10} className={config.textColor} />
                                <span className={`text-[10px] ${config.textColor}`}>Keyword</span>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Last query preview */}
                {lastQuery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 pt-2 border-t border-white/5"
                    >
                        <p className="text-[10px] text-slate-500 truncate">
                            "{lastQuery}"
                        </p>
                    </motion.div>
                )}

                {/* Activity indicator */}
                {isActive && (
                    <motion.div
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${config.textColor.replace('text-', 'bg-')}`}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </div>
        </motion.div>
    );
};

/**
 * Activity Stats Panel
 */
const ActivityStats = ({ stats }) => {
    const {
        totalHits = 0,
        activeDatasets = 0,
        totalDatasets = 0,
        avgResponseTime = 0,
        semanticSearches = 0,
        keywordSearches = 0
    } = stats;

    return (
        <div className="glass-card p-3 space-y-3">
            <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-slate-400" />
                <h4 className="text-xs font-semibold text-white">Session Stats</h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">{totalHits}</p>
                    <p className="text-[10px] text-slate-500">Total Hits</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-emerald-400">{avgResponseTime}ms</p>
                    <p className="text-[10px] text-slate-500">Avg Response</p>
                </div>
            </div>

            {/* Search method breakdown */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">AI Search</span>
                    <span className="text-purple-400">{semanticSearches}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalHits > 0 ? (semanticSearches / totalHits) * 100 : 0}%` }}
                        className="h-full bg-purple-500 rounded-full"
                    />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Keyword</span>
                    <span className="text-blue-400">{keywordSearches}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalHits > 0 ? (keywordSearches / totalHits) * 100 : 0}%` }}
                        className="h-full bg-blue-500 rounded-full"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500">
                    {activeDatasets}/{totalDatasets} active
                </span>
                <div className="flex gap-1">
                    {Array.from({ length: totalDatasets }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i < activeDatasets ? 'bg-green-400' : 'bg-slate-600'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Recent Queries List
 */
const RecentQueries = ({ queries }) => {
    return (
        <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <h4 className="text-xs font-semibold text-white">Recent Queries</h4>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto premium-scrollbar">
                <AnimatePresence>
                    {queries.slice(0, 5).map((query, i) => (
                        <motion.div
                            key={query.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className={`
                                w-1.5 h-1.5 rounded-full
                                ${query.method === 'semantic' ? 'bg-purple-400' : 'bg-blue-400'}
                            `} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-slate-300 truncate">
                                    {query.text}
                                </p>
                                <p className="text-[9px] text-slate-500">
                                    {query.timestamp}
                                </p>
                            </div>
                            {query.hits > 0 && (
                                <span className="text-[10px] text-emerald-400">
                                    {query.hits} hits
                                </span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {queries.length === 0 && (
                    <p className="text-[10px] text-slate-500 text-center py-2">
                        No queries yet
                    </p>
                )}
            </div>
        </div>
    );
};

/**
 * Main Dataset Activity Visualization
 */
const DatasetActivityViz = ({
    datasets = [],
    activity = {},
    queries = [],
    onDatasetToggle,
    className = ''
}) => {
    // Calculate stats
    const stats = useMemo(() => {
        const activeDatasets = datasets.filter(d => d.enabled).length;
        const totalHits = Object.values(activity).reduce((sum, a) => sum + (a.hits || 0), 0);
        const semanticSearches = queries.filter(q => q.method === 'semantic').length;
        const keywordSearches = queries.filter(q => q.method === 'keyword').length;

        return {
            totalHits,
            activeDatasets,
            totalDatasets: datasets.length,
            avgResponseTime: 245, // Mock value
            semanticSearches,
            keywordSearches
        };
    }, [datasets, activity, queries]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-white">Dataset Activity</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <TrendingUp size={12} />
                    <span>Live</span>
                </div>
            </div>

            {/* Dataset Grid */}
            <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                    {datasets.map((dataset) => (
                        <DatasetCard
                            key={dataset.id}
                            dataset={dataset}
                            isActive={dataset.enabled}
                            hitCount={activity[dataset.id]?.hits || 0}
                            isSearching={activity[dataset.id]?.searching || false}
                            searchMethod={activity[dataset.id]?.method}
                            lastQuery={activity[dataset.id]?.lastQuery}
                            onToggle={onDatasetToggle}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Stats & Recent Queries */}
            <div className="grid grid-cols-1 gap-3">
                <ActivityStats stats={stats} />
                <RecentQueries queries={queries} />
            </div>

            {/* Info footer */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/5">
                <Zap size={10} />
                <span>Datasets are queried based on question intent</span>
            </div>
        </div>
    );
};

export default DatasetActivityViz;