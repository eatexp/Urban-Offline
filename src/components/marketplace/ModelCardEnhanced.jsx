/**
 * ModelCardEnhanced Component
 * 
 * Displays individual AI models with rich metadata, compatibility scores,
 * and interactive controls (Download, Delete, Select).
 */

import React, { useState, useEffect } from 'react';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    X, ChevronRight, Sparkles, AlertCircle, AlertTriangle,
    Play, Info, CheckCircle2, Gauge
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion, AnimatePresence } from 'framer-motion';
import { HapticsService, ImpactStyle, NotificationType } from '../../services/HapticsService';
import HighStakesDeleteModal, { requiresHighStakesDelete } from '../HighStakesDeleteModal';
import { calculateCompatibilityScore, getModelWarningLevel } from '../../hooks/useModelMarketplace';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Premium Performance Badge
 */
const PerformanceBadge = ({ score, estimatedSpeed, warning, severity }) => {
    const getBadgeConfig = () => {
        if (score >= 85) return {
            icon: Sparkles,
            gradient: 'from-amber-400 via-orange-400 to-amber-400',
            bg: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
            text: 'Perfect Match',
            glow: 'shadow-orange-500/30'
        };
        if (score >= 70) return {
            icon: CheckCircle2,
            gradient: 'from-green-400 to-emerald-400',
            bg: 'from-green-500/20 to-emerald-500/20',
            text: 'Excellent',
            glow: 'shadow-green-500/20'
        };
        if (score >= 50) return {
            icon: Check,
            gradient: 'from-blue-400 to-cyan-400',
            bg: 'from-blue-500/20 to-cyan-500/20',
            text: 'Good',
            glow: 'shadow-blue-500/20'
        };
        if (score >= 30) return {
            icon: AlertCircle,
            gradient: 'from-yellow-400 to-amber-400',
            bg: 'from-yellow-500/20 to-amber-500/20',
            text: 'Fair',
            glow: 'shadow-yellow-500/20'
        };
        return {
            icon: AlertTriangle,
            gradient: 'from-red-400 to-rose-400',
            bg: 'from-red-500/20 to-rose-500/20',
            text: 'Limited',
            glow: 'shadow-red-500/20'
        };
    };

    const config = getBadgeConfig();
    const Icon = config.icon;

    return (
        <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.bg} border border-white/10 backdrop-blur-sm`}>
                <Icon size={14} className={`text-${config.gradient.includes('amber') ? 'amber' : config.gradient.includes('green') ? 'green' : config.gradient.includes('blue') ? 'blue' : config.gradient.includes('yellow') ? 'yellow' : 'red'}-400`} />
                <div className="flex flex-col">
                    <span className={`text-xs font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                        {config.text}
                    </span>
                </div>
            </div>

            {estimatedSpeed && score >= 50 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Gauge size={12} />
                    <span>~{estimatedSpeed} tokens/sec</span>
                </div>
            )}

            {warning && (
                <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : severity === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}
                >
                    <Icon size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{warning}</span>
                </motion.div>
            )}
        </div>
    );
};

/**
 * Category Badge
 */
const CategoryBadge = ({ category }) => {
    const configs = {
        lightweight: {
            icon: Zap,
            gradient: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            text: 'text-green-400',
            label: 'Fast'
        },
        balanced: {
            icon: Gauge,
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            label: 'Balanced'
        },
        quality: {
            icon: Brain,
            gradient: 'from-purple-500/20 to-indigo-500/20',
            border: 'border-purple-500/30',
            text: 'text-purple-400',
            label: 'Quality'
        }
    };

    const config = configs[category] || configs.balanced;
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${config.gradient} border ${config.border} backdrop-blur-sm`}>
            <Icon size={12} className={config.text} />
            <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        </div>
    );
};

/**
 * Animated Progress Ring
 */
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, status }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const getStatusColor = () => {
        if (status === 'verifying') return 'text-amber-400';
        if (status === 'paused') return 'text-yellow-400';
        if (progress >= 90) return 'text-green-400';
        return 'text-blue-400';
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-500 ease-out ${getStatusColor()}`}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                />
            </svg>
            {status === 'verifying' && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 size={20} className="text-amber-400" />
                </motion.div>
            )}
        </div>
    );
};

/**
 * Warning Modal for "Choose Any"
 */
