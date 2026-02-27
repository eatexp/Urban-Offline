import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
    Bot, BookOpen, Sparkles, X,
    Wifi, WifiOff, Settings, Database,
    Activity, Cpu, Menu, Zap, Loader2
} from 'lucide-react';

// Living Reader components
// Living Reader components
import Composer from '../components/features/ai/Composer';
import MessageThread from '../components/features/ai/MessageThread';
import SourceViewer from '../components/features/ai/SourceViewer';
import SessionList from '../components/features/ai/chat/SessionList';
import DatasetActivityIndicator from '../components/shared/DatasetActivityIndicator';
import DatasetSettingsModal from '../components/features/ai/chat/DatasetSettingsModal';

import { useAIGenerating } from '../contexts/AIGeneratingContext';
import { useChatSession } from '../hooks/useChatSession';

import { RAGPipeline } from '../services/ai/RAGPipeline';
import { AIModelManager } from '../services/ai/AIModelManager';
import { checkAICapability } from '../services/ai/AIArchitecture';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { datasetRegistry } from '../services/ai/DatasetRegistry';
import { createLogger } from '../utils/logger';
import {
    RAGPipelineVisualizer,
    DatasetNetworkGraph,
    IntentClassificationViz
} from '../components/features/ai/visualizations';
import AIReadingViz from '../components/features/ai/visualizations/AIReadingViz';

const log = createLogger('AIChat');

