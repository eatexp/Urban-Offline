/**
 * ModelPicker - AI Model Management Component
 * 
 * Inspired by Locally AI - allows users to:
 * - Browse available models with ratings and descriptions
 * - Download models with progress tracking
 * - Switch between installed models
 * - Delete/offload models to free storage
 * - Resume interrupted downloads
 * - View verification status
 */

import React, { useState, useEffect } from 'react';
import {
    Download, Trash2, Check, Loader2, Star, Zap, Brain,
    HardDrive, X, ChevronRight, Sparkles, AlertCircle, PauseCircle, Play
} from 'lucide-react';
import { AIModelManager } from '../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { createLogger } from '../utils/logger';

const log = createLogger('ModelPicker');

/**
 * Star rating component
 */
const StarRating = ({ rating, max = 5, icon: _RatingIcon = Star, color = 'var(--color-warning)' }) => (
    <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
            <_RatingIcon
                key={i}
                size={12}
                style={{
                    color: i < rating ? color : 'var(--color-text-muted)',
                    opacity: i < rating ? 1 : 0.3
                }}
                fill={i < rating ? color : 'none'}
            />
        ))}
    </div>
);

/**
 * Progress ring for downloads
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
                stroke="var(--color-primary-400)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
        </svg>
    );
};

/**
 * Individual model card
 */
const ModelCard = ({
    model,
    isInstalled,
    isActive,
    isDownloading,
    isVerifying,
    downloadProgress,
    downloadStatus,
    resumeInfo,
    onDownload,
    onResume,
    onSelect,
    onDelete,
    deviceRecommended
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getCategoryColor = (category) => {
        switch (category) {
            case 'lightweight': return 'rgba(34, 197, 94, 0.8)';
            case 'balanced': return 'rgba(249, 115, 22, 0.8)';
            case 'quality': return 'rgba(139, 92, 246, 0.8)';
            default: return 'var(--color-text-muted)';
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

    // Format bytes to readable size
    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    // Determine what status to show
    const getStatusDisplay = () => {
        if (isVerifying) {
            return {
                icon: <Loader2 size={16} className="animate-spin" />,
                text: 'Verifying...',
                subtext: 'Checking file integrity'
            };
        }
        if (isDownloading) {
            return {
                icon: <ProgressRing progress={downloadProgress} size={36} />,
                text: downloadStatus || 'Downloading...',
                subtext: `${Math.round(downloadProgress)}%`
            };
        }
        if (resumeInfo?.canResume) {
            const receivedStr = formatBytes(resumeInfo.bytesReceived);
            const totalStr = formatBytes(resumeInfo.totalBytes);
            return {
                icon: <PauseCircle size={36} style={{ color: 'var(--color-warning)' }} />,
                text: 'Download Paused',
                subtext: `${receivedStr} / ${totalStr} (${resumeInfo.progress}%)`
            };
        }
        return null;
    };

    const statusDisplay = getStatusDisplay();

    return (
        <div
            className="card p-4 animate-scale-in"
            style={{
                borderColor: isActive ? 'var(--color-primary-400)' : 'rgba(255,255,255,0.1)',
                boxShadow: isActive ? '0 0 20px rgba(249, 115, 22, 0.2)' : undefined
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {model.name}
                        </h3>
                        {/* Category badge */}
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                                background: getCategoryColor(model.category),
                                color: 'white'
                            }}
                        >
                            {getCategoryLabel(model.category)}
                        </span>
                        {/* Recommended badge */}
                        {deviceRecommended && (
                            <span
                                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{
                                    background: 'rgba(249, 115, 22, 0.2)',
                                    color: 'var(--color-primary-400)'
                                }}
                            >
                                <Sparkles size={10} />
                                Recommended
                            </span>
                        )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {model.description}
                    </p>
                </div>

                {/* Size badge */}
                <div
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-text-secondary)'
                    }}
                >
                    {model.sizeDisplay}
                </div>
            </div>

            {/* Ratings */}
            <div className="flex gap-6 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Quality</span>
                    <StarRating rating={model.qualityRating} icon={Brain} color="rgba(139, 92, 246, 0.9)" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Speed</span>
                    <StarRating rating={model.speedRating} icon={Zap} color="rgba(34, 197, 94, 0.9)" />
                </div>
            </div>

            {/* Use cases */}
            <div className="flex flex-wrap gap-1 mb-4">
                {model.useCases?.map((useCase, i) => (
                    <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--color-text-muted)'
                        }}
                    >
                        {useCase}
                    </span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {statusDisplay ? (
                    <div className="flex items-center gap-3 flex-1">
                        {statusDisplay.icon}
                        <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {statusDisplay.text}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {statusDisplay.subtext}
                            </div>
                        </div>
                    </div>
                ) : isInstalled ? (
                    <>
                        {/* Use button */}
                        <button
                            onClick={() => onSelect(model.id)}
                            disabled={isActive}
                            className="btn btn-md flex-1"
                            style={{
                                background: isActive
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : 'var(--color-bg-secondary)',
                                color: isActive
                                    ? 'var(--color-success)'
                                    : 'var(--color-text-primary)',
                                border: isActive
                                    ? '1px solid rgba(34, 197, 94, 0.3)'
                                    : '1px solid var(--color-border-primary)'
                            }}
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

                        {/* Delete button */}
                        {showDeleteConfirm ? (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        onDelete(model.id);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="btn btn-md"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: 'var(--color-danger)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-md btn-ghost"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-md btn-ghost"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </>
                ) : resumeInfo?.canResume ? (
                    /* Resume Download button */
                    <button
                        onClick={() => onResume(model.id)}
                        className="btn btn-md btn-primary flex-1"
                        style={{
                            background: 'rgba(249, 115, 22, 0.2)',
                            border: '1px solid rgba(249, 115, 22, 0.5)',
                            color: 'var(--color-primary-400)'
                        }}
                    >
                        <Play size={16} />
                        Resume Download
                    </button>
                ) : (
                    /* Download button */
                    <button
                        onClick={() => onDownload(model.id)}
                        className="btn btn-md btn-primary flex-1"
                    >
                        <Download size={16} />
                        Download ({model.sizeDisplay})
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Main ModelPicker component
 */
const ModelPicker = ({ onClose, onModelChange }) => {

    const [_models, setModels] = useState([]);
    const [installedModels, setInstalledModels] = useState(new Set());
    const [activeModel, setActiveModel] = useState(null);
    const [downloadingModel, setDownloadingModel] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resumeInfoMap, setResumeInfoMap] = useState(new Map());
    const [storageUsed, setStorageUsed] = useState({ bytes: 0, display: '0 MB' });
    const [filter, setFilter] = useState('all');
    const [recommendedModel, setRecommendedModel] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // Get capabilities and recommended model
                const capabilities = await AIModelManager.init();
                if (capabilities?.recommendedModel) {
                    setRecommendedModel(capabilities.recommendedModel.id);
                }

                // Get all models with install status
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

                // Check for resume info on all models
                await checkResumeInfo(allModels);

            } catch (error) {
                log.error('Failed to initialize model picker', error);
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
                log.debug('Failed to check resume info', { modelId: model.id, error: error.message });
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
            
            // Check if we're in verification phase
            if (message?.toLowerCase().includes('verifying') || progress >= 95 && progress < 100) {
                setIsVerifying(true);
            } else {
                setIsVerifying(false);
            }
        });

        if (result.success) {
            setInstalledModels(prev => new Set([...prev, modelId]));
            // Remove from resume map if present
            setResumeInfoMap(prev => {
                const next = new Map(prev);
                next.delete(modelId);
                return next;
            });
            const usage = await AIModelManager.getStorageUsage();
            setStorageUsed(usage);
        } else if (result.canResume) {
            // Download can be resumed - update resume info
            const resumeInfo = await AIModelManager.getResumeInfo(modelId);
            if (resumeInfo) {
                setResumeInfoMap(prev => new Map(prev).set(modelId, resumeInfo));
            }
        } else {
            // Permanent failure - clear resume info
            setResumeInfoMap(prev => {
                const next = new Map(prev);
                next.delete(modelId);
                return next;
            });
        }

        setDownloadingModel(null);
        setIsVerifying(false);
    };

    // Handle resume
    const handleResume = async (modelId) => {
        // Resume uses the same download method - checkpoint will be picked up automatically
        await handleDownload(modelId);
    };

    // Handle select
    const handleSelect = async (modelId) => {
        const result = await AIModelManager.loadModel(modelId, (_progress, _message) => {
            // Could show loading state
        });

        if (result.success) {
            setActiveModel(modelId);
            if (onModelChange) onModelChange(modelId);
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
        }
    };

    // Filter models
    const filteredModels = Object.values(TRANSFORMERS_MODELS).filter(model => {
        if (filter === 'all') return true;
        if (filter === 'installed') return installedModels.has(model.id);
        return model.category === filter;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin mb-4" size={32} style={{ color: 'var(--color-primary-400)' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>Loading models...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <div>
                    <h2 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                        AI Models
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Download and manage local AI models
                    </p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="btn btn-ghost" aria-label="Close model picker">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Storage info + Offline data badge */}
            <div
                className="flex items-center gap-3 p-3 mx-4 mt-4 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
            >
                <HardDrive size={18} style={{ color: 'var(--color-text-muted)' }} />
                <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {storageUsed.display} used
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {installedModels.size} model{installedModels.size !== 1 ? 's' : ''} installed
                    </div>
                </div>
            </div>

            {/* Offline capability badge */}
            <div
                className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 rounded-lg text-xs"
                style={{
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.15)'
                }}
            >
                <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34, 197, 94, 0.2)' }}
                >
                    <Check size={12} style={{ color: 'var(--color-success)' }} />
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Works offline</span>
                    {' '}with your downloaded content
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'installed', label: 'Installed' },
                    { id: 'lightweight', label: 'Fast' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'quality', label: 'Quality' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className="btn btn-sm"
                        style={{
                            background: filter === tab.id
                                ? 'var(--color-primary-400)'
                                : 'var(--color-bg-secondary)',
                            color: filter === tab.id
                                ? 'white'
                                : 'var(--color-text-secondary)',
                            border: 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                        {tab.id === 'installed' && installedModels.size > 0 && (
                            <span
                                className="ml-1 text-xs px-1.5 rounded-full"
                                style={{
                                    background: filter === tab.id
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'rgba(249, 115, 22, 0.2)',
                                    color: filter === tab.id
                                        ? 'white'
                                        : 'var(--color-primary-400)'
                                }}
                            >
                                {installedModels.size}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Model list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredModels.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {filter === 'installed'
                                ? 'No models installed yet'
                                : 'No models match this filter'}
                        </p>
                    </div>
                ) : (
                    filteredModels.map(model => (
                        <ModelCard
                            key={model.id}
                            model={model}
                            isInstalled={installedModels.has(model.id)}
                            isActive={activeModel === model.id}
                            isDownloading={downloadingModel === model.id}
                            isVerifying={downloadingModel === model.id && isVerifying}
                            downloadProgress={downloadingModel === model.id ? downloadProgress : 0}
                            downloadStatus={downloadingModel === model.id ? downloadStatus : ''}
                            resumeInfo={resumeInfoMap.get(model.id)}
                            onDownload={handleDownload}
                            onResume={handleResume}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            deviceRecommended={recommendedModel === model.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ModelPicker;