const WarningModal = ({ model, warning, onConfirm, onCancel }) => {
    if (!warning || warning.level === 'none') return null;

    const getIcon = () => {
        switch (warning.level) {
            case 'critical': return <AlertTriangle size={32} className="text-red-400" />;
            case 'severe': return <AlertTriangle size={32} className="text-orange-400" />;
            case 'warning': return <AlertCircle size={32} className="text-yellow-400" />;
            default: return <Info size={32} className="text-blue-400" />;
        }
    };

    const getTitle = () => {
        switch (warning.level) {
            case 'critical': return 'Model May Not Run';
            case 'severe': return 'Significant Performance Impact';
            case 'warning': return 'Performance Warning';
            default: return 'Heads Up';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="glass-card max-w-md w-full p-6 space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    {getIcon()}
                    <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                    {warning.message}
                </p>

                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Model Size</span>
                        <span className="text-white font-medium">{model.sizeDisplay}</span>
                    </div>
                    {warning.batteryImpact && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Battery Impact</span>
                            <span className={`font-medium ${warning.batteryImpact === 'high' ? 'text-red-400' :
                                warning.batteryImpact === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                {warning.batteryImpact.charAt(0).toUpperCase() + warning.batteryImpact.slice(1)}
                            </span>
                        </div>
                    )}
                    {warning.performanceImpact && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Performance</span>
                            <span className={`font-medium ${warning.performanceImpact === 'severe' ? 'text-red-400' :
                                warning.performanceImpact === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                {warning.performanceImpact.charAt(0).toUpperCase() + warning.performanceImpact.slice(1)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${warning.level === 'critical'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                            }`}
                    >
                        {warning.level === 'critical' ? 'Try Anyway' : 'Download'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ModelCardEnhanced = ({
    model,
    deviceProfile,
    isInstalled,
    isActive,
    isDownloading,
    downloadProgress,
    downloadStatus,
    resumeInfo,
    onDownload,
    onResume,
    onSelect,
    onDelete,
    index,
    showCompatibility = true,
    allowAnyDownload = false
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [showHighStakesDelete, setShowHighStakesDelete] = useState(false);
    const [compatibilityInfo, setCompatibilityInfo] = useState(null);

    // Analyze compatibility effect
    useEffect(() => {
        const analyze = async () => {
            const score = calculateCompatibilityScore(model, deviceProfile);
            const warning = getModelWarningLevel(model, deviceProfile);

            // Estimate tokens/sec based on tier
            let estimatedSpeed = null;
            if (warning.canRun && deviceProfile) {
                const tier = deviceProfile.recommendations?.tier || 'standard';
                const baseSpeed = {
                    'essential': 15,
                    'standard': 25,
                    'advanced': 45,
                    'pro': 80
                }[tier] || 25;

                const sizeFactor = Math.max(0.3, 1 - (model.size / 2000000000));
                estimatedSpeed = Math.round(baseSpeed * sizeFactor);
            }

            setCompatibilityInfo({
                score,
                warning,
                estimatedSpeed,
                canRun: warning.canRun
            });
        };

        analyze();
    }, [model, deviceProfile]);

    const handleDownloadClick = () => {
        if (!allowAnyDownload && compatibilityInfo?.warning?.level !== 'none') {
            setShowWarning(true);
            HapticsService.notification(NotificationType.Warning);
        } else {
            HapticsService.impact(ImpactStyle.Medium);
            onDownload(model.id);
        }
    };

    const handleConfirmDownload = () => {
        setShowWarning(false);
        HapticsService.impact(ImpactStyle.Medium);
        onDownload(model.id);
    };

    const handleSelect = () => {
        HapticsService.selection();
        onSelect(model.id);
    };

    const handleDeleteClick = () => {
        // Check if high-stakes deletion is required
        if (requiresHighStakesDelete(model)) {
            setShowHighStakesDelete(true);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = async () => {
        HapticsService.notification(NotificationType.Warning);
        await onDelete(model.id);
        setShowDeleteConfirm(false);
    };

    const handleHighStakesConfirm = async () => {
        await onDelete(model.id);
        setShowHighStakesDelete(false);
    };

    const isOptimal = compatibilityInfo?.score >= 85;
    const isIncompatible = !compatibilityInfo?.canRun;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                className={`
                    relative rounded-2xl border p-5 transition-all duration-300
                    ${isActive
                        ? 'bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'glass-card hover:border-white/20'
                    }
                    ${isOptimal ? 'ring-1 ring-orange-500/30' : ''}
                    ${isIncompatible ? 'opacity-60' : ''}
                `}
            >
                {/* Optimal Glow */}
                {isOptimal && (
                    <motion.div
                        className="absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 blur-sm"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="font-bold text-lg text-white truncate">
                                    {model.name}
                                </h3>
                                <CategoryBadge category={model.category} />
                                {model.isNew && (
                                    <span className="badge-premium badge-premium-blue bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        New
                                    </span>
                                )}
                                {model.tier === 'pro' && (
                                    <span className="badge-premium badge-premium-gold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        <Sparkles size={10} />
                                        Pro
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                                {model.description}
                            </p>

                            {/* Compatibility Badge */}
                            {showCompatibility && compatibilityInfo && (
                                <PerformanceBadge
                                    score={compatibilityInfo.score}
                                    estimatedSpeed={compatibilityInfo.estimatedSpeed}
                                    warning={compatibilityInfo.warning?.message}
                                    severity={compatibilityInfo.warning?.severity}
                                />
                            )}
                        </div>

                        {/* Size Badge */}
                        <div className="flex-shrink-0 ml-4 text-right">
                            <div className="text-xs font-semibold text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                {model.sizeDisplay}
                            </div>
                        </div>
                    </div>

                    {/* Ratings */}
                    {model.qualityRating && (
                        <div className="flex items-center gap-6 mb-4 py-3 border-y border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">Quality</span>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            className={i < model.qualityRating ? 'text-purple-400' : 'text-slate-700'}
                                            fill={i < model.qualityRating ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">Speed</span>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Zap
                                            key={i}
                                            size={12}
                                            className={i < model.speedRating ? 'text-green-400' : 'text-slate-700'}
                                            fill={i < model.speedRating ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Use Cases */}
                    {model.useCases && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {model.useCases.map((useCase, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    {useCase}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {isDownloading ? (
                            <div className="flex items-center gap-4 flex-1 py-2">
                                <ProgressRing
                                    progress={downloadProgress}
                                    size={48}
                                    status={downloadStatus && downloadStatus.toLowerCase().includes('verifying') ? 'verifying' : 'downloading'}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white">
                                        {downloadStatus || 'Downloading...'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                                        {Math.round(downloadProgress)}% complete
                                    </div>
                                </div>
                            </div>
                        ) : resumeInfo?.canResume ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onResume(model.id)}
                                className="flex items-center justify-center gap-2 flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/20 hover:to-amber-500/20 transition-all text-sm font-semibold"
                            >
                                <Play size={18} />
                                Resume Download ({Math.round(resumeInfo.progress)}%)
                            </motion.button>
                        ) : isInstalled ? (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSelect}
                                    disabled={isActive || isIncompatible}
                                    className={`
                                        flex items-center justify-center gap-2 flex-1 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all
                                        ${isActive
                                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                                            : isIncompatible
                                                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }
                                    `}
                                    title={isActive ? "Model is currently active" : isIncompatible ? "Model is not compatible with your device" : "Use this model"}
                                >
                                    {isActive ? (
                                        <>
                                            <Check size={18} />
                                            Active
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight size={18} />
                                            Use Model
                                        </>
                                    )}
                                </motion.button>

                                {showDeleteConfirm ? (
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleConfirmDelete}
                                            className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:from-red-500/30 hover:to-rose-500/30 transition-all"
                                        >
                                            Confirm
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="px-3 py-3.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                                            aria-label="Cancel deletion"
                                            title="Cancel"
                                        >
                                            <X size={18} />
                                        </motion.button>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleDeleteClick}
                                        disabled={isActive}
                                        className="px-4 py-3.5 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Delete model"
                                        title={isActive ? "Cannot delete active model" : "Delete model"}
                                    >
                                        <Trash2 size={20} />
                                    </motion.button>
                                )}
                            </>
                        ) : (
                            <motion.button
                                whileHover={{ scale: isIncompatible ? 1 : 1.02 }}
                                whileTap={{ scale: isIncompatible ? 1 : 0.98 }}
                                onClick={handleDownloadClick}
                                disabled={isIncompatible && !allowAnyDownload}
                                className={`
                                    flex items-center justify-center gap-2 flex-1 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all
                                    ${isIncompatible && !allowAnyDownload
                                        ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                                    }
                                `}
                                title={isIncompatible && !allowAnyDownload ? "This model is not compatible with your device" : `Download ${model.name}`}
                            >
                                <Download size={18} />
                                {isIncompatible && !allowAnyDownload ? 'Not Compatible' : `Download (${model.sizeDisplay})`}
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Warning Modal */}
            <AnimatePresence>
                {showWarning && (
                    <WarningModal
                        model={model}
                        warning={compatibilityInfo?.warning}
                        onConfirm={handleConfirmDownload}
                        onCancel={() => setShowWarning(false)}
                    />
                )}
            </AnimatePresence>

            {/* High Stakes Delete Modal */}
            <HighStakesDeleteModal
                isOpen={showHighStakesDelete}
                onClose={() => setShowHighStakesDelete(false)}
                onConfirm={handleHighStakesConfirm}
                item={model}
                itemType="model"
            />
        </>
    );
};

export default ModelCardEnhanced;