const AIChat = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // ── Mission Control (State & Persistence) ──────────────────────────
    const {
        sessionId,
        sessions,
        messages,
        setMessages, // Imperative updates for streaming
        isLoading,
        isGenerating,
        setIsGenerating,
        abortControllerRef,

        createNewSession,
        switchSession,
        removeSession,
        addMessage,
        endGeneration
    } = useChatSession();

    // Cross-page AI generating signal → Cartridge pulse
    // We sync the hook's generating state with the context
    const { setIsGenerating: setGlobalIsGenerating } = useAIGenerating();

    useEffect(() => {
        setGlobalIsGenerating(isGenerating);
    }, [isGenerating, setGlobalIsGenerating]);

    // ── UI State ───────────────────────────────────────────────────────
    const [showHistory, setShowHistory] = useState(false);
    const [previewSource, setPreviewSource] = useState(null);
    const [_showSettings, _setShowSettings] = useState(false);
    const [showVisualizations, setShowVisualizations] = useState(false);
    const [vizTab, setVizTab] = useState('logic'); // 'logic', 'network'

    // Check for context passed from other pages
    const incomingContext = location.state?.context;
    const [persistedContext, setPersistedContext] = useState(null);

    // AI & Model State
    const [_isOnline, setIsOnline] = useState(navigator.onLine);
    const [_aiCapabilities, setAiCapabilities] = useState(null);
    const [modelStatus, setModelStatus] = useState('checking'); // checking, ready, no-model, fallback, low-battery
    const [activeModel, setActiveModel] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);
    const [availableDatasets, setAvailableDatasets] = useState([]);
    const [enabledDatasets, setEnabledDatasets] = useState([]);
    const [_downloadProgress, setDownloadProgress] = useState(null);
    const [batteryStatus, setBatteryStatus] = useState({ level: 100, charging: true, lowBattery: false });

    const [vizStages, setVizStages] = useState([]);
    const [vizActive, setVizActive] = useState(false);

    const [streamingMessageId, setStreamingMessageId] = useState(null);

    // Ref to store handleSend function for access in effects
    const handleSendRef = useRef(null);

    // ── Initialization ────────────────────────────────────────────────
    useEffect(() => {
        const initializeAI = async () => {
            try {
                setModelStatus('checking');
                const capabilities = await checkAICapability();
                setAiCapabilities(capabilities);
                await AIModelManager.init();
                await RAGPipeline.init();

                const models = await AIModelManager.getAvailableModels();
                setAvailableModels(models);

                const datasets = await datasetRegistry.getAll();
                setAvailableDatasets(datasets);

                const enabled = await datasetRegistry.getEnabledDatasets();
                setEnabledDatasets(enabled);

                const installedModels = models.filter(m => m.isInstalled);
                const isModelLoaded = AIModelManager.isModelLoaded();

                if (isModelLoaded) {
                    setModelStatus('ready');
                    const loadedModel = installedModels.find(m => m.isInstalled);
                    setActiveModel(loadedModel?.id || null);
                } else if (installedModels.length > 0) {
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

    // Handle incoming context
    useEffect(() => {
        if (incomingContext) {
            setPersistedContext(incomingContext);
        }
    }, [incomingContext]);

    // Handle "Ask AI" from Search - runs after handleSend is defined via ref
    useEffect(() => {
        if (location.state?.initialPrompt) {
            const prompt = location.state.initialPrompt;
            // Clear state to prevent re-sending on reload
            window.history.replaceState({}, document.title);

            // Use timeout to ensure component is mounted and ref is set
            setTimeout(() => {
                if (typeof handleSendRef.current === 'function') {
                    handleSendRef.current(prompt);
                }
            }, 100);
        }
    }, [location.state]);

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

    // Battery status monitoring
    useEffect(() => {
        const checkBattery = async () => {
            const status = await AIModelManager.getBatteryStatus();
            setBatteryStatus(status);

            // Update model status if battery is low
            if (status.lowBattery && modelStatus === 'ready') {
                setModelStatus('low-battery');
            } else if (!status.lowBattery && modelStatus === 'low-battery') {
                setModelStatus('ready');
            }
        };

        checkBattery();

        // Set up battery listener if available
        let batteryRef = null;
        const setupBatteryListener = async () => {
            try {
                if ('getBattery' in navigator) {
                    batteryRef = await navigator.getBattery();

                    const handleBatteryChange = () => {
                        const level = batteryRef.level * 100;
                        const charging = batteryRef.charging;
                        const lowBattery = level < 20 && !charging;

                        setBatteryStatus({ level, charging, lowBattery });

                        // Update model status based on battery
                        if (lowBattery && modelStatus === 'ready') {
                            setModelStatus('low-battery');
                        } else if (!lowBattery && modelStatus === 'low-battery') {
                            setModelStatus('ready');
                        }
                    };

                    batteryRef.addEventListener('levelchange', handleBatteryChange);
                    batteryRef.addEventListener('chargingchange', handleBatteryChange);

                    return () => {
                        batteryRef.removeEventListener('levelchange', handleBatteryChange);
                        batteryRef.removeEventListener('chargingchange', handleBatteryChange);
                    };
                }
            } catch (error) {
                log.debug('Battery API not available', error);
            }
        };

        const cleanup = setupBatteryListener();
        return () => {
            if (cleanup) cleanup.then(fn => fn && fn());
        };
    }, [modelStatus]);

    // ENHANCED: [Phase 2.5b] Cleanup AbortController on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [abortControllerRef]);

    // ── Handlers ──────────────────────────────────────────────────────

    const handleNewChat = async () => {
        await createNewSession();
        setShowHistory(false);
    };

    const handleSelectConversation = async (id) => {
        await switchSession(id);
        setShowHistory(false);
    };

    // Define the actual send logic and store in ref
    const handleSendLogic = useCallback(async (query) => {
        if (!query || isLoading) return;

        // Abort previous stream if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Context
        let contextInfo = null;
        const activeContext = persistedContext || incomingContext;
        if (activeContext?.sourceTitle) {
            contextInfo = {
                sourceTitle: activeContext.sourceTitle,
                sourceCategory: activeContext.sourceCategory,
                sourcePath: activeContext.sourcePath,
            };
        }

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            context: contextInfo,
            timestamp: new Date(),
        };

        // Streaming Placeholder ID
        const assistantId = (Date.now() + 1).toString();

        // 1. Add User Message (Persisted)
        await addMessage(userMessage);

        setIsGenerating(true);
        setStreamingMessageId(assistantId);

        try {
            let category = 'general';
            if (activeContext?.sourceCategory) {
                category = activeContext.sourceCategory;
            } else if (enabledDatasets.length === 1) {
                category = enabledDatasets[0].category || 'general';
            }

            setVizStages([]);
            setVizActive(true);

            // Optimistic assistant message (empty)
            setMessages(prev => [...prev, {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            }]);

            const result = await RAGPipeline.queryWithEvents(
                query,
                {
                    category,
                    useAI: modelStatus === 'ready',
                    datasets: enabledDatasets.length > 0 ? enabledDatasets : null,
                },
                (stageEvent) => {
                    if (controller.signal.aborted) return;
                    setVizStages(prev => {
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

            if (controller.signal.aborted) return;

            setVizActive(false);

            // 2. Add AI Message (Persisted)
            const assistantMessage = {
                id: assistantId,
                role: 'assistant',
                content: result.response,
                sources: result.sources,
                usedFallback: result.usedFallback,
                confidence: result.confidence,
                timestamp: new Date(),
            };

            // This persists it and updates the state with the final version
            await addMessage(assistantMessage);

        } catch (error) {
            if (controller.signal.aborted) return;
            log.error('Query failed', error);

            const errorMessage = {
                id: assistantId,
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try rephrasing or use search.",
                error: true,
                timestamp: new Date(),
            };
            await addMessage(errorMessage);
        } finally {
            if (!controller.signal.aborted) {
                endGeneration();
                setStreamingMessageId(null);
            }
        }
    }, [isLoading, persistedContext, incomingContext, enabledDatasets, modelStatus, addMessage, endGeneration, setIsGenerating, setMessages, abortControllerRef]);

    // Store in ref for effects to access
    handleSendRef.current = handleSendLogic;

    // Public handleSend that uses the ref
    const handleSend = useCallback(async (query) => {
        return handleSendRef.current(query);
    }, []);

    const handleSuggestion = useCallback((question) => {
        handleSend(question);
    }, [handleSend]);

    // Simple helpers
    const handleSourcePreview = (source) => setPreviewSource(source);
    const _navigateToSource = (source) => navigate(`/article/${source.id}`);
    const suggestions = RAGPipeline.getSuggestedQuestions('medical');

    // Model management helpers
    const refreshAIModels = async () => {
        try {
            const models = await AIModelManager.getAvailableModels();
            setAvailableModels(models);
        } catch (_) { setModelStatus('fallback'); }
    };

    const handleModelDownload = async (modelId) => {
        try {
            setDownloadProgress({ modelId, progress: 0, message: 'Starting download...' });
            const result = await AIModelManager.downloadModel(modelId, (p, m) => {
                setDownloadProgress({ modelId, progress: p, message: m });
            });
            if (result.success) {
                setDownloadProgress(null);
                setActiveModel(modelId);
                await refreshAIModels();
            } else {
                setDownloadProgress({ modelId, progress: 0, message: result.error || 'Failed', error: true });
                setTimeout(() => setDownloadProgress(null), 3000);
            }
        } catch (e) {
            setDownloadProgress({ modelId, progress: 0, message: e.message, error: true });
            setTimeout(() => setDownloadProgress(null), 3000);
        }
    };

    const _handleModelSelect = async (modelId) => {
        const model = availableModels.find(m => m.id === modelId);
        if (!model?.isInstalled) await handleModelDownload(modelId);
        else setActiveModel(modelId);
    };

    const _handleDatasetToggle = async (id, enabled) => {
        await datasetRegistry.setEnabled(id, enabled);
        setEnabledDatasets(await datasetRegistry.getEnabledDatasets());
    };

    const _handlePresetSelect = async (id) => {
        await datasetRegistry.applyPreset(id);
        setEnabledDatasets(await datasetRegistry.getEnabledDatasets());
    };

    // Dataset settings modal handlers
    const [showDatasetSettings, setShowDatasetSettings] = useState(false);

    const handleDatasetToggle = async (id, enabled) => {
        await datasetRegistry.setEnabled(id, enabled);
        setEnabledDatasets(await datasetRegistry.getEnabledDatasets());
    };

    const handlePresetSelect = async (id) => {
        await datasetRegistry.applyPreset(id);
        setEnabledDatasets(await datasetRegistry.getEnabledDatasets());
    };

    return (
        <div className="flex flex-col h-full animate-fade-in lg:flex-row" style={{ background: 'var(--color-bg-primary)' }}>

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-w-0 relative">

                {/* Header */}
                <header className="px-4 py-3 lg:px-6" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--color-border-primary)' }}>
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowHistory(true)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                <Menu className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
                            </button>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>AI Assistant</h1>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1" style={{
                                        color: modelStatus === 'ready' ? 'var(--color-success)' :
                                            modelStatus === 'low-battery' ? 'var(--color-warning)' :
                                                modelStatus === 'no-model' ? 'var(--color-info)' :
                                                    'var(--color-text-muted)'
                                    }}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {modelStatus === 'ready' ? (activeModel ? TRANSFORMERS_MODELS[activeModel]?.name || 'AI Ready' : 'AI Ready') :
                                            modelStatus === 'low-battery' ? `Low Battery (${Math.round(batteryStatus.level)}%) - Connect Charger` :
                                                modelStatus === 'checking' ? 'Initializing...' : 'Smart Search'}
                                    </span>
                                    {batteryStatus.lowBattery && (
                                        <span className="flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                                            <Zap className="w-3 h-3" />
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                        <Database className="w-3 h-3" />
                                        {enabledDatasets.length}/{availableDatasets.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => navigate('/ai-models')} className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"><Cpu className="w-5 h-5" /></button>
                            <button onClick={() => setShowVisualizations(!showVisualizations)} className={`p-2 rounded-lg transition-colors ${showVisualizations ? 'bg-[var(--color-bg-tertiary)] text-primary-400' : 'text-[var(--color-text-muted)]'}`}><Activity className="w-5 h-5" /></button>
                            <button onClick={() => setShowDatasetSettings(true)} className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"><Settings className="w-5 h-5" /></button>
                        </div>
                    </div>
                </header>

                {/* Message Thread */}
                <MessageThread
                    messages={messages}
                    isLoading={isLoading}
                    streamingMessageId={streamingMessageId}
                    onSourcePreview={handleSourcePreview}
                />

                {/* Suggestions */}
                {messages.length <= 1 && (
                    <div className="px-4 pb-2 lg:px-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="max-w-4xl mx-auto">
                            <p className="text-xs mb-2 text-[var(--color-text-muted)]">Try asking:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.slice(0, 3).map((q, i) => (
                                    <button key={i} onClick={() => handleSuggestion(q)} className="text-sm px-3 py-1.5 rounded-full transition-all bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-primary-500 hover:text-primary-400">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile RAG Pipeline Visualizer */}
                {isGenerating && (
                    <div className="lg:hidden px-4 py-2">
                        <RAGPipelineVisualizer
                            isActive={vizActive || isGenerating}
                            currentStage={vizStages.length > 0 ? vizStages[vizStages.length - 1]?.stage : null}
                            stageData={vizStages.reduce((acc, stage) => {
                                acc[stage.stage] = {
                                    ...stage.data,
                                    duration: stage.elapsed
                                };
                                return acc;
                            }, {})}
                            compact={true}
                        />
                    </div>
                )}

                {/* Composer */}
                <Composer onSend={handleSend} disabled={isLoading || isGenerating} />

                {/* Refinery Chip - Trust Builder */}
                <AnimatePresence>
                    {isGenerating && (() => {
                        const refineryStage = vizStages.find(s => s.stage === 'refinery');
                        const retrievalStage = vizStages.find(s => s.stage === 'retrieval' || (s.type === 'tool_start' && s.tool === 'search'));

                        // Case 1: Refining in progress (Retrieval done, but no refinery data yet)
                        if (retrievalStage && !refineryStage?.data) {
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md shadow-lg shadow-blue-900/5 ring-1 ring-black/5"
                                >
                                    <Loader2 size={14} className="text-blue-400 animate-spin" />
                                    <span className="text-xs font-semibold text-blue-200">Scanning Knowledge...</span>
                                </motion.div>
                            );
                        }

                        if (!refineryStage?.data) return null;

                        const { documentsRefined, tokensSaved, totalCharsBefore, totalCharsAfter } = refineryStage.data;
                        if (!tokensSaved || tokensSaved <= 0) return null;

                        const savingsPercent = totalCharsBefore > 0
                            ? Math.round(((totalCharsBefore - totalCharsAfter) / totalCharsBefore) * 100)
                            : 0;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md shadow-lg shadow-amber-900/5 ring-1 ring-black/5"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <Zap size={14} className="text-amber-400 fill-amber-400/20" />
                                </motion.div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-amber-200">Refined {documentsRefined} source{documentsRefined !== 1 ? 's' : ''}</span>
                                    <span className="w-1 h-1 rounded-full bg-amber-500/30" />
                                    <span className="text-xs font-medium text-amber-100/80">Saved {tokensSaved} tokens ({savingsPercent}%)</span>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* History Sidebar Overlay */}
                {showHistory && (
                    <div className="absolute inset-0 z-50 flex">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
                        <div className="relative w-80 h-full animate-slide-right shadow-2xl z-50">
                            <SessionList
                                sessions={sessions}
                                activeSessionId={sessionId}
                                onSelect={handleSelectConversation}
                                onDelete={removeSession}
                                onNew={handleNewChat}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Visualizations (Desktop) */}
            {showVisualizations && (
                <div className="hidden lg:flex flex-col w-96 xl:w-[420px] border-l border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                    <div className="px-4 py-3 bg-[var(--color-bg-glass)] backdrop-blur border-b border-[var(--color-border-primary)]">
                        <h2 className="font-semibold text-sm flex items-center gap-2 mb-3 text-[var(--color-text-primary)]"><Activity className="w-4 h-4" /> AI Data Flow</h2>
                        <div className="flex p-1 rounded-lg bg-black/10 dark:bg-white/5">
                            <button onClick={() => setVizTab('logic')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${vizTab === 'logic' ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white' : 'text-gray-500'}`}>Logic</button>
                            <button onClick={() => setVizTab('network')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${vizTab === 'network' ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white' : 'text-gray-500'}`}>Network</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Dataset Activity Indicator - Always visible when viz panel is open */}
                        <DatasetActivityIndicator
                            datasets={enabledDatasets}
                            isGenerating={isGenerating}
                            stageData={vizStages.reduce((acc, stage) => {
                                acc[stage.stage] = stage.data;
                                return acc;
                            }, {})}
                        />

                        {vizTab === 'logic' ? (
                            <div className="space-y-4">
                                <RAGPipelineVisualizer
                                    isActive={vizActive || isGenerating}
                                    currentStage={vizStages.length > 0 ? vizStages[vizStages.length - 1]?.stage : null}
                                    stageData={vizStages.reduce((acc, stage) => {
                                        acc[stage.stage] = {
                                            ...stage.data,
                                            duration: stage.elapsed
                                        };
                                        return acc;
                                    }, {})}
                                    compact={false}
                                />
                                <AIReadingViz stages={vizStages} isActive={vizActive} onReplay={() => { setVizStages([]); setTimeout(() => setVizStages(vizStages), 50); }} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <DatasetNetworkGraph activeDatasets={enabledDatasets.map(d => d.id)} queryActivity={vizStages.filter(s => s.type === 'tool_start' && s.tool === 'search').map(s => ({ datasetId: s.details?.dataset || 'general', timestamp: Date.now(), hits: 1 }))} size="medium" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals & Sheets */}
            <DatasetSettingsModal
                isOpen={showDatasetSettings}
                onClose={() => setShowDatasetSettings(false)}
                datasets={availableDatasets}
                enabledDatasets={enabledDatasets}
                onToggleDataset={handleDatasetToggle}
                onApplyPreset={handlePresetSelect}
            />

            {previewSource && (
                <SourceViewer
                    source={previewSource}
                    isOpen={!!previewSource}
                    onClose={() => setPreviewSource(null)}
                />
            )}

        </div>
    );
};

export default AIChat;