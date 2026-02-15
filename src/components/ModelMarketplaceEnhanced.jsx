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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    HardDrive, X, ChevronRight, Sparkles, AlertCircle,
    PauseCircle, Play, Cpu, Battery, Thermometer, Gauge,
    Smartphone, Wifi, WifiOff, Shield, ArrowUpRight, Filter,
    SlidersHorizontal, AlertTriangle, Info, ChevronDown,
    Scale, Lock, Unlock, RotateCcw, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIModelManager } from '../services/ai/AIModelManager';
import DeviceCapabilityProfiler from '../services/ai/DeviceCapabilityProfiler';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { HapticsService, ImpactStyle, NotificationType } from '../services/HapticsService';
import { isIOSNative, isAndroidNative } from '../utils/platform';
import { createLogger } from '../utils/logger';
import HighStakesDeleteModal, { requiresHighStakesDelete } from './HighStakesDeleteModal';

const log = createLogger('ModelMarketplaceEnhanced');

// =============================================================================
// COMPATIBILITY UTILITIES
// =============================================================================

/**
 * Calculate comprehensive compatibility score for sorting
 */
const calculateCompatibilityScore = (model, deviceProfile) => {
    if (!deviceProfile) return 50; // Neutral score if no profile

    const { recommendations, hardware, runtime } = deviceProfile;
    const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };

    let score = 50; // Base score

    // 1. Tier match (0-30 points) - Most important
    const deviceTier = tierPriority[recommendations.tier] || 1;
    const modelTier = tierPriority[model.tier] || 1;
    const tierDiff = Math.abs(deviceTier - modelTier);
    score += Math.max(0, 30 - (tierDiff * 15));

    // 2. Size fit (0-20 points)
    const sizeRatio = model.size / recommendations.maxModelSize;
    if (sizeRatio <= 0.5) score += 20;
    else if (sizeRatio <= 0.8) score += 15;
    else if (sizeRatio <= 1.0) score += 10;
    else if (sizeRatio <= 1.5) score += 5;
    else score += 0;

    // 3. Performance match (0-20 points)
    const qualityMatch = model.qualityRating / 5; // 0-1
    const speedMatch = model.speedRating / 5; // 0-1

    if (recommendations.inferencePriority === 'quality') {
        score += qualityMatch * 20;
    } else if (recommendations.inferencePriority === 'speed') {
        score += speedMatch * 20;
    } else {
        score += ((qualityMatch + speedMatch) / 2) * 20;
    }

    // 4. Battery consideration (0-15 points)
    if (runtime.battery.isLowPower) {
        // Favor smaller models when battery is low
        if (model.size < 400 * 1024 * 1024) score += 15;
        else if (model.size < 800 * 1024 * 1024) score += 8;
        else score += 0;
    } else {
        score += 10; // Neutral when battery is good
    }

    // 5. Storage availability (0-10 points)
    if (hardware.storage.available) {
        const storageRatio = model.size / hardware.storage.available;
        if (storageRatio < 0.1) score += 10;
        else if (storageRatio < 0.2) score += 7;
        else if (storageRatio < 0.3) score += 4;
        else score += 0;
    }

    // 6. Category bonus (0-5 points)
    const categoryBonus = {
        'lightweight': recommendations.inferencePriority === 'speed' ? 5 : 2,
        'balanced': 3,
        'quality': recommendations.inferencePriority === 'quality' ? 5 : 2
    };
    score += categoryBonus[model.category] || 0;

    return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Get warning level for "choose any" functionality
 */
const getModelWarningLevel = (model, deviceProfile) => {
    if (!deviceProfile) return { level: 'none', message: null };

    const { recommendations, hardware, runtime } = deviceProfile;

    // Check absolute incompatibility
    if (model.size > recommendations.maxModelSize * 2) {
        return {
            level: 'critical',
            severity: 'critical',
            message: `This model requires ${model.sizeDisplay} but your device supports up to ${Math.round(recommendations.maxModelSize * 2 / 1024 / 1024 / 1024 * 10) / 10}GB. It likely won't run.`,
            canRun: false
        };
    }

    // Check if significantly larger than recommended
    if (model.size > recommendations.maxModelSize * 1.5) {
        return {
            level: 'severe',
            severity: 'warning',
            message: `This model is much larger than recommended for your device. Expect very slow performance and high battery usage.`,
            canRun: true,
            batteryImpact: 'high',
            performanceImpact: 'severe'
        };
    }

    // Check if larger than recommended
    if (model.size > recommendations.maxModelSize) {
        return {
            level: 'warning',
            severity: 'warning',
            message: `This model exceeds your device's recommended size. It will run slower and use more battery.`,
            canRun: true,
            batteryImpact: 'medium',
            performanceImpact: 'moderate'
        };
    }

    // Battery low warning
    if (runtime.battery.isLowPower && model.size > 600 * 1024 * 1024) {
        return {
            level: 'battery',
            severity: 'info',
            message: `Battery is low. This model will drain battery faster. Consider a smaller model for longer usage.`,
            canRun: true,
            batteryImpact: 'medium',
            performanceImpact: 'low'
        };
    }

    // Thermal warning
    if (deviceProfile.thermal.state === 'serious' || deviceProfile.thermal.state === 'critical') {
        return {
            level: 'thermal',
            severity: 'info',
            message: `Device is warm. Large models may cause thermal throttling.`,
            canRun: true,
            batteryImpact: 'low',
            performanceImpact: 'moderate'
        };
    }

    return { level: 'none', severity: 'none', message: null, canRun: true };
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Premium Performance Badge
 */
const PerformanceBadge = ({ score, level, estimatedSpeed, warning, severity }) => {
    const getBadgeConfig = () => {
        if (score >= 85) return {
            icon: Sparkles,
            gradient: 'from-amber-400 via-orange-400 to-amber-400',
            bg: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
            text: 'Perfect Match',
            subtext: `${score}% compatible`,
            glow: 'shadow-orange-500/30'
        };
        if (score >= 70) return {
            icon: CheckCircle2,
            gradient: 'from-green-400 to-emerald-400',
            bg: 'from-green-500/20 to-emerald-500/20',
            text: 'Excellent',
            subtext: `${score}% compatible`,
            glow: 'shadow-green-500/20'
        };
        if (score >= 50) return {
            icon: Check,
            gradient: 'from-blue-400 to-cyan-400',
            bg: 'from-blue-500/20 to-cyan-500/20',
            text: 'Good',
            subtext: `${score}% compatible`,
            glow: 'shadow-blue-500/20'
        };
        if (score >= 30) return {
            icon: AlertCircle,
            gradient: 'from-yellow-400 to-amber-400',
            bg: 'from-yellow-500/20 to-amber-500/20',
            text: 'Fair',
            subtext: `${score}% compatible`,
            glow: 'shadow-yellow-500/20'
        };
        return {
            icon: AlertTriangle,
            gradient: 'from-red-400 to-rose-400',
            bg: 'from-red-500/20 to-rose-500/20',
            text: 'Limited',
            subtext: `${score}% compatible`,
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
 * Enhanced Model Card
 */
const ModelCard = ({
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

    useEffect(() => {
        const analyze = async () => {
            const score = calculateCompatibilityScore(model, deviceProfile);
            const warning = getModelWarningLevel(model, deviceProfile);

            // Estimate tokens/sec
            let estimatedSpeed = null;
            if (warning.canRun) {
                const tier = deviceProfile?.recommendations?.tier || 'standard';
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
                                    <span className="badge-premium badge-premium-gold">
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
                                    status={downloadStatus.toLowerCase().includes('verifying') ? 'verifying' : 'downloading'}
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

// =============================================================================
// DEVICE STATUS BAR
// =============================================================================

const DeviceStatusBar = ({ profile }) => {
    const [battery, setBattery] = useState(null);

    useEffect(() => {
        const getBattery = async () => {
            if ('getBattery' in navigator) {
                const batt = await navigator.getBattery();
                setBattery({
                    level: Math.round(batt.level * 100),
                    charging: batt.charging
                });

                const updateBattery = () => {
                    setBattery({
                        level: Math.round(batt.level * 100),
                        charging: batt.charging
                    });
                };

                batt.addEventListener('levelchange', updateBattery);
                batt.addEventListener('chargingchange', updateBattery);

                return () => {
                    batt.removeEventListener('levelchange', updateBattery);
                    batt.removeEventListener('chargingchange', updateBattery);
                };
            }
        };
        getBattery();
    }, []);

    if (!profile) return null;

    const { recommendations, hardware } = profile;
    const canRunAI = recommendations.canRunAI;

    return (
        <div className="glass-card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${canRunAI ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <Cpu size={16} className={canRunAI ? 'text-green-400' : 'text-red-400'} />
                    <span className="text-sm text-slate-200">
                        {canRunAI ? 'AI Ready' : 'AI Unavailable'}
                    </span>
                </div>

                <div className="w-px h-4 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    <span className="text-sm text-slate-200 capitalize">
                        {recommendations.tier} Tier
                    </span>
                </div>

                {battery && (
                    <>
                        <div className="w-px h-4 bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <Battery size={16} className={battery.level < 20 ? 'text-red-400' : 'text-green-400'} />
                            <span className={`text-sm ${battery.level < 20 ? 'text-red-400' : 'text-slate-200'}`}>
                                {battery.level}%{battery.charging && ' ⚡'}
                            </span>
                        </div>
                    </>
                )}

                <div className="w-px h-4 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-blue-400" />
                    <span className="text-sm text-slate-200">
                        {hardware?.storage?.available
                            ? `${Math.round(hardware.storage.available / 1024 / 1024 / 1024)}GB free`
                            : 'Storage unknown'
                        }
                    </span>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ModelMarketplaceEnhanced = () => {
    const navigate = useNavigate();

    // State
    const [models, setModels] = useState([]);
    const [installedModels, setInstalledModels] = useState(new Set());
    const [activeModel, setActiveModel] = useState(null);
    const [downloadingModel, setDownloadingModel] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [resumeInfoMap, setResumeInfoMap] = useState(new Map());
    const [storageUsed, setStorageUsed] = useState({ bytes: 0, display: '0 MB' });
    const [filter, setFilter] = useState('recommended');
    const [deviceProfile, setDeviceProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('compatibility');
    const [showAllModels, setShowAllModels] = useState(false);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // Get device capabilities
                const profile = await DeviceCapabilityProfiler.getProfile();
                setDeviceProfile(profile);

                // Initialize AI manager
                await AIModelManager.init();

                // Get all models
                const allModels = await AIModelManager.getAvailableModels();
                setModels(allModels);

                // Track installed models
                const installed = new Set(
                    allModels.filter(m => m.isInstalled).map(m => m.id)
                );
                setInstalledModels(installed);

                // Get current active model
                setActiveModel(AIModelManager.getCurrentModel());

                // Get storage usage
                const usage = await AIModelManager.getStorageUsage();
                setStorageUsed(usage);

                // Check for resume info
                await checkResumeInfo(allModels);

            } catch (error) {
                log.error('Failed to initialize marketplace', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Check resume info for all models
    const checkResumeInfo = async (models) => {
        const resumeMap = new Map();

        for (const model of models) {
            try {
                const resumeInfo = await AIModelManager.getResumeInfo(model.id);
                if (resumeInfo?.canResume) {
                    resumeMap.set(model.id, resumeInfo);
                }
            } catch (error) {
                log.debug('Failed to check resume info', { modelId: model.id });
            }
        }

        setResumeInfoMap(resumeMap);
    };

    // Sort and filter models
    const processedModels = useMemo(() => {
        let filtered = [...models];

        // Apply filter
        if (filter === 'installed') {
            filtered = models.filter(m => installedModels.has(m.id));
        } else if (filter === 'fast') {
            filtered = models.filter(m => m.category === 'lightweight');
        } else if (filter === 'balanced') {
            filtered = models.filter(m => m.category === 'balanced');
        } else if (filter === 'quality') {
            filtered = models.filter(m => m.category === 'quality');
        } else if (filter === 'recommended' && !showAllModels) {
            // Show only models with good compatibility
            filtered = models.filter(m => {
                const score = calculateCompatibilityScore(m, deviceProfile);
                return score >= 30; // Show fair and above
            });
        }
        // 'all' shows everything

        // Apply sorting
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'compatibility':
                    return calculateCompatibilityScore(b, deviceProfile) -
                        calculateCompatibilityScore(a, deviceProfile);
                case 'speed':
                    return b.speedRating - a.speedRating;
                case 'quality':
                    return b.qualityRating - a.qualityRating;
                case 'size':
                    return a.size - b.size;
                default:
                    return 0;
            }
        });
    }, [models, filter, installedModels, deviceProfile, sortBy, showAllModels]);

    // Handle download
    const handleDownload = async (modelId) => {
        setDownloadingModel(modelId);
        setDownloadProgress(0);
        setDownloadStatus('');

        const result = await AIModelManager.downloadModel(modelId, (progress, message) => {
            setDownloadProgress(progress);
            setDownloadStatus(message);
        });

        if (result.success) {
            setInstalledModels(prev => new Set([...prev, modelId]));
            setResumeInfoMap(prev => {
                const next = new Map(prev);
                next.delete(modelId);
                return next;
            });

            const usage = await AIModelManager.getStorageUsage();
            setStorageUsed(usage);

            HapticsService.notification(NotificationType.Success);
        } else if (result.canResume) {
            const resumeInfo = await AIModelManager.getResumeInfo(modelId);
            if (resumeInfo) {
                setResumeInfoMap(prev => new Map(prev).set(modelId, resumeInfo));
            }
        }

        setDownloadingModel(null);
    };

    // Handle resume
    const handleResume = async (modelId) => {
        await handleDownload(modelId);
    };

    // Handle select
    const handleSelect = async (modelId) => {
        const result = await AIModelManager.loadModel(modelId, () => { });

        if (result.success) {
            setActiveModel(modelId);
            HapticsService.notification(NotificationType.Success);
        }
    };

    // Handle delete
    const handleDelete = async (modelId) => {
        const result = await AIModelManager.deleteModel(modelId);

        if (result.success) {
            setInstalledModels(prev => {
                const next = new Set(prev);
                next.delete(modelId);
                return next;
            });

            if (activeModel === modelId) {
                setActiveModel(null);
            }

            const usage = await AIModelManager.getStorageUsage();
            setStorageUsed(usage);

            HapticsService.notification(NotificationType.Success);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mb-4"
                >
                    <div className="w-12 h-12 border-3 border-blue-400 border-t-transparent rounded-full" />
                </motion.div>
                <p className="text-slate-400">Analyzing your device...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white">AI Model Store</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <HardDrive size={16} />
                        {storageUsed.display} used
                    </div>
                </div>
                <p className="text-slate-400">
                    Download AI models optimized for your device. Models run entirely offline.
                </p>
            </motion.div>

            {/* Device Status */}
            <DeviceStatusBar profile={deviceProfile} />

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 premium-scrollbar">
                {[
                    { id: 'recommended', label: 'Recommended', icon: Sparkles },
                    { id: 'all', label: 'All Models', icon: SlidersHorizontal },
                    { id: 'installed', label: 'Installed', icon: Check },
                    { id: 'fast', label: 'Fast', icon: Zap },
                    { id: 'balanced', label: 'Balanced', icon: Gauge },
                    { id: 'quality', label: 'Quality', icon: Brain }
                ].map(tab => (
                    <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setFilter(tab.id);
                            HapticsService.impact(ImpactStyle.Light);
                        }}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all
                            ${filter === tab.id
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === 'installed' && installedModels.size > 0 && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                                {installedModels.size}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500">
                        {processedModels.length} model{processedModels.length !== 1 ? 's' : ''} available
                    </p>

                    {filter === 'recommended' && (
                        <button
                            onClick={() => {
                                setShowAllModels(!showAllModels);
                                HapticsService.impact(ImpactStyle.Light);
                            }}
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {showAllModels ? <Lock size={14} /> : <Unlock size={14} />}
                            {showAllModels ? 'Hide incompatible' : 'Show all models'}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
                    >
                        <option value="compatibility">Device Match</option>
                        <option value="speed">Speed</option>
                        <option value="quality">Quality</option>
                        <option value="size">Size</option>
                    </select>
                </div>
            </div>

            {/* Model Grid */}
            <motion.div layout className="space-y-4">
                <AnimatePresence mode='popLayout'>
                    {processedModels.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 glass-card"
                        >
                            <AlertCircle size={48} className="mx-auto mb-4 text-slate-600" />
                            <h3 className="text-lg font-medium text-slate-300 mb-2">
                                {filter === 'installed' ? 'No models installed' : 'No models match'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {filter === 'installed'
                                    ? 'Download models to use AI features offline'
                                    : 'Try adjusting your filters'
                                }
                            </p>
                        </motion.div>
                    ) : (
                        processedModels.map((model, index) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                deviceProfile={deviceProfile}
                                isInstalled={installedModels.has(model.id)}
                                isActive={activeModel === model.id}
                                isDownloading={downloadingModel === model.id}
                                downloadProgress={downloadingModel === model.id ? downloadProgress : 0}
                                downloadStatus={downloadingModel === model.id ? downloadStatus : ''}
                                resumeInfo={resumeInfoMap.get(model.id)}
                                onDownload={handleDownload}
                                onResume={handleResume}
                                onSelect={handleSelect}
                                onDelete={handleDelete}
                                index={index}
                                allowAnyDownload={showAllModels}
                            />
                        ))
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Info Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 glass-card"
            >
                <div className="flex items-start gap-4 p-4">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                        <Shield size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Privacy First</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            All AI models run locally on your device. Your conversations never leave your phone,
                            ensuring complete privacy even in offline scenarios.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ModelMarketplaceEnhanced;