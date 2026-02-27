/**
 * DatasetAIBridge — Visual Bridge Between Datasets and AI
 *
 * Displays the active connection between mounted datasets and the AI system.
 * Shows:
 * - Which datasets are feeding the AI
 * - Semantic search status
 * - Real-time RAG pipeline state
 * - Context window utilization
 *
 * Visual metaphor: A "patchbay" or "routing matrix" showing active connections.
 *
 * Compliance: .clinerules §1 - AI operations through AIModelManager
 *             .clinerules §4 - DatasetRegistry integration
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Cpu, Database, Zap, Activity, ArrowRight, CheckCircle,
    AlertCircle, Loader, Layers, Sparkles, WifiOff
} from 'lucide-react';
import { datasetRegistry } from '../../services/ai/DatasetRegistry';
import { AIModelManager } from '../../services/ai/AIModelManager';
import RAGPipeline from '../../services/ai/RAGPipeline';
import { TRANSFORMERS_MODELS } from '../../services/ai/TransformersEngine';
import { getCategoryConfig } from '../../config/categories';
import './DatasetAIBridge.css';

/**
 * Connection Line Component — SVG path between dataset and AI
 */
const ConnectionLine = ({ active, pulsing, color }) => (
    <svg className="bridge-line" viewBox="0 0 40 100" preserveAspectRatio="none">
        <defs>
            <linearGradient id={`lineGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={color} stopOpacity={0.2} />
            </linearGradient>
        </defs>
        <line
            x1="20"
            y1="0"
            x2="20"
            y2="100"
            stroke={active ? `url(#lineGradient-${color})` : 'var(--color-border-primary)'}
            strokeWidth={active ? 2 : 1}
            strokeDasharray={active ? (pulsing ? '8 4' : '0') : '4 4'}
            className={pulsing ? 'bridge-line--pulse' : ''}
        />
        {active && pulsing && (
            <circle cx="20" cy="10" r="3" fill={color} className="bridge-line--packet" />
        )}
    </svg>
);

/**
 * Dataset Node — Individual dataset in the bridge
 */
const DatasetNode = ({ dataset, isEnabled, isQuerying }) => {
    const config = getCategoryConfig(dataset.id);
    const Icon = config.icon;

    return (
        <div
            className={`bridge-node bridge-node--dataset ${isEnabled ? 'bridge-node--active' : 'bridge-node--disabled'}`}
            style={{
                '--node-color': config.color,
                '--node-bg': config.bgGradient
            }}
        >
            <div className="bridge-node__icon-wrapper" style={{ background: config.bgGradient }}>
                <Icon size={20} style={{ color: config.color }} />
            </div>
            <div className="bridge-node__content">
                <span className="bridge-node__name">{dataset.name}</span>
                <span className="bridge-node__status">
                    {isEnabled ? (
                        isQuerying ? (
                            <><Activity size={12} className="bridge-node__pulse" /> Active</>
                        ) : (
                            <><CheckCircle size={12} /> Ready</>
                        )
                    ) : (
                        <><WifiOff size={12} /> Disabled</>
                    )}
                </span>
            </div>
            <div className={`bridge-node__indicator ${isEnabled ? 'bridge-node__indicator--on' : ''}`} />
        </div>
    );
};

/**
 * AI Hub — Central AI system node
 */
const AIHub = ({ modelName, isLoaded, isGenerating, semanticSearchReady }) => {
    return (
        <div className={`bridge-hub ${isLoaded ? 'bridge-hub--active' : ''} ${isGenerating ? 'bridge-hub--generating' : ''}`}>
            <div className="bridge-hub__core">
                {isGenerating ? (
                    <div className="bridge-hub__ripple">
                        <span /><span /><span />
                    </div>
                ) : null}
                <div className="bridge-hub__icon">
                    {isLoaded ? (
                        <Sparkles size={32} className={isGenerating ? 'bridge-hub__sparkle' : ''} />
                    ) : (
                        <Cpu size={32} />
                    )}
                </div>
            </div>

            <div className="bridge-hub__info">
                <h3 className="bridge-hub__name">
                    {isLoaded ? (modelName || 'AI Ready') : 'No AI Model'}
                </h3>
                <div className="bridge-hub__badges">
                    {isLoaded && (
                        <span className="bridge-hub__badge bridge-hub__badge--ready">
                            <Zap size={12} /> Active
                        </span>
                    )}
                    {semanticSearchReady && (
                        <span className="bridge-hub__badge bridge-hub__badge--semantic">
                            <Layers size={12} /> Semantic
                        </span>
                    )}
                    {isGenerating && (
                        <span className="bridge-hub__badge bridge-hub__badge--generating">
                            <Loader size={12} className="bridge-hub__spin" /> Generating...
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Context Meter — Shows context window utilization
 */
const ContextMeter = ({ tokensUsed, maxTokens = 2048 }) => {
    const percentage = Math.min((tokensUsed / maxTokens) * 100, 100);
    const getColor = () => {
        if (percentage < 50) return '#10b981';
        if (percentage < 80) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="bridge-meter">
            <div className="bridge-meter__label">
                <Database size={14} />
                <span>Context Window</span>
                <span className="bridge-meter__value">{Math.round(percentage)}%</span>
            </div>
            <div className="bridge-meter__bar">
                <div
                    className="bridge-meter__fill"
                    style={{
                        width: `${percentage}%`,
                        background: getColor()
                    }}
                />
            </div>
            <div className="bridge-meter__tokens">
                {tokensUsed.toLocaleString()} / {maxTokens.toLocaleString()} tokens
            </div>
        </div>
    );
};

/**
 * Main Dataset-AI Bridge Component
 */
const DatasetAIBridge = ({
    showDetails = true,
    compact = false,
    onDatasetToggle
}) => {
    const [datasets, setDatasets] = useState([]);
    const [aiStatus, setAiStatus] = useState({
        isLoaded: false,
        modelName: null,
        isGenerating: false
    });
    const [semanticSearch, setSemanticSearch] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [contextInfo, setContextInfo] = useState({ tokensUsed: 0, maxTokens: 2048 });

    // Initialize and load state
    useEffect(() => {
        const loadState = async () => {
            // Load datasets
            const allDatasets = await datasetRegistry.getAll();
            setDatasets(allDatasets);

            // Load AI status
            await AIModelManager.init();
            const isLoaded = AIModelManager.isModelLoaded();
            const modelName = AIModelManager.getCurrentModel();

            // Get model context length for accurate meter
            const model = modelName ? TRANSFORMERS_MODELS[modelName] : null;
            const maxTokens = model?.contextLength || 2048;

            setAiStatus(prev => ({
                ...prev,
                isLoaded,
                modelName
            }));
            setContextInfo(prev => ({ ...prev, maxTokens }));

            // Check semantic search
            await RAGPipeline.init();
            setSemanticSearch(RAGPipeline.isSemanticSearchReady());
        };

        loadState();

        // Listen for AI generation events
        const handleGenerating = (e) => {
            setAiStatus(prev => ({ ...prev, isGenerating: e.detail?.generating ?? true }));
            setIsQuerying(e.detail?.generating ?? true);
        };

        const handleGenerationComplete = () => {
            setAiStatus(prev => ({ ...prev, isGenerating: false }));
            setIsQuerying(false);
        };

        // Listen for context updates from RAGPipeline
        const handleContextUpdate = (e) => {
            const { tokensUsed, maxTokens } = e.detail || {};
            if (tokensUsed !== undefined) {
                setContextInfo(prev => ({
                    ...prev,
                    tokensUsed,
                    maxTokens: maxTokens || prev.maxTokens
                }));
            }
        };

        window.addEventListener('ai-generating-start', handleGenerating);
        window.addEventListener('ai-generating-end', handleGenerationComplete);
        window.addEventListener('rag-context-update', handleContextUpdate);

        return () => {
            window.removeEventListener('ai-generating-start', handleGenerating);
            window.removeEventListener('ai-generating-end', handleGenerationComplete);
            window.removeEventListener('rag-context-update', handleContextUpdate);
        };
    }, []);

    // Toggle dataset
    const handleToggle = useCallback(async (datasetId) => {
        const dataset = datasets.find(d => d.id === datasetId);
        if (!dataset) return;

        await datasetRegistry.setEnabled(datasetId, !dataset.enabled);

        // Refresh
        const updated = await datasetRegistry.getAll();
        setDatasets(updated);

        onDatasetToggle?.(datasetId, !dataset.enabled);
    }, [datasets, onDatasetToggle]);

    const enabledDatasets = datasets.filter(d => d.enabled);

    if (compact) {
        // Compact view for headers/status bars
        return (
            <div className="bridge-bridge bridge-bridge--compact">
                <div className="bridge-bridge__status">
                    <div className={`bridge-bridge__dot ${aiStatus.isLoaded ? 'bridge-bridge__dot--active' : ''}`} />
                    <span className="bridge-bridge__text">
                        {enabledDatasets.length} datasets → {aiStatus.isLoaded ? aiStatus.modelName : 'AI Offline'}
                    </span>
                    {semanticSearch && (
                        <span className="bridge-bridge__badge">Semantic</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bridge-bridge">
            {/* Header */}
            <div className="bridge-bridge__header">
                <h2 className="bridge-bridge__title">AI Data Bridge</h2>
                <p className="bridge-bridge__subtitle">
                    {enabledDatasets.length} of {datasets.length} datasets active
                </p>
            </div>

            {/* Main visualization */}
            <div className="bridge-bridge__matrix">
                {/* Datasets column */}
                <div className="bridge-bridge__datasets">
                    <h3 className="bridge-bridge__column-title">
                        <Database size={16} /> Data Sources
                    </h3>
                    <div className="bridge-bridge__nodes">
                        {datasets.map(dataset => (
                            <DatasetNode
                                key={dataset.id}
                                dataset={dataset}
                                isEnabled={dataset.enabled}
                                isQuerying={isQuerying && dataset.enabled}
                            />
                        ))}
                    </div>
                </div>

                {/* Connections */}
                <div className="bridge-bridge__connections">
                    {datasets.map((dataset, _i) => (
                        <ConnectionLine
                            key={dataset.id}
                            active={dataset.enabled}
                            pulsing={isQuerying && dataset.enabled}
                            color={getCategoryConfig(dataset.id).color}
                        />
                    ))}
                </div>

                {/* AI Hub */}
                <div className="bridge-bridge__ai">
                    <AIHub
                        modelName={aiStatus.modelName}
                        isLoaded={aiStatus.isLoaded}
                        isGenerating={aiStatus.isGenerating}
                        semanticSearchReady={semanticSearch}
                    />
                </div>
            </div>

            {/* Details section */}
            {showDetails && (
                <div className="bridge-bridge__details">
                    {/* Context meter */}
                    <ContextMeter tokensUsed={contextInfo.tokensUsed} />

                    {/* Dataset toggles */}
                    <div className="bridge-bridge__toggles">
                        <h4>Quick Toggles</h4>
                        <div className="bridge-bridge__toggle-grid">
                            {datasets.map(dataset => {
                                const config = getCategoryConfig(dataset.id);
                                return (
                                    <button
                                        key={dataset.id}
                                        className={`bridge-bridge__toggle ${dataset.enabled ? 'bridge-bridge__toggle--on' : ''}`}
                                        onClick={() => handleToggle(dataset.id)}
                                        style={{
                                            '--toggle-color': config.color,
                                            '--toggle-bg': config.bgGradient
                                        }}
                                    >
                                        <config.icon size={16} />
                                        <span>{config.shortName}</span>
                                        <div className="bridge-bridge__toggle-indicator" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="bridge-bridge__info">
                        <AlertCircle size={14} />
                        <p>
                            Disabling datasets limits what the AI can reference.
                            All processing happens locally on your device.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatasetAIBridge;