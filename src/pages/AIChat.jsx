import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Send, Bot, User, AlertCircle, Loader2,
    ChevronRight, BookOpen, Sparkles, X,
    Wifi, WifiOff, Download, Settings, Database,
    Heart, Tent, Scale, Check, Cpu,
    Activity, Eye, EyeOff
} from 'lucide-react';

// TODO: [CrossPlatform] AI_CHAT_DESKTOP_OPTIMIZATION
// Current: AIChat uses mobile-first single-column layout
//
// GAPS:
// - Desktop/Windows: Wasted horizontal space on wide screens
// - No keyboard shortcuts for desktop users (e.g., Ctrl+Enter to send)
// - Settings modal takes full width on desktop
// - Message bubbles could use side-by-side layout
//
// RECOMMENDATION:
// - Add responsive breakpoints for desktop (768px, 1024px)
// - Implement keyboard shortcuts (Ctrl/Cmd+Enter, Escape to close)
// - Use max-width container for chat on large screens
// - Consider split-pane: chat on left, sources on right
//
// Effort: M | Impact: Medium - Better desktop UX

// TODO: [CrossPlatform] MODEL_DOWNLOAD_PROGRESS_WINDOWS
// Current: Download progress works via transformers.js progress_callback
//
// ISSUE:
// - Windows native: transformers.js won't work (no browser APIs)
// - Download progress will be unavailable on Windows native builds
//
// SOLUTION:
// - Add platform detection in AIModelManager
// - Show "AI unavailable on Windows app" message instead of download UI
// - Or implement native download via Node.js fs for Windows
//
// Effort: S | Impact: Medium - Clear user communication

import { RAGPipeline } from '../services/ai/RAGPipeline';
import { AIModelManager } from '../services/ai/AIModelManager';
import { checkAICapability } from '../services/ai/AIArchitecture';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { datasetRegistry } from '../services/ai/DatasetRegistry';
import { createLogger } from '../utils/logger';
import {
    RAGPipelineVisualizer,
    DatasetNetworkGraph,
    DatasetActivityIndicator,
    IntentClassificationViz
} from '../components/ai-visualizations';
import AIReadingViz from '../components/ai-visualizations/AIReadingViz';
import MessageBubble from '../components/ai/MessageBubble';
import SourcesPanel from '../components/ai/SourcesPanel';

const log = createLogger('AIChat');

const AIChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check for context passed from AskAIChip or other pages
    // Persist context in state so it's available for follow-up questions
    const incomingContext = location.state?.context;
    const [persistedContext, setPersistedContext] = useState(null);

    const [messages, setMessages] = useState([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your offline emergency assistant. I can help you find information about:

• **Medical emergencies** - First aid, CPR, symptoms
• **Survival skills** - Water, shelter, navigation
• **Legal rights** - Police encounters, arrest procedures

Ask me anything, and I'll search through your downloaded content to find answers.

*Note: For life-threatening emergencies, always call 999/911 first.*`,
        timestamp: new Date()
    }]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [aiCapabilities, setAiCapabilities] = useState(null);
    const [modelStatus, setModelStatus] = useState('checking'); // checking, ready, no-model, fallback
    const [activeModel, setActiveModel] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    // showModelPicker removed - model management moved to /ai-models page
    const [availableModels, setAvailableModels] = useState([]);
    const [availableDatasets, setAvailableDatasets] = useState([]);
    const [enabledDatasets, setEnabledDatasets] = useState([]);
    const [downloadProgress, setDownloadProgress] = useState(null); // { modelId, progress, message }

    // Visualization state
    const [showVisualizations, setShowVisualizations] = useState(false);
    const [pipelineState, setPipelineState] = useState({
        isActive: false,
        currentStage: null,
        stageData: {}
    });
    const [queryActivity, setQueryActivity] = useState([]);
    const [lastClassification, setLastClassification] = useState(null);
    const [vizStages, setVizStages] = useState([]);
    const [vizActive, setVizActive] = useState(false);

    // Initialize AI capabilities
    useEffect(() => {
        const initializeAI = async () => {
            try {
                setModelStatus('checking');

                // Check device capabilities
                const capabilities = await checkAICapability();
                setAiCapabilities(capabilities);

                // Initialize model manager
                await AIModelManager.init();

                // Initialize RAG pipeline (loads embedding model if available)
                await RAGPipeline.init();

                // Get available models
                const models = await AIModelManager.getAvailableModels();
                setAvailableModels(models);

                // Initialize dataset registry
                const datasets = await datasetRegistry.getAll();
                setAvailableDatasets(datasets);

                const enabled = await datasetRegistry.getEnabledDatasets();
                setEnabledDatasets(enabled);

                // Check if any model is installed and loaded
                const installedModels = models.filter(m => m.isInstalled);
                const isModelLoaded = AIModelManager.isModelLoaded();

                if (isModelLoaded) {
                    setModelStatus('ready');
                    // Get active model info
                    const loadedModel = installedModels.find(m => m.isInstalled);
                    setActiveModel(loadedModel?.id || null);
                } else if (installedModels.length > 0) {
                    // Model installed but not loaded yet
                    setModelStatus('ready');
                    setActiveModel(installedModels[0]?.id || null);
                } else {
                    setModelStatus('no-model');
                }

            } catch (error) {
                log.error('AI init failed', error);
                setModelStatus('fallback');
            }
        };

        initializeAI();
    }, []);

    // Handle incoming context from AskAIChip
    useEffect(() => {
        if (incomingContext) {
            // Persist context for follow-up questions
            setPersistedContext(incomingContext);

            if (incomingContext.question) {
                // Auto-populate the input with the question
                setInputValue(incomingContext.question);
                // Optionally auto-send after a brief delay
                const timer = setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [incomingContext]);

    // Online/offline listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Function to refresh AI models (called from settings)
    const refreshAIModels = async () => {
        try {
            const models = await AIModelManager.getAvailableModels();
            setAvailableModels(models);
            const installedModels = models.filter(m => m.isInstalled);
            const isLoaded = AIModelManager.isModelLoaded();

            if (isLoaded) {
                setModelStatus('ready');
            } else if (installedModels.length > 0) {
                setModelStatus('ready');
                setActiveModel(installedModels[0]?.id || null);
            } else {
                setModelStatus('no-model');
            }
        } catch (_error) {
            setModelStatus('fallback');
        }
    };

    // Handle model download with progress
    const handleModelDownload = async (modelId) => {
        try {
            setDownloadProgress({ modelId, progress: 0, message: 'Starting download...' });

            const result = await AIModelManager.downloadModel(modelId, (progress, message) => {
                setDownloadProgress({ modelId, progress, message });
                log.debug(`Model download: ${progress}% - ${message}`);
            });

            if (result.success) {
                setDownloadProgress(null);
                setActiveModel(modelId);
                await refreshAIModels();
            } else {
                setDownloadProgress({ modelId, progress: 0, message: result.error || 'Download failed', error: true });
                setTimeout(() => setDownloadProgress(null), 3000);
            }
        } catch (error) {
            log.error('Model download failed', error);
            setDownloadProgress({ modelId, progress: 0, message: error.message, error: true });
            setTimeout(() => setDownloadProgress(null), 3000);
        }
    };

    // Handle model selection (switch active model)
    const handleModelSelect = async (modelId) => {
        const model = availableModels.find(m => m.id === modelId);
        if (!model?.isInstalled) {
            // Need to download first
            await handleModelDownload(modelId);
        } else {
            // Model already installed, just switch to it
            setActiveModel(modelId);
            // In future: could reload model here if needed
        }
    };

    // Handler for dataset toggle
    const handleDatasetToggle = async (datasetId, enabled) => {
        try {
            await datasetRegistry.setEnabled(datasetId, enabled);
            const updated = await datasetRegistry.getEnabledDatasets();
            setEnabledDatasets(updated);
            log.info('Dataset toggled', { datasetId, enabled });
        } catch (error) {
            log.error('Failed to toggle dataset', error);
        }
    };

    // Handler for dataset preset
    const handlePresetSelect = async (presetId) => {
        try {
            await datasetRegistry.applyPreset(presetId);
            const updated = await datasetRegistry.getEnabledDatasets();
            setEnabledDatasets(updated);
            log.info('Preset applied', { presetId });
        } catch (error) {
            log.error('Failed to apply preset', error);
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle keyboard shortcuts (Ctrl+Enter to send, Escape to close settings)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + Enter to send
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isLoading && inputValue.trim()) {
                    handleSend();
                }
            }
            // Escape to close settings
            if (e.key === 'Escape' && showSettings) {
                e.preventDefault();
                setShowSettings(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [inputValue, isLoading, showSettings]);

    const handleSend = async () => {
        const query = inputValue.trim();
        if (!query || isLoading) return;

        // Build context-enhanced query if we have context (persisted or incoming)
        // Use persisted context for all queries in session, not just the first one
        let contextualQuery = query;
        let contextInfo = null;
        const activeContext = persistedContext || incomingContext;

        if (activeContext?.sourceTitle) {
            // Use context for enhanced answers
            contextInfo = {
                sourceTitle: activeContext.sourceTitle,
                sourceCategory: activeContext.sourceCategory,
                sourcePath: activeContext.sourcePath
            };
            log.info('Query with context', contextInfo);
        }

        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            context: contextInfo,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setIsStreaming(false);
        setStreamingContent('');

        try {
            // Determine category from context or enabled datasets
            let category = 'general';
            if (activeContext?.sourceCategory) {
                category = activeContext.sourceCategory;
            } else if (enabledDatasets.length === 1) {
                // If only one dataset enabled, use its category
                const singleDataset = enabledDatasets[0];
                if (singleDataset.category) category = singleDataset.category;
            }

            // Get response from RAG pipeline with visualization events
            setVizStages([]);
            setVizActive(true);

            const result = await RAGPipeline.queryWithEvents(
                contextualQuery,
                {
                    category,
                    useAI: modelStatus === 'ready',
                    datasets: enabledDatasets.length > 0 ? enabledDatasets : null
                },
                (stageEvent) => {
                    setVizStages(prev => {
                        // Replace last event if same stage, otherwise append
                        const existing = prev.findIndex(s => s.stage === stageEvent.stage);
                        if (existing >= 0) {
                            const next = [...prev];
                            next[existing] = stageEvent;
                            return next;
                        }
                        return [...prev, stageEvent];
                    });
                }
            );

            setVizActive(false);

            // Add assistant message
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                sources: result.sources,
                usedFallback: result.usedFallback,
                confidence: result.confidence,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            log.error('Query failed', error);

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try rephrasing your question or use the search bar to find specific topics.",
                error: true,
                timestamp: new Date()
            }]);
        } finally {
            // Always clear loading state, even on error
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    const handleSuggestion = (question) => {
        setInputValue(question);
        inputRef.current?.focus();
    };

    const navigateToSource = (source) => {
        navigate(`/article/${source.id}`);
    };

    const suggestions = RAGPipeline.getSuggestedQuestions('medical');

    return (
        <div
            className="flex flex-col h-full animate-fade-in lg:flex-row"
            style={{ background: 'var(--color-bg-primary)' }}
        >
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-w-0">
                {/* Header */}
                <header
                    className="px-4 py-3 lg:px-6"
                    style={{
                        background: 'var(--color-bg-glass)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid var(--color-border-primary)'
                    }}
                >
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
                                }}
                            >
                                <Sparkles className="w-5 h-5" style={{ color: 'white' }} />
                            </div>
                            <div>
                                <h1
                                    className="font-bold"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    AI Assistant
                                </h1>
                                <div className="flex items-center gap-2 text-xs">
                                    <span
                                        className="flex items-center gap-1"
                                        style={{
                                            color: modelStatus === 'ready' ? 'var(--color-success)' :
                                                modelStatus === 'no-model' ? 'var(--color-info)' :
                                                    'var(--color-text-muted)'
                                        }}
                                    >
                                        {modelStatus === 'ready' && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {activeModel ? TRANSFORMERS_MODELS[activeModel]?.name || 'AI Ready' : 'AI Ready'}
                                            </>
                                        )}
                                        {modelStatus === 'no-model' && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Smart Search
                                            </>
                                        )}
                                        {modelStatus === 'checking' && 'Initializing...'}
                                        {modelStatus === 'fallback' && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Quick Answers
                                            </>
                                        )}
                                    </span>
                                    <span
                                        className="flex items-center gap-1"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        <Database className="w-3 h-3" />
                                        {enabledDatasets.length}/{availableDatasets.length}
                                    </span>
                                    <span
                                        className="flex items-center gap-1"
                                        style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                                    >
                                        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate('/ai-models')}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                title="Manage AI Models"
                            >
                                <Cpu className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowVisualizations(!showVisualizations)}
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                    color: showVisualizations ? 'var(--color-primary-400)' : 'var(--color-text-muted)',
                                    background: showVisualizations ? 'var(--color-bg-tertiary)' : 'transparent'
                                }}
                                onMouseEnter={(e) => !showVisualizations && (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                onMouseLeave={(e) => !showVisualizations && (e.currentTarget.style.background = 'transparent')}
                                title="Toggle AI Visualizations"
                            >
                                <Activity className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onSourceClick={navigateToSource}
                                animationDelay={index * 50}
                            />
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 animate-fade-in">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
                                    }}
                                >
                                    <Bot className="w-4 h-4" style={{ color: 'white' }} />
                                </div>
                                <div
                                    className="card rounded-2xl rounded-tl-none px-4 py-3"
                                >
                                    <Loader2
                                        className="w-5 h-5 animate-spin"
                                        style={{ color: 'var(--color-primary-500)' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && (
                    <div className="px-4 pb-2 lg:px-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="max-w-4xl mx-auto">
                            <p
                                className="text-xs mb-2"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Try asking:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.slice(0, 3).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestion(q)}
                                        className="text-sm px-3 py-1.5 rounded-full transition-all"
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border-primary)',
                                            color: 'var(--color-text-secondary)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                                            e.currentTarget.style.color = 'var(--color-primary-400)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div
                    className="px-4 py-3 pb-safe lg:px-6"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        borderTop: '1px solid var(--color-border-primary)'
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about emergencies, first aid, legal rights..."
                                className="flex-1 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border-primary)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-500)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="btn btn-primary p-3 rounded-xl"
                                style={{
                                    opacity: (!inputValue.trim() || isLoading) ? 0.5 : 1,
                                    cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Keyboard shortcut hint for desktop */}
                        <div className="hidden lg:flex items-center justify-end gap-2 mt-2">
                            <span className="text-xs kbd">Ctrl</span>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+</span>
                            <span className="text-xs kbd">Enter</span>
                            <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>to send</span>
                            <span className="mx-2" style={{ color: 'var(--color-border-primary)' }}>|</span>
                            <span className="text-xs kbd">Esc</span>
                            <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>to close settings</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualizations Panel - Desktop Only */}
            {showVisualizations && (
                <div
                    className="hidden lg:flex flex-col w-96 xl:w-[420px] border-l"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border-primary)'
                    }}
                >
                    <div
                        className="px-4 py-3"
                        style={{
                            background: 'var(--color-bg-glass)',
                            backdropFilter: 'blur(16px)',
                            borderBottom: '1px solid var(--color-border-primary)'
                        }}
                    >
                        <h2
                            className="font-semibold text-sm flex items-center gap-2"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            <Activity className="w-4 h-4" />
                            AI Data Flow
                        </h2>
                        <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Real-time visualization of AI processing
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AIReadingViz
                            stages={vizStages}
                            isActive={vizActive}
                            onReplay={() => setVizStages(prev => {
                                // Re-trigger by resetting and re-setting
                                setVizStages([]);
                                setTimeout(() => setVizStages(prev), 50);
                            })}
                        />
                    </div>
                </div>
            )}

            {/* Sources Panel - Desktop Only (shown when visualizations hidden) */}
            {!showVisualizations && <SourcesPanel messages={messages} onSourceClick={navigateToSource} />}

            {/* Mobile Visualizations Modal */}
            {showVisualizations && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowVisualizations(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl p-4"
                        style={{ background: 'var(--color-bg-secondary)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                AI Data Flow
                            </h2>
                            <button onClick={() => setShowVisualizations(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <AIReadingViz
                                stages={vizStages}
                                isActive={vizActive}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    models={availableModels}
                    capabilities={aiCapabilities}
                    modelStatus={modelStatus}
                    activeModel={activeModel}
                    datasets={availableDatasets}
                    enabledDatasets={enabledDatasets}
                    downloadProgress={downloadProgress}
                    onClose={() => setShowSettings(false)}
                    onModelDownload={handleModelDownload}
                    onModelSelect={handleModelSelect}
                    onDatasetToggle={handleDatasetToggle}
                    onPresetSelect={handlePresetSelect}
                />
            )}

            {/* Model Picker - now redirects to dedicated AI Models page */}
        </div>
    );
};

// =============================================================================
// VERIFIED: [Performance] MESSAGE_BUBBLE_DEEP_COMPARISON
// =============================================================================
// Implementation: Added custom comparison function to React.memo that compares
//   only the essential props (id, content, role, animationDelay) instead of
//   shallow object comparison. This prevents unnecessary re-renders when parent
//   re-renders with same message data but new object references.
// =============================================================================

// MessageBubble, SourcesPanel, and formatContent extracted to src/components/ai/
// SettingsModal kept inline due to tight coupling with AIChat state.




// Settings Modal
const SettingsModal = ({
    models,
    capabilities,
    modelStatus,
    activeModel,
    datasets,
    enabledDatasets,
    downloadProgress,
    onClose,
    _onModelDownload,
    onModelSelect,
    onDatasetToggle,
    onPresetSelect
}) => {
    // Helper to get icon component by name
    const getIconComponent = (iconName) => {
        const icons = { Heart, Tent, Scale, BookOpen };
        return icons[iconName] || Database;
    };

    return (
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center animate-fade-in"
            style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 'var(--z-modal-backdrop)'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="card max-w-lg w-full max-h-[80vh] overflow-hidden animate-scale-in"
                style={{
                    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                    background: 'var(--color-bg-secondary)'
                }}
            >
                {/* Modal Header */}
                <div
                    className="p-4 flex items-center justify-between"
                    style={{ borderBottom: '1px solid var(--color-border-primary)' }}
                >
                    <h2
                        className="font-bold text-lg"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        AI Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {/* Device Capabilities */}
                    <div className="mb-6">
                        <h3 className="section-header mb-2">Device Capabilities</h3>
                        <div
                            className="rounded-lg p-3 space-y-2 text-sm"
                            style={{ background: 'var(--color-bg-tertiary)' }}
                        >
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>WebGPU</span>
                                <span style={{ color: capabilities?.webGPU ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                    {capabilities?.webGPU ? '✓ Supported' : '✗ Not available'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>WASM SIMD</span>
                                <span style={{ color: capabilities?.wasmSIMD ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                    {capabilities?.wasmSIMD ? '✓ Supported' : '✗ Not available'}
                                </span>
                            </div>
                            {capabilities?.recommendedModel && (
                                <div
                                    className="pt-2"
                                    style={{ borderTop: '1px solid var(--color-border-primary)' }}
                                >
                                    <span style={{ color: 'var(--color-text-muted)' }}>Recommended: </span>
                                    <span
                                        className="font-medium"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {capabilities.recommendedModel.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Models */}
                    <div>
                        <h3 className="section-header mb-2">AI Models</h3>
                        <p
                            className="text-xs mb-3"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Choose a model for AI-powered answers. The app works fully without AI.
                        </p>
                        <div className="space-y-3">
                            {Object.values(TRANSFORMERS_MODELS).map(modelConfig => {
                                const model = models.find(m => m.id === modelConfig.id) || {
                                    id: modelConfig.id,
                                    isInstalled: false
                                };
                                const isActive = activeModel === modelConfig.id;
                                const isDownloading = downloadProgress?.modelId === modelConfig.id;

                                return (
                                    <button
                                        key={modelConfig.id}
                                        onClick={() => !isDownloading && onModelSelect(modelConfig.id)}
                                        disabled={isDownloading}
                                        className="w-full text-left p-3 rounded-xl transition-all"
                                        style={{
                                            background: isActive
                                                ? 'var(--color-primary-900)'
                                                : 'var(--color-bg-tertiary)',
                                            border: isActive
                                                ? '2px solid var(--color-primary-500)'
                                                : '2px solid transparent',
                                            opacity: isDownloading ? 0.8 : 1
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: isActive
                                                            ? 'var(--color-primary-600)'
                                                            : 'var(--color-bg-secondary)'
                                                    }}
                                                >
                                                    {isActive ? (
                                                        <Check className="w-4 h-4" style={{ color: 'white' }} />
                                                    ) : (
                                                        <Cpu className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4
                                                        className="font-medium flex items-center gap-2"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {modelConfig.name}
                                                        {modelConfig.id === 'tinyllama' && (
                                                            <span
                                                                className="text-xs px-2 py-0.5 rounded"
                                                                style={{
                                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                                    color: 'var(--color-success)'
                                                                }}
                                                            >
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: 'var(--color-text-muted)' }}
                                                    >
                                                        {modelConfig.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
                                                {modelConfig.sizeDisplay}
                                            </span>
                                        </div>

                                        {/* Download progress */}
                                        {isDownloading && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                                        {downloadProgress.message || 'Downloading...'}
                                                    </span>
                                                    <span style={{ color: 'var(--color-primary-400)' }}>
                                                        {downloadProgress.progress}%
                                                    </span>
                                                </div>
                                                <div
                                                    className="h-1.5 rounded-full overflow-hidden"
                                                    style={{ background: 'var(--color-bg-secondary)' }}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${downloadProgress.progress}%`,
                                                            background: downloadProgress.error
                                                                ? 'var(--color-danger)'
                                                                : 'linear-gradient(90deg, var(--color-primary-500), var(--color-accent-purple))'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Status indicator */}
                                        {!isDownloading && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {model.isInstalled ? (
                                                    <span
                                                        className="text-xs flex items-center gap-1"
                                                        style={{ color: 'var(--color-success)' }}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        {isActive ? 'Active' : 'Installed'}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="text-xs flex items-center gap-1"
                                                        style={{ color: 'var(--color-primary-400)' }}
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Tap to download
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* No model notice */}
                        <div
                            className="mt-3 p-3 rounded-lg text-xs"
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}
                        >
                            <p style={{ color: 'var(--color-info)' }}>
                                <strong>Note:</strong> The app works fully without AI models.
                                Templates cover all emergencies, and smart search provides
                                relevant information instantly.
                            </p>
                        </div>
                    </div>

                    {/* Dataset Toggles */}
                    <div className="mt-6">
                        <h3 className="section-header mb-2">Knowledge Sources</h3>
                        <p
                            className="text-xs mb-3"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Select which datasets the AI can access when answering questions
                        </p>

                        <div className="space-y-2">
                            {datasets.map(dataset => {
                                const IconComponent = getIconComponent(dataset.icon);
                                const isEnabled = enabledDatasets.some(d => d.id === dataset.id);

                                return (
                                    <div
                                        key={dataset.id}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{ background: 'var(--color-bg-tertiary)' }}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: `rgba(var(--color-${dataset.color || 'primary'}-rgb, 59, 130, 246), 0.2)`
                                                }}
                                            >
                                                <IconComponent
                                                    className="w-4 h-4"
                                                    style={{ color: 'var(--color-primary-400)' }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4
                                                    className="font-medium text-sm"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                    {dataset.name}
                                                </h4>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: 'var(--color-text-muted)' }}
                                                >
                                                    {dataset.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle Switch */}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={(e) => onDatasetToggle(dataset.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div
                                                className="w-11 h-6 rounded-full peer transition-colors"
                                                style={{
                                                    background: isEnabled
                                                        ? 'var(--color-primary-600)'
                                                        : 'var(--color-bg-primary)',
                                                    border: '1px solid var(--color-border-primary)'
                                                }}
                                            >
                                                <div
                                                    className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full transition-transform"
                                                    style={{
                                                        background: 'white',
                                                        transform: isEnabled ? 'translateX(20px)' : 'translateX(0)'
                                                    }}
                                                />
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Presets */}
                        <div
                            className="mt-4 pt-4"
                            style={{ borderTop: '1px solid var(--color-border-primary)' }}
                        >
                            <p
                                className="text-xs mb-2"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Quick Presets:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All Datasets' },
                                    { id: 'survival-only', label: 'Survival Only' },
                                    { id: 'medical-only', label: 'Medical Only' },
                                    { id: 'civil-unrest', label: 'Civil Unrest' },
                                    { id: 'privacy-mode', label: 'Privacy Mode' }
                                ].map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => onPresetSelect(preset.id)}
                                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border-primary)',
                                            color: 'var(--color-text-secondary)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                                            e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current Status - 3 Tier System */}
                    <div
                        className="mt-6 p-3 rounded-lg text-sm"
                        style={{ background: 'var(--color-bg-tertiary)' }}
                    >
                        <p
                            className="text-xs font-medium mb-2"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Current Capability Level
                        </p>

                        {/* Tier indicators */}
                        <div className="space-y-2">
                            {/* Tier 1 - Always available */}
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: 'var(--color-success)' }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    Quick Answers
                                </span>
                                <span
                                    className="text-xs ml-auto"
                                    style={{ color: 'var(--color-success)' }}
                                >
                                    ✓ Always Ready
                                </span>
                            </div>

                            {/* Tier 2 - Smart Search */}
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                        background: modelStatus !== 'fallback'
                                            ? 'var(--color-info)'
                                            : 'var(--color-text-muted)'
                                    }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    Smart Search
                                </span>
                                <span
                                    className="text-xs ml-auto"
                                    style={{
                                        color: modelStatus !== 'fallback'
                                            ? 'var(--color-info)'
                                            : 'var(--color-text-muted)'
                                    }}
                                >
                                    {modelStatus !== 'fallback' ? '✓ Active' : '○ Loading...'}
                                </span>
                            </div>

                            {/* Tier 3 - Full AI */}
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                        background: modelStatus === 'ready'
                                            ? 'var(--color-accent-purple)'
                                            : 'var(--color-text-muted)'
                                    }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    AI Assistant
                                </span>
                                <span
                                    className="text-xs ml-auto"
                                    style={{
                                        color: modelStatus === 'ready'
                                            ? 'var(--color-accent-purple)'
                                            : 'var(--color-text-muted)'
                                    }}
                                >
                                    {modelStatus === 'ready'
                                        ? `✓ ${activeModel ? TRANSFORMERS_MODELS[activeModel]?.name : 'Ready'}`
                                        : '○ Not installed'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Dataset count */}
                        <div
                            className="flex items-center gap-2 mt-3 pt-3"
                            style={{ borderTop: '1px solid var(--color-border-primary)' }}
                        >
                            <Database className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>
                                {enabledDatasets.length} of {datasets.length} datasets enabled
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
