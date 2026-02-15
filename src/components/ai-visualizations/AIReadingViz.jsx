/**
 * AIReadingViz - Premium RAG Pipeline Visualization
 * 
 * Beautiful glass-morphism visualization showing AI reading process:
 * - Intent classification (brain pulse)
 * - Document retrieval (flying cards)
 * - Refinery compression (gauge animation)
 * - Context assembly (filling meter)
 * - Generation (streaming tokens)
 * 
 * Compliance: .clinerules §6 - Native feel, premium animations
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Search, FileText, Layers, Sparkles,
    Zap, BookOpen, Scale, Activity, ChevronRight,
    RotateCcw, CheckCircle2, Clock, Database
} from 'lucide-react';
import { HapticsService } from '../../services/HapticsService';

// Stage configurations
const STAGE_CONFIG = {
    intent: {
        icon: Brain,
        label: 'Understanding',
        color: 'from-purple-500 to-indigo-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        description: 'Analyzing your question...'
    },
    retrieval: {
        icon: Search,
        label: 'Retrieving Sources',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        description: 'Finding relevant documents...'
    },
    refinery: {
        icon: Zap,
        label: 'Processing',
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        description: 'Compressing & distilling...'
    },
    context: {
        icon: Layers,
        label: 'Building Context',
        color: 'from-emerald-500 to-green-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        description: 'Assembling information...'
    },
    generation: {
        icon: Sparkles,
        label: 'Generating',
        color: 'from-pink-500 to-rose-500',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        description: 'Creating response...'
    }
};

/**
 * Get icon for dataset store
 */
const getStoreIcon = (store) => {
    switch (store) {
        case 'health_content': return Activity;
        case 'survival_content': return BookOpen;
        case 'law_content': return Scale;
        default: return FileText;
    }
};

/**
 * Get color for dataset
 */
