/**
 * DatasetActivityIndicator — Real-time Dataset Usage Display
 *
 * Shows which datasets are being actively queried during AI generation.
 * Provides visual feedback connecting AI responses to knowledge sources.
 *
 * Features:
 * - Animated pulsing dots for active datasets during generation
 * - Category-colored indicators (Medical=red, Survival=orange, Legal=purple, Guides=slate)
 * - Count of documents retrieved from each dataset
 * - Collapsible/expandable for mobile
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Tent, Scale, BookOpen, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DATASET_CONFIG = {
    health: { icon: Heart, label: 'Medical', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    medical: { icon: Heart, label: 'Medical', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    survival: { icon: Tent, label: 'Survival', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
    law: { icon: Scale, label: 'Legal', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    legal: { icon: Scale, label: 'Legal', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    guides: { icon: BookOpen, label: 'Guides', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' },
    general: { icon: BookOpen, label: 'General', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' }
};

const styles = `
.dataset-activity {
    background: var(--color-bg-secondary, rgba(15, 23, 42, 0.6));
    border: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 12px 16px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.dataset-activity__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
}

.dataset-activity__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.dataset-activity__title-icon {
    width: 14px;
    height: 14px;
    color: var(--color-primary-400, #6366f1);
}

.dataset-activity__badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
}

.dataset-activity__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
}

.dataset-activity__badge-dot.active {
    animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
}

.dataset-activity__expand {
    color: var(--color-text-muted, #64748b);
    transition: transform 0.2s ease;
}

.dataset-activity__expand.open {
    transform: rotate(180deg);
}

.dataset-activity__content {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.06));
}

.dataset-activity__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
}

.dataset-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid transparent;
    transition: all 0.2s ease;
}

.dataset-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--color-border-primary, rgba(255, 255, 255, 0.1));
}

.dataset-item.active {
    animation: dataset-pulse 2s ease-in-out infinite;
}

@keyframes dataset-pulse {
    0%, 100% { 
        background: rgba(255, 255, 255, 0.03);
        border-color: transparent;
    }
    50% { 
        background: rgba(255, 255, 255, 0.08);
        border-color: currentColor;
    }
}

.dataset-item__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.dataset-item__info {
    flex: 1;
    min-width: 0;
}

.dataset-item__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary, #cbd5e1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dataset-item__count {
    font-size: 10px;
    color: var(--color-text-muted, #64748b);
}

.dataset-item__status {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
}

.dataset-item__status.active {
    animation: status-blink 1s ease-in-out infinite;
}

@keyframes status-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.dataset-activity__summary {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.06));
    font-size: 11px;
    color: var(--color-text-muted, #64748b);
}

.dataset-activity__summary-value {
    font-weight: 600;
    color: var(--color-text-secondary, #cbd5e1);
}

.dataset-activity__empty {
    text-align: center;
    padding: 16px;
    color: var(--color-text-muted, #64748b);
    font-size: 12px;
}

.dataset-activity__compact {
    display: flex;
    align-items: center;
    gap: 6px;
}

.dataset-activity__compact-dots {
    display: flex;
    align-items: center;
    gap: 4px;
}

.dataset-activity__compact-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.dataset-activity__compact-dot.inactive {
    background: rgba(255, 255, 255, 0.1);
}

.dataset-activity__compact-dot.active {
    box-shadow: 0 0 8px currentColor;
}

.dataset-activity__compact-dot.pulse {
    animation: compact-pulse 1.5s ease-in-out infinite;
}

@keyframes compact-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
}

@media (max-width: 640px) {
    .dataset-activity__grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;

/**
 * Dataset Activity Indicator Component
 *
 * @param {Object} props
 * @param {Array} props.datasets - Active datasets array [{id, name, category, documentCount}]
 * @param {boolean} props.isGenerating - Whether AI is currently generating
 * @param {Object} props.stageData - Current pipeline stage data from RAG
 * @param {boolean} props.compact - Show compact dots-only view
 * @param {boolean} props.defaultExpanded - Default expanded state
 */
const DatasetActivityIndicator = ({
    datasets = [],
    isGenerating = false,
    stageData = {},
    compact = false,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [activityLog, setActivityLog] = useState([]);

    // Track retrieval activity from stageData
    useEffect(() => {
        if (stageData.retrieval && stageData.retrieval.sources) {
            const newActivity = stageData.retrieval.sources.map(source => ({
                dataset: source.store || 'general',
                count: 1,
                timestamp: Date.now(),
                title: source.title
            }));

            setActivityLog(prev => {
                // Keep last 10 activities, add new ones
                const combined = [...newActivity, ...prev].slice(0, 10);
                return combined;
            });
        }
    }, [stageData.retrieval]);

    // Get unique active datasets
    const activeDatasetIds = [...new Set(activityLog.map(a => a.dataset))];
    const datasetCounts = activeDatasetIds.reduce((acc, id) => {
        acc[id] = activityLog.filter(a => a.dataset === id).length;
        return acc;
    }, {});

    if (datasets.length === 0 && activityLog.length === 0) {
        return (
            <>
                <style>{styles}</style>
                <div className="dataset-activity">
                    <div className="dataset-activity__empty">
                        <Database size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <div>No datasets enabled</div>
                        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                            Enable datasets in settings to enhance AI responses
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Compact mode - just show colored dots
    if (compact) {
        return (
            <>
                <style>{styles}</style>
                <div className="dataset-activity__compact" title="Active datasets">
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
                    </span>
                    <div className="dataset-activity__compact-dots">
                        {datasets.slice(0, 4).map((dataset, idx) => {
                            const config = DATASET_CONFIG[dataset.id] || DATASET_CONFIG.general;
                            const isActive = isGenerating || activeDatasetIds.includes(dataset.store || dataset.id);
                            const hasActivity = activeDatasetIds.includes(dataset.store || dataset.id);

                            return (
                                <div
                                    key={dataset.id || idx}
                                    className={`dataset-activity__compact-dot ${isActive ? 'active' : 'inactive'} ${hasActivity && isGenerating ? 'pulse' : ''}`}
                                    style={{
                                        backgroundColor: isActive ? config.color : undefined,
                                        color: config.color
                                    }}
                                    title={config.label}
                                />
                            );
                        })}
                        {datasets.length > 4 && (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 2 }}>
                                +{datasets.length - 4}
                            </span>
                        )}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="dataset-activity">
                <div className="dataset-activity__header" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="dataset-activity__title">
                        <Activity className="dataset-activity__title-icon" size={14} />
                        <span>Knowledge Scope</span>
                    </div>
                    <div className="dataset-activity__badge">
                        <span className={`dataset-activity__badge-dot ${isGenerating ? 'active' : ''}`} />
                        <span>{isGenerating ? 'Querying' : `${activityLog.length} sources`}</span>
                        {isExpanded ? (
                            <ChevronUp size={14} className="dataset-activity__expand open" />
                        ) : (
                            <ChevronDown size={14} className="dataset-activity__expand" />
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="dataset-activity__content"
                        >
                            <div className="dataset-activity__grid">
                                {datasets.map((dataset) => {
                                    const config = DATASET_CONFIG[dataset.id] || DATASET_CONFIG.general;
                                    const isActive = isGenerating || activeDatasetIds.includes(dataset.store || dataset.id);
                                    const count = datasetCounts[dataset.store || dataset.id] || 0;
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={dataset.id}
                                            className={`dataset-item ${isActive ? 'active' : ''}`}
                                            style={{ color: config.color }}
                                        >
                                            <Icon className="dataset-item__icon" style={{ color: config.color }} />
                                            <div className="dataset-item__info">
                                                <div className="dataset-item__label">{config.label}</div>
                                                {count > 0 && (
                                                    <div className="dataset-item__count">{count} docs found</div>
                                                )}
                                            </div>
                                            <div className={`dataset-item__status ${isActive ? 'active' : ''}`} />
                                        </div>
                                    );
                                })}
                            </div>

                            {activityLog.length > 0 && (
                                <div className="dataset-activity__summary">
                                    <span>Last query:</span>
                                    <span className="dataset-activity__summary-value">
                                        {activityLog[0].title?.substring(0, 30)}
                                        {activityLog[0].title?.length > 30 ? '...' : ''}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default DatasetActivityIndicator;