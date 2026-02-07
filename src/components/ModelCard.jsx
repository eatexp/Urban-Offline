/**
 * ModelCard - Reusable card component for AI model display
 *
 * Shows: name, description, size, tier badge, quality/speed ratings,
 * use cases, download/delete/select actions, progress ring
 */

import React, { useState } from 'react';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    ChevronRight, Sparkles, Lock, X
} from 'lucide-react';

/**
 * Star rating display
 */
const StarRating = ({ rating, max = 5, icon: Icon = Star, color = 'rgb(234, 179, 8)' }) => (
    <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
            <Icon
                key={i}
                size={12}
                className={i < rating ? '' : 'opacity-30'}
                style={{ color: i < rating ? color : 'rgb(148, 163, 184)' }}
                fill={i < rating ? color : 'none'}
            />
        ))}
    </div>
);

/**
 * Download progress ring
 */
const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgb(168, 85, 247)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-300"
            />
        </svg>
    );
};

const ModelCard = ({
    model,
    isInstalled,
    isActive,
    isDownloading,
    downloadProgress,
    onDownload,
    onSelect,
    onDelete,
    deviceRecommended,
    isProLocked,
    onUnlockClick
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getCategoryColor = (category) => {
        switch (category) {
            case 'lightweight': return 'bg-green-500/80';
            case 'balanced': return 'bg-orange-500/80';
            case 'quality': return 'bg-purple-500/80';
            default: return 'bg-slate-500/80';
        }
    };

    const getCategoryLabel = (category) => {
        switch (category) {
            case 'lightweight': return 'Fast';
            case 'balanced': return 'Balanced';
            case 'quality': return 'Quality';
            default: return category;
        }
    };

    const isLocalModel = model.source === 'local';

    return (
        <div
            className={`rounded-2xl border p-4 transition-all duration-300 animate-scale-in ${
                isActive
                    ? 'border-orange-400/40 shadow-lg shadow-orange-500/10 bg-white/5'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
            } ${isProLocked ? 'opacity-75' : ''}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-slate-100">{model.name}</h3>

                        {/* Category badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getCategoryColor(model.category)}`}>
                            {getCategoryLabel(model.category)}
                        </span>

                        {/* Tier badge */}
                        {model.tier === 'pro' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                <Sparkles size={10} />
                                Pro
                            </span>
                        )}

                        {model.tier === 'free' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                Free
                            </span>
                        )}

                        {isLocalModel && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                Imported
                            </span>
                        )}

                        {/* Recommended badge */}
                        {deviceRecommended && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                <Sparkles size={10} />
                                Recommended
                            </span>
                        )}

                        {/* Legacy badge */}
                        {model.legacy && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                                Legacy
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400">{model.description}</p>
                </div>

                {/* Size badge */}
                <div className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-slate-400 ml-3 flex-shrink-0">
                    {model.sizeDisplay}
                </div>
            </div>

            {/* Ratings (only for HuggingFace models with ratings) */}
            {model.qualityRating && (
                <div className="flex gap-6 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Quality</span>
                        <StarRating rating={model.qualityRating} icon={Brain} color="rgb(168, 85, 247)" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Speed</span>
                        <StarRating rating={model.speedRating} icon={Zap} color="rgb(34, 197, 94)" />
                    </div>
                </div>
            )}

            {/* Use cases */}
            {model.useCases && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {model.useCases.map((useCase, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-500"
                        >
                            {useCase}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {isProLocked ? (
                    /* Locked - show unlock button */
                    <button
                        onClick={onUnlockClick}
                        className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium"
                    >
                        <Lock size={16} />
                        Unlock to Download
                    </button>
                ) : isDownloading ? (
                    /* Downloading - show progress */
                    <div className="flex items-center gap-3 flex-1">
                        <ProgressRing progress={downloadProgress} size={36} />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-200">
                                Downloading...
                            </div>
                            <div className="text-xs text-slate-400">
                                {Math.round(downloadProgress)}%
                            </div>
                        </div>
                    </div>
                ) : isInstalled ? (
                    <>
                        {/* Use button */}
                        <button
                            onClick={() => onSelect(model.id)}
                            disabled={isActive}
                            className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'
                            }`}
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

                        {/* Delete */}
                        {showDeleteConfirm ? (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        onDelete(model.id);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="px-3 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-all"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-2 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </>
                ) : (
                    /* Download button */
                    <button
                        onClick={() => onDownload(model.id)}
                        className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                        <Download size={16} />
                        Download ({model.sizeDisplay})
                    </button>
                )}
            </div>
        </div>
    );
};

export default ModelCard;
