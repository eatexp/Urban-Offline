/**
 * ModelMarketplace - Premium Device-Adaptive AI Model Store
 * 
 * Inspired by Locally AI - a beautiful, device-optimized marketplace
 * that intelligently sorts and recommends models based on hardware.
 * 
 * Features:
 * - Device capability analysis with real-time recommendations
 * - Performance preview (estimated tokens/sec)
 * - Battery-aware model suggestions
 * - Premium micro-interactions and haptics
 * - Smart sorting: Optimal models first
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 *             .clinerules §6 - 48px+ touch targets
 *             .clinerules §2 - Battery-aware AI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    HardDrive, X, ChevronRight, Sparkles, AlertCircle, 
    PauseCircle, Play, Cpu, Battery, Thermometer, Gauge,
    Smartphone, Wifi, WifiOff, Shield, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIModelManager } from '../services/ai/AIModelManager';
import DeviceCapabilityProfiler from '../services/ai/DeviceCapabilityProfiler';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { HapticsService, ImpactStyle, NotificationType } from '../services/HapticsService';
import { createLogger } from '../utils/logger';

const log = createLogger('ModelMarketplace');

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Device Performance Badge
 * Shows how well this model runs on current device
 */
const PerformanceBadge = ({ level, estimatedSpeed, warning, severity }) => {
    const configs = {
        optimal: {
            icon: Sparkles,
            gradient: 'from-amber-400 via-orange-400 to-amber-400',
            bg: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
            text: 'Best for your device',
            glow: 'shadow-orange-500/30',
            speedColor: 'text-green-400'
        },
        compatible: {
            icon: Check,
            gradient: 'from-green-400 to-emerald-400',
            bg: 'from-green-500/20 to-emerald-500/20',
            text: 'Runs well',
            glow: 'shadow-green-500/20',
            speedColor: 'text-green-400'
        },
        warning: {
            icon: AlertCircle,
            gradient: 'from-yellow-400 to-amber-400',
            bg: 'from-yellow-500/20 to-amber-500/20',
            text: 'May run slowly',
            glow: 'shadow-yellow-500/20',
            speedColor: 'text-yellow-400'
        },
        incompatible: {
            icon: X,
            gradient: 'from-red-400 to-rose-400',
            bg: 'from-red-500/20 to-rose-500/20',
            text: 'Not recommended',
            glow: 'shadow-red-500/20',
            speedColor: 'text-red-400'
        }
    };

    const config = configs[level] || configs.compatible;
    const Icon = config.icon;

    return (
        <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.bg} border border-white/10 backdrop-blur-sm`}>
                <Icon size={14} className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`} />
                <span className={`text-xs font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                    {config.text}
                </span>
            </div>
            
            {estimatedSpeed && (
                <div className={`text-xs font-medium ${config.speedColor} flex items-center gap-1`}>
                    <Gauge size={12} />
                    ~{estimatedSpeed} tokens/sec
                </div>
            )}
            
            {warning && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                        severity === 'critical' 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
                            : severity === 'warning' 
                                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' 
                                : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
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
 * Star Rating with Animation
 */
const StarRating = ({ rating, max = 5, icon: Icon = Star, color = 'text-purple-400' }) => (
    <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
            >
                <Icon
                    size={14}
                    className={`transition-all duration-300 ${i < rating ? color : 'text-slate-700'}`}
                    fill={i < rating ? 'currentColor' : 'none'}
                />
            </motion.div>
        ))}
    </div>
);

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

    const color = getStatusColor();

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
                    className={`transition-all duration-500 ease-out ${color}`}
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
 * Category Badge with Icon
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
            gradient: 'from-orange-500/20 to-amber-500/20',
            border: 'border-orange-500/30',
            text: 'text-orange-400',
            label: 'Balanced'
        },
        quality: {
            icon: Brain,
            gradient: 'from-purple-500/20 to-indigo-500/20',
            border: 'border-purple-500/30',
            text: 'text-purple-400',
            label: 'Quality'
        },
        imported: {
            icon: Cpu,
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            label: 'Imported'
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
 * Tier Badge
 */
const TierBadge = ({ tier }) => {
    if (tier === 'pro') {
        return (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">Pro</span>
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <span className="text-xs font-semibold text-green-400">Free</span>
        </div>
    );
};

// =============================================================================
// MODEL CARD COMPONENT
// =============================================================================

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
    index
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [performanceInfo, setPerformanceInfo] = useState(null);

    // Analyze device compatibility
    useEffect(() => {
        const analyze = async () => {
            const info = await DeviceCapabilityProfiler.getPerformanceWarning(model);
            const isOptimal = await DeviceCapabilityProfiler.isOptimalForDevice(model);
            const canRun = await DeviceCapabilityProfiler.canRunOnDevice(model);
            
            // Estimate tokens/sec based on device tier
            let estimatedSpeed = null;
            if (canRun) {
                const tier = deviceProfile?.recommendations?.tier || 'standard';
                const baseSpeed = {
                    'essential': 15,
                    'standard': 25,
                    'advanced': 45,
                    'pro': 80
                }[tier] || 25;
                
                // Adjust for model size
                const sizeFactor = Math.max(0.5, 1 - (model.size / 2000000000));
                estimatedSpeed = Math.round(baseSpeed * sizeFactor);
            }
            
            let level = 'compatible';
            if (isOptimal) level = 'optimal';
            else if (!canRun) level = 'incompatible';
            else if (info.warning) level = 'warning';
            
            setPerformanceInfo({
                level,
                estimatedSpeed,
                warning: info.warning,
                severity: info.severity,
                canRun: info.canRun
            });
        };
        
        analyze();
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

    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const isRecommended = performanceInfo?.level === 'optimal';
    const isIncompatible = performanceInfo?.level === 'incompatible';

    return (
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
                    : 'bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-800/50'
                }
                ${isRecommended ? 'ring-1 ring-orange-500/30' : ''}
                ${isIncompatible ? 'opacity-60' : ''}
            `}
        >
            {/* Recommended Glow */}
            {isRecommended && (
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
                            <h3 className="font-bold text-lg text-slate-100 truncate">
                                {model.name}
                            </h3>
                            <CategoryBadge category={model.category} />
                            <TierBadge tier={model.tier} />
                        </div>
                        
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                            {model.description}
                        </p>

                        {/* Performance Badge */}
                        {performanceInfo && (
                            <PerformanceBadge 
                                level={performanceInfo.level}
                                estimatedSpeed={performanceInfo.estimatedSpeed}
                                warning={performanceInfo.warning}
                                severity={performanceInfo.severity}
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
                            <StarRating rating={model.qualityRating} icon={Brain} color="text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">Speed</span>
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
                                <div className="text-sm font-semibold text-slate-200">
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
                                            : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20'
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
                                        onClick={handleDelete}
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
                                    onClick={() => setShowDeleteConfirm(true)}
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
                            onClick={handleDownload}
                            disabled={isIncompatible}
                            className={`
                                flex items-center justify-center gap-2 flex-1 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all
                                ${isIncompatible
                                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                                }
                            `}
                        >
                            <Download size={18} />
                            {isIncompatible ? 'Not Compatible' : `Download (${model.sizeDisplay})`}
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
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
            }
        };
        getBattery();
    }, []);

    if (!profile) return null;

    const { recommendations, hardware } = profile;
    const canRunAI = recommendations.canRunAI;

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-center gap-2">
                <Cpu size={16} className={canRunAI ? 'text-green-400' : 'text-red-400'} />
                <span className="text-sm text-slate-300">
                    {canRunAI ? 'AI Ready' : 'AI Unavailable'}
                </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span className="text-sm text-slate-300 capitalize">
                    {recommendations.tier} Tier
                </span>
            </div>
            
            {battery && (
                <>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Battery size={16} className={battery.level < 20 ? 'text-red-400' : 'text-green-400'} />
                        <span className={`text-sm ${battery.level < 20 ? 'text-red-400' : 'text-slate-300'}`}>
                            {battery.level}%{battery.charging && ' ⚡'}
                        </span>
                    </div>
                </>
            )}
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-blue-400" />
                <span className="text-sm text-slate-300">
                    {hardware?.storage?.available 
                        ? `${Math.round(hardware.storage.available / 1024 / 1024 / 1024)}GB free`
                        : 'Storage unknown'
                    }
                </span>
            </div>
        </div>
    );
};

// =============================================================================
// MAIN MARKETPLACE COMPONENT
// =============================================================================

const ModelMarketplace = () => {
    const navigate = useNavigate();
    
    // State
    const [models, setModels] = useState([]);
    const [installedModels, setInstalledModels] = useState(new Set());
    const [activeModel, setActiveModel] = useState(null);
    const [downloadingModel, setDownloadingModel] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resumeInfoMap, setResumeInfoMap] = useState(new Map());
    const [storageUsed, setStorageUsed] = useState({ bytes: 0, display: '0 MB' });
    const [filter, setFilter] = useState('recommended'); // recommended, all, installed, fast, balanced, quality
    const [deviceProfile, setDeviceProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('device'); // device, speed, quality, size

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
                
                // Sort by device compatibility if profile available
                const sortedModels = sortModelsByDevice(allModels, profile, sortBy);
                setModels(sortedModels);

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
    }, [sortBy]);

    // Sort models by device compatibility
    const sortModelsByDevice = (models, profile, sortMode) => {
        if (!profile || sortMode === 'size') {
            return [...models].sort((a, b) => a.size - b.size);
        }

        const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };
        
        return [...models].sort((a, b) => {
            if (sortMode === 'device') {
                // Best match first
                const aTier = tierPriority[a.tier] || 1;
                const bTier = tierPriority[b.tier] || 1;
                const deviceTier = tierPriority[profile.recommendations.tier] || 1;
                
                const aDiff = Math.abs(aTier - deviceTier);
                const bDiff = Math.abs(bTier - deviceTier);
                
                if (aDiff !== bDiff) return aDiff - bDiff;
            }
            
            if (sortMode === 'speed') {
                return b.speedRating - a.speedRating;
            }
            
            if (sortMode === 'quality') {
                return b.qualityRating - a.qualityRating;
            }
            
            // Default: by size
            return a.size - b.size;
        });
    };

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

    // Handle download
    const handleDownload = async (modelId) => {
        setDownloadingModel(modelId);
        setDownloadProgress(0);
        setDownloadStatus('');
        setIsVerifying(false);

        const result = await AIModelManager.downloadModel(modelId, (progress, message) => {
            setDownloadProgress(progress);
            setDownloadStatus(message);
            
            if (message?.toLowerCase().includes('verifying') || (progress >= 95 && progress < 100)) {
                setIsVerifying(true);
            } else {
                setIsVerifying(false);
            }
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
        setIsVerifying(false);
    };

    // Handle resume
    const handleResume = async (modelId) => {
        await handleDownload(modelId);
    };

    // Handle select
    const handleSelect = async (modelId) => {
        const result = await AIModelManager.loadModel(modelId, () => {});
        
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

    // Filter models
    const filteredModels = useMemo(() => {
        let filtered = models;
        
        if (filter === 'installed') {
            filtered = models.filter(m => installedModels.has(m.id));
        } else if (filter === 'fast') {
            filtered = models.filter(m => m.category === 'lightweight');
        } else if (filter === 'balanced') {
            filtered = models.filter(m => m.category === 'balanced');
        } else if (filter === 'quality') {
            filtered = models.filter(m => m.category === 'quality');
        } else if (filter === 'recommended') {
            // Show optimal + compatible first
            filtered = models.filter(m => {
                const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };
                const deviceTier = tierPriority[deviceProfile?.recommendations?.tier] || 1;
                const modelTier = tierPriority[m.tier] || 1;
                return modelTier <= deviceTier + 1;
            });
        }
        
        return filtered;
    }, [models, filter, installedModels, deviceProfile]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mb-4"
                >
                    <Loader2 size={40} className="text-orange-400" />
                </motion.div>
                <p className="text-slate-400">Analyzing your device...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24">
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
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'recommended', label: 'Recommended', icon: Sparkles },
                    { id: 'all', label: 'All Models', icon: Grid },
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
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
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

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                    {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
                </p>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
                >
                    <option value="device">Sort by Device Match</option>
                    <option value="speed">Sort by Speed</option>
                    <option value="quality">Sort by Quality</option>
                    <option value="size">Sort by Size</option>
                </select>
            </div>

            {/* Model Grid */}
            <motion.div 
                layout
                className="space-y-4"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredModels.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-white/5 rounded-2xl border border-white/10"
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
                        filteredModels.map((model, index) => (
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
                className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20"
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                        <Shield size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-200 mb-1">Privacy First</h4>
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

// Grid icon component
const Grid = ({ size, className }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

export default ModelMarketplace;