const getStoreColor = (store) => {
    switch (store) {
        case 'health_content': return 'text-red-400 bg-red-500/20 border-red-500/30';
        case 'survival_content': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
        case 'law_content': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
        default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
};

/**
 * Intent Classification Stage
 */
const IntentStage = ({ data }) => {
    const confidence = data?.confidence || 0.7;
    const hasFallback = data?.hasFallback;
    
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center"
                    >
                        <Brain size={16} className="text-white" />
                    </motion.div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {hasFallback ? 'Emergency pattern detected' : 'Question understood'}
                        </p>
                        <p className="text-xs text-slate-400">
                            Intent: {data?.classification || 'general'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="text-sm font-medium text-purple-400">
                        {Math.round(confidence * 100)}%
                    </p>
                </div>
            </div>
            
            {/* Confidence bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
            </div>
        </div>
    );
};

/**
 * Retrieval Stage
 */
const RetrievalStage = ({ data }) => {
    const sources = data?.sources || [];
    const searchMethod = data?.searchMethod || 'keyword';
    
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
                    >
                        <Search size={16} className="text-white" />
                    </motion.div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            Found {data?.count || sources.length} sources
                        </p>
                        <p className="text-xs text-slate-400">
                            Method: {searchMethod}
                        </p>
                    </div>
                </div>
                {searchMethod === 'semantic' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        AI Search
                    </span>
                )}
            </div>
            
            {/* Source cards */}
            <div className="space-y-2 max-h-32 overflow-y-auto premium-scrollbar">
                <AnimatePresence>
                    {sources.slice(0, 4).map((source, i) => {
                        const Icon = getStoreIcon(source.store);
                        const colorClass = getStoreColor(source.store);
                        
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-2 rounded-lg border ${colorClass} bg-opacity-10 flex items-center gap-2`}
                            >
                                <Icon size={14} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate text-slate-200">
                                        {source.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {source.snippet}
                                    </p>
                                </div>
                                {source.score && (
                                    <span className="text-[10px] text-slate-400">
                                        {Math.round(source.score * 100)}%
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Refinery Stage
 */
const RefineryStage = ({ data }) => {
    const ratio = data?.avgCompressionRatio || 1;
    const tokensSaved = data?.tokensSaved || 0;
    const before = data?.totalCharsBefore || 0;
    const after = data?.totalCharsAfter || 0;
    const compressionPercent = before > 0 ? ((before - after) / before * 100) : 0;
    
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
                >
                    <Zap size={16} className="text-white" />
                </motion.div>
                <div>
                    <p className="text-sm font-medium text-white">
                        Content optimized
                    </p>
                    <p className="text-xs text-slate-400">
                        {data?.documentsRefined || 0} documents processed
                    </p>
                </div>
            </div>
            
            {/* Compression gauge */}
            <div className="relative pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Original</span>
                    <span className="text-amber-400">-{Math.round(compressionPercent)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: `${(1 / ratio) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{Math.round(before / 1000)}K chars</span>
                    <span>{Math.round(after / 1000)}K chars</span>
                </div>
            </div>
            
            {tokensSaved > 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                    <Sparkles size={12} />
                    {tokensSaved.toLocaleString()} tokens saved
                </p>
            )}
        </div>
    );
};

/**
 * Context Stage
 */
const ContextStage = ({ data }) => {
    const chunks = data?.chunks || [];
    const totalTokens = data?.totalTokensEstimate || 0;
    const scores = data?.scores || [];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center"
                >
                    <Layers size={16} className="text-white" />
                </motion.div>
                <div>
                    <p className="text-sm font-medium text-white">
                        Context ready
                    </p>
                    <p className="text-xs text-slate-400">
                        {chunks.length} chunks • ~{totalTokens} tokens
                    </p>
                </div>
            </div>
            
            {/* Chunk visualization */}
            <div className="space-y-2">
                {chunks.slice(0, 3).map((chunk, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2"
                    >
                        <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(chunk.score || 0.5) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-500"
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] text-slate-300 truncate">
                                {chunk.title}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 w-12 text-right">
                            {Math.round(chunk.length / 4)}t
                        </span>
                    </motion.div>
                ))}
                {chunks.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                        +{chunks.length - 3} more chunks
                    </p>
                )}
            </div>
            
            {/* Relevance indicator */}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Avg relevance:</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${avgScore * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-emerald-500 rounded-full"
                    />
                </div>
                <span className="text-emerald-400">{Math.round(avgScore * 100)}%</span>
            </div>
        </div>
    );
};

/**
 * Generation Stage
 */
const GenerationStage = ({ data }) => {
    const isGenerating = data?.generating;
    const citations = data?.citations || [];
    
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <motion.div
                    animate={isGenerating ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center"
                >
                    {isGenerating ? (
                        <Sparkles size={16} className="text-white" />
                    ) : (
                        <CheckCircle2 size={16} className="text-white" />
                    )}
                </motion.div>
                <div>
                    <p className="text-sm font-medium text-white">
                        {isGenerating ? 'Creating response...' : 'Response ready'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {citations.length} citations included
                    </p>
                </div>
            </div>
            
            {/* Citation preview */}
            {citations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {citations.slice(0, 5).map((citation, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30"
                        >
                            [{citation.index + 1}] {citation.title.substring(0, 20)}...
                        </motion.span>
                    ))}
                    {citations.length > 5 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                            +{citations.length - 5}
                        </span>
                    )}
                </div>
            )}
            
            {/* Token stream indicator */}
            {isGenerating && (
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="flex gap-1"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    </motion.div>
                    <span className="text-xs text-slate-400">Streaming tokens...</span>
                </div>
            )}
        </div>
    );
};

/**
 * Main AI Reading Visualization Component
 */
const AIReadingViz = ({ stages, isActive, onReplay }) => {
    // Get latest stage data
    const stageData = useMemo(() => {
        const data = {};
        for (const stage of stages) {
            data[stage.stage] = stage.data;
        }
        return data;
    }, [stages]);

    // Get current active stage
    const currentStage = stages[stages.length - 1]?.stage;
    
    // Determine completion status
    const isComplete = stages.some(s => s.stage === 'generation' && !s.data?.generating);

    const handleReplay = () => {
        HapticsService.impact('light');
        onReplay?.();
    };

    return (
        <div className="glass-card p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-white">AI Data Flow</h3>
                </div>
                {isComplete && (
                    <button
                        onClick={handleReplay}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Replay visualization"
                    >
                        <RotateCcw size={14} />
                    </button>
                )}
            </div>

            {/* Stage Timeline */}
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                
                {/* Stages */}
                <div className="space-y-4">
                    {Object.entries(STAGE_CONFIG).map(([stageKey, config], index) => {
                        const stageDataItem = stageData[stageKey];
                        const isCompleted = stages.findIndex(s => s.stage === stageKey) !== -1;
                        const isCurrent = currentStage === stageKey;
                        
                        if (!isCompleted && !isCurrent) return null;
                        
                        const Icon = config.icon;
                        
                        return (
                            <motion.div
                                key={stageKey}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`relative pl-10 ${isCurrent ? 'opacity-100' : 'opacity-70'}`}
                            >
                                {/* Timeline dot */}
                                <motion.div
                                    animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                        isCurrent ? config.bgColor : 'bg-white/10'
                                    } border ${isCurrent ? config.borderColor : 'border-white/10'}`}
                                >
                                    <Icon size={10} className={isCurrent ? `text-${config.color.split('-')[1]}-400` : 'text-slate-400'} />
                                </motion.div>
                                
                                {/* Stage content */}
                                <div className={`p-3 rounded-xl border ${isCurrent ? config.borderColor : 'border-white/5'} ${
                                    isCurrent ? config.bgColor : 'bg-white/5'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-medium bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                                            {config.label}
                                        </span>
                                        {isCurrent && isActive && (
                                            <motion.span
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="text-[10px] text-slate-400"
                                            >
                                                {config.description}
                                            </motion.span>
                                        )}
                                    </div>
                                    
                                    {/* Stage-specific visualization */}
                                    {stageKey === 'intent' && stageDataItem && (
                                        <IntentStage data={stageDataItem} />
                                    )}
                                    {stageKey === 'retrieval' && stageDataItem && (
                                        <RetrievalStage data={stageDataItem} />
                                    )}
                                    {stageKey === 'refinery' && stageDataItem && (
                                        <RefineryStage data={stageDataItem} />
                                    )}
                                    {stageKey === 'context' && stageDataItem && (
                                        <ContextStage data={stageDataItem} />
                                    )}
                                    {stageKey === 'generation' && stageDataItem && (
                                        <GenerationStage data={stageDataItem} />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Status footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    {isActive ? (
                        <>
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-blue-400"
                            />
                            <span>Processing...</span>
                        </>
                    ) : isComplete ? (
                        <>
                            <CheckCircle2 size={12} className="text-green-400" />
                            <span>Complete</span>
                        </>
                    ) : (
                        <span>Ready</span>
                    )}
                </div>
                <span>{stages.length} stages</span>
            </div>
        </div>
    );
};

export default AIReadingViz;