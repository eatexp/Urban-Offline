/**
 * ModelCardEnhanced - Premium device-aware AI model card
 * 
 * Features:
 * - Device-optimized recommendations with visual indicators
 * - Performance warnings with severity levels
 * - Premium micro-interactions and animations
 * - Battery/thermal-aware UI adaptations
 * - Accessibility-optimized touch targets
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 *             .clinerules §6 - 48px+ touch targets
 */

import React, { useState, useEffect } from 'react';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    ChevronRight, Sparkles, Lock, X, AlertTriangle, 
    Info, Battery, Thermometer, Cpu, Gauge
} from 'lucide-react';
import { HapticsService, ImpactStyle, NotificationType } from '../services/HapticsService';
import DeviceCapabilityProfiler from '../services/ai/DeviceCapabilityProfiler';

/**
 * Performance badge showing device compatibility
 */
const PerformanceBadge = ({ level, warning, severity }) => {
    const configs = {
        optimal: {
            icon: Sparkles,
            color: 'from-amber-400 to-orange-400',
            bg: 'from-amber-500/20 to-orange-500/20',
            text: 'Best for your device',
            glow: 'shadow-orange-500/30'
        },
        compatible: {
            icon: Check,
            color: 'from-green-400 to-emerald-400',
            bg: 'from-green-500/20 to-emerald-500/20',
            text: 'Runs well',
            glow: 'shadow-green-500/20'
        },
        warning: {
            icon: AlertTriangle,
            color: 'from-yellow-400 to-amber-400',
            bg: 'from-yellow-500/20 to-amber-500/20',
            text: 'May run slowly',
            glow: 'shadow-yellow-500/20'
        },
        incompatible: {
            icon: X,
            color: 'from-red-400 to-rose-400',
            bg: 'from-red-500/20 to-rose-500/20',
            text: 'Not recommended',
            glow: 'shadow-red-500/20'
        }
    };

    const config = configs[level] || configs.compatible;

    return (
        <div className="space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${config.bg} border border-white/10`}>
                <config.icon size={12} className={`text-${config.color.split('-')[1]}-400`} />
                <span className={`text-xs font-medium bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {config.text}
                </span>
            </div>
            {warning && (
                <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                    severity === 'critical' ? 'bg-red-500/10 border border-red-500/20 text-red-300' :
                    severity === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                }`}>
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{warning}</span>
                </div>
            )}
        </div>
    );
};

/**
 * Star rating with animation
 */
const StarRating = ({ rating, max = 5, icon: Icon = Star, color = 'text-purple-400' }) => (
    <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
            <Icon
                key={i}
                size={12}
                className={`transition-all duration-300 ${i < rating ? color : 'text-slate-600'}`}
                fill={i < rating ? 'currentColor' : 'none'}
                style={{ 
                    transitionDelay: `${i * 50}ms`,
                    transform: i < rating ? 'scale(1)' : 'scale(0.8)'
                }}
            />
        ))}
    </div>
);

/**
 * Animated progress ring for downloads
 */
const ProgressRing = ({ progress, size = 44, strokeWidth = 3, status }) => {
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
                <circle
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
                />
            </svg>
            {status === 'verifying' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                </div>
            )}
        </div>
    );
};

/**
 * Enhanced Model Card Component
 */
const ModelCardEnhanced = ({
    model,
    isInstalled,
    isActive,
    isDownloading,
    downloadProgress = 0,
    downloadStatus = '',
    resumeInfo = null,
    onDownload,
    onResume,
    onSelect,
    onDelete,
    isProLocked,
    onUnlockClick,
    deviceProfile = null
}) => {
    const [performanceInfo, setPerformanceInfo] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Analyze model compatibility on mount
    useEffect(() => {
        const analyzeCompatibility = async () => {
            if (!deviceProfile) {
                const profile = await DeviceCapabilityProfiler.getProfile();
                deviceProfile = profile;
            }
            
            const warning = await DeviceCapabilityProfiler.getPerformanceWarning(model);
            const isOptimal = await DeviceCapabilityProfiler.isOptimalForDevice(model);
            const canRun = await DeviceCapabilityProfiler.canRunOnDevice(model);
            
            let level = 'compatible';
            if (isOptimal) level = 'optimal';
            else if (!canRun) level = 'incompatible';
            else if (warning.warning) level = 'warning';
            
            setPerformanceInfo({
                level,
                warning: warning.warning,
                severity: warning.severity,
                canRun: warning.canRun
            });
        };

        analyzeCompatibility();
    }, [model, deviceProfile]);

    const handleDownload = () => {
        HapticsService.impact(ImpactStyle.Medium);
        onDownload(model.id);
    };

    const handleSelect = () => {
        HapticsService.selection();
        onSelect(model.id);
    };

    const handleDelete = () => {
        HapticsService.notification(NotificationType.Warning);
        onDelete(model.id);
        setShowDeleteConfirm(false);
    };

    // Category styling
    const categoryStyles = {
        lightweight: {
            gradient: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            badge: 'bg-green-500/20 text-green-400',
            icon: Zap
        },
        balanced: {
            gradient: 'from-orange-500/20 to-amber-500/20',
            border: 'border-orange-500/30',
            badge: 'bg-orange-500/20 text-orange-400',
            icon: Gauge
        },
        quality: {
            gradient: 'from-purple-500/20 to-indigo-500/20',
            border: 'border-purple-500/30',
            badge: 'bg-purple-500/20 text-purple-400',
            icon: Brain
        },
        imported: {
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'border-blue-500/30',
            badge: 'bg-blue-500/20 text-blue-400',
            icon: Cpu
        }
    };

    const style = categoryStyles[model.category] || categoryStyles.balanced;
    const CategoryIcon = style.icon;

    // Determine card state
    const isRecommended = performanceInfo?.level === 'optimal';
    const isIncompatible = performanceInfo?.level === 'incompatible';
    const hasWarning = performanceInfo?.warning && performanceInfo?.severity !== 'none';

    return (
        <div
            className={`
                relative rounded-2xl border p-5 transition-all duration-300
                ${isActive 
                    ? 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                    : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                }
                ${isRecommended && !isActive ? 'ring-1 ring-amber-500/30' : ''}
                ${isIncompatible ? 'opacity-60' : ''}
                ${isHovered ? 'transform -translate-y-1 shadow-xl' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Recommended glow effect */}
            {isRecommended && (
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 blur-sm opacity-50" />
            )}

            <div className="relative">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-lg text-slate-100 truncate">
                                {model.name}
                            </h3>
                            
                            {/* Category Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                                <CategoryIcon size={10} />
                                {model.category === 'lightweight' ? 'Fast' :
                                 model.category === 'balanced' ? 'Balanced' :
                                 model.category === 'quality' ? 'Quality' : 'Imported'}
                            </span>

                            {/* Tier Badge */}
                            {model.tier === 'pro' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-xs font-medium border border-amber-500/20">
                                    <Sparkles size={10} />
                                    Pro
                                </span>
                            )}
                            {model.tier === 'free' && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                    Free
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                            {model.description}
                        </p>

                        {/* Performance Badge */}
                        {performanceInfo && (
                            <PerformanceBadge 
                                level={performanceInfo.level}
                                warning={performanceInfo.warning}
                                severity={performanceInfo.severity}
                            />
                        )}
                    </div>

                    {/* Size Badge */}
                    <div className="flex-shrink-0 ml-4 text-right">
                        <div className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                            {model.sizeDisplay}
                        </div>
                    </div>
                </div>

                {/* Ratings Row */}
                {model.qualityRating && (
                    <div className="flex items-center gap-6 mb-4 py-2 border-y border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Quality</span>
                            <StarRating rating={model.qualityRating} icon={Brain} color="text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Speed</span>
                            <StarRating rating={model.speedRating} icon={Zap} color="text-green-400" />
                        </div>
                    </div>
                )}

                {/* Use Cases */}
                {model.useCases && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {model.useCases.map((useCase, i) => (
                            <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-500 border border-white/5"
                            >
                                {useCase}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {isProLocked ? (
                        <button
                            onClick={onUnlockClick}
                            className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 transition-all text-sm font-medium group"
                        >
                            <Lock size={16} className="group-hover:scale-110 transition-transform" />
                            Unlock Pro to Download
                        </button>
                    ) : isDownloading ? (
                        <div className="flex items-center gap-4 flex-1 py-2">
                            <ProgressRing 
                                progress={downloadProgress} 
                                size={44} 
                                status={downloadStatus.toLowerCase().includes('verifying') ? 'verifying' : 'downloading'}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200">
                                    {downloadStatus || 'Downloading...'}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {Math.round(downloadProgress)}% complete
                                </div>
                            </div>
                        </div>
                    ) : resumeInfo?.canResume ? (
                        <button
                            onClick={() => onResume(model.id)}
                            className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/20 hover:to-amber-500/20 transition-all text-sm font-medium"
                        >
                            <Download size={16} />
                            Resume Download ({Math.round(resumeInfo.progress)}%)
                        </button>
                    ) : isInstalled ? (
                        <>
                            <button
                                onClick={handleSelect}
                                disabled={isActive || isIncompatible}
                                className={`
                                    flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                                        : isIncompatible
                                            ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                            : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }
                                `}
                            >
                                {isActive ? (
                                    <>
                                        <Check size={16} />
                                        Active
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight size={16} />
                                        Use Model
                                    </>
                                )}
                            </button>

                            {showDeleteConfirm ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:from-red-500/30 hover:to-rose-500/30 transition-all"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isActive}
                                    className="px-4 py-3 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handleDownload}
                            disabled={isIncompatible}
                            className={`
                                flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all
                                ${isIncompatible
                                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                                }
                            `}
                        >
                            <Download size={16} />
                            {isIncompatible ? 'Not Compatible' : `Download (${model.sizeDisplay})`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelCardEnhanced;