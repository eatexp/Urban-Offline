/**
 * DatasetSettingsModal - Manage which datasets are enabled for AI queries
 * 
 * Features:
 * - Toggle individual datasets on/off
 * - Apply presets (Medical Focus, Survival Focus, All Content, etc.)
 * - Visual category indicators
 * - Shows dataset stats (article count, last updated)
 * 
 * Compliance: .clinerules §4 - Dataset enable/disable functionality
 */

import React, { useState, useEffect } from 'react';
import { X, Database, Check, Layers, Activity, Shield, Tent, Heart, Scale, BookOpen, MapPin } from 'lucide-react';
import { getCategoryConfig } from '../../../../config/categories';
import { createLogger } from '../../../../utils/logger';

// Logger for future debugging - currently unused but kept for consistency
const _log = createLogger('DatasetSettingsModal');

// Preset configurations
const PRESETS = [
    {
        id: 'all',
        name: 'All Content',
        description: 'Search across all installed datasets',
        icon: Layers,
        color: '#6366f1'
    },
    {
        id: 'medical',
        name: 'Medical Focus',
        description: 'Prioritize medical and health content',
        icon: Heart,
        color: '#ef4444'
    },
    {
        id: 'survival',
        name: 'Survival Focus',
        description: 'Prioritize survival and emergency content',
        icon: Tent,
        color: '#f97316'
    },
    {
        id: 'legal',
        name: 'Legal Focus',
        description: 'Prioritize legal rights and procedures',
        icon: Scale,
        color: '#8b5cf6'
    },
    {
        id: 'minimal',
        name: 'Essential Only',
        description: 'Use only core emergency datasets',
        icon: Shield,
        color: '#10b981'
    }
];

const DatasetSettingsModal = ({
    isOpen,
    onClose,
    datasets = [],
    enabledDatasets = [],
    onToggleDataset,
    onApplyPreset
}) => {
    const [activeTab, setActiveTab] = useState('datasets'); // 'datasets' | 'presets'
    const [localEnabled, setLocalEnabled] = useState(new Set());

    // Sync local state with props
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalEnabled(new Set(enabledDatasets.map(d => d.id)));
    }, [enabledDatasets, isOpen]);

    if (!isOpen) return null;

    const handleToggle = (datasetId) => {
        const isEnabled = localEnabled.has(datasetId);
        const newEnabled = new Set(localEnabled);

        if (isEnabled) {
            newEnabled.delete(datasetId);
        } else {
            newEnabled.add(datasetId);
        }

        setLocalEnabled(newEnabled);
        onToggleDataset(datasetId, !isEnabled);
    };

    const handlePresetClick = (presetId) => {
        onApplyPreset(presetId);
        onClose();
    };

    const enabledCount = localEnabled.size;
    const totalCount = datasets.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-lg max-h-[80vh] bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl border border-[var(--color-border-primary)] overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-glass)] backdrop-blur">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Dataset Settings
                                </h2>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {enabledCount} of {totalCount} datasets enabled
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 p-1 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <button
                            onClick={() => setActiveTab('datasets')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'datasets'
                                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            Datasets
                        </button>
                        <button
                            onClick={() => setActiveTab('presets')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'presets'
                                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            Presets
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[50vh] p-4">
                    {activeTab === 'datasets' ? (
                        <div className="space-y-2">
                            {datasets.length === 0 ? (
                                <div className="text-center py-8 text-[var(--color-text-muted)]">
                                    <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No datasets installed</p>
                                    <p className="text-xs mt-1">Install content packs from the Library</p>
                                </div>
                            ) : (
                                datasets.map((dataset) => {
                                    const isEnabled = localEnabled.has(dataset.id);
                                    const categoryConfig = getCategoryConfig(dataset.category);
                                    const CategoryIcon = categoryConfig.icon;

                                    return (
                                        <button
                                            key={dataset.id}
                                            onClick={() => handleToggle(dataset.id)}
                                            aria-pressed={isEnabled}
                                            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isEnabled
                                                ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]'
                                                : 'hover:bg-[var(--color-bg-tertiary)]/50 border-transparent'
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: categoryConfig.bgGradient,
                                                    color: categoryConfig.color
                                                }}
                                            >
                                                <CategoryIcon className="w-5 h-5" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-[var(--color-text-primary)] text-sm truncate">
                                                        {dataset.name}
                                                    </h3>
                                                    {isEnabled && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                                    {dataset.category} • {dataset.articleCount?.toLocaleString() || 0} articles
                                                </p>
                                            </div>

                                            {/* Toggle */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isEnabled
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]'
                                                }`}>
                                                {isEnabled && <Check className="w-4 h-4" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {PRESETS.map((preset) => {
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all text-left group"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                            style={{
                                                background: `${preset.color}15`,
                                                color: preset.color
                                            }}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-[var(--color-text-primary)] text-sm">
                                                {preset.name}
                                            </h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {preset.description}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div
                                                className="text-xs font-medium px-2 py-1 rounded-md"
                                                style={{
                                                    background: `${preset.color}15`,
                                                    color: preset.color
                                                }}
                                            >
                                                Apply
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-glass)] backdrop-blur">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>AI will search enabled datasets for answers</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-medium transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetSettingsModal;