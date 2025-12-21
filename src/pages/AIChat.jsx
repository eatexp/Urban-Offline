import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Send, Bot, User, AlertCircle, Loader2, 
    ChevronRight, BookOpen, Sparkles, X,
    Wifi, WifiOff, Download, Settings
} from 'lucide-react';
import { RAGPipeline } from '../services/ai/RAGPipeline';
import { AIModelManager } from '../services/ai/AIModelManager';
import { AI_MODELS, checkAICapability } from '../services/ai/AIArchitecture';
import { createLogger } from '../utils/logger';

const log = createLogger('AIChat');

const AIChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    
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
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [aiCapabilities, setAiCapabilities] = useState(null);
    const [modelStatus, setModelStatus] = useState('checking');
    const [showSettings, setShowSettings] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);

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

                // Get available models
                const models = await AIModelManager.getAvailableModels();
                setAvailableModels(models);

                // Check if any model is installed
                const installedModels = models.filter(m => m.isInstalled);
                
                if (installedModels.length > 0) {
                    setModelStatus('ready');
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
            setModelStatus(installedModels.length > 0 ? 'ready' : 'no-model');
        } catch (_error) {
            setModelStatus('fallback');
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const query = inputValue.trim();
        if (!query || isLoading) return;

        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Get response from RAG pipeline
            const result = await RAGPipeline.query(query, {
                category: 'general',
                useAI: modelStatus === 'ready'
            });

            // Add assistant message
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                sources: result.sources,
                usedFallback: result.usedFallback,
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
        }

        setIsLoading(false);
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
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">AI Assistant</h1>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1 ${
                                    modelStatus === 'ready' ? 'text-green-600' : 
                                    modelStatus === 'no-model' ? 'text-amber-600' : 
                                    'text-slate-500'
                                }`}>
                                    {modelStatus === 'ready' && '● AI Ready'}
                                    {modelStatus === 'no-model' && '○ Search Mode'}
                                    {modelStatus === 'checking' && 'Checking...'}
                                    {modelStatus === 'fallback' && '○ Fallback Mode'}
                                </span>
                                <span className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <Settings className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map(message => (
                    <MessageBubble 
                        key={message.id}
                        message={message}
                        onSourceClick={navigateToSource}
                    />
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2">
                    <p className="text-xs text-slate-500 mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 3).map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestion(q)}
                                className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 pb-safe">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about emergencies, first aid, legal rights..."
                        className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal 
                    models={availableModels}
                    capabilities={aiCapabilities}
                    modelStatus={modelStatus}
                    onClose={() => setShowSettings(false)}
                    onModelDownload={async (modelId) => {
                        await AIModelManager.downloadModel(modelId, (progress, message) => {
                            log.debug(`Model download: ${progress}% - ${message}`);
                        });
                        refreshAIModels();
                    }}
                />
            )}
        </div>
    );
};

// Message Bubble Component
const MessageBubble = ({ message, onSourceClick }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isUser 
                    ? 'bg-slate-700'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
                {isUser 
                    ? <User className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-white" />
                }
            </div>

            {/* Message */}
            <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                    isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white shadow-sm border border-slate-200 rounded-tl-none'
                } ${message.error ? 'bg-red-50 border-red-200' : ''}`}>
                    {/* Content with markdown-like formatting */}
                    <div className={`text-sm whitespace-pre-wrap ${isUser ? '' : 'text-slate-700'}`}>
                        {formatContent(message.content)}
                    </div>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500">Sources:</p>
                        {message.sources.map((source, i) => (
                            <button
                                key={i}
                                onClick={() => onSourceClick(source)}
                                className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                            >
                                <BookOpen className="w-3 h-3" />
                                {source.title}
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Fallback indicator */}
                {message.usedFallback && !isUser && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Answered from cached templates
                    </p>
                )}
            </div>
        </div>
    );
};

// Simple markdown-like formatting
function formatContent(content) {
    if (!content) return null;

    // Split by lines and process
    const lines = content.split('\n');
    
    return lines.map((line, i) => {
        // Bold text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
            }
            parts.push(<strong key={`bold-${i}-${match.index}`}>{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
        }
        
        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }

        // Handle bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
                <div key={i} className="flex gap-2 ml-2">
                    <span>•</span>
                    <span>{parts.length > 0 ? parts : line.substring(2)}</span>
                </div>
            );
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
            return (
                <div key={i} className="flex gap-2 ml-2">
                    <span className="font-medium">{line.match(/^\d+\./)[0]}</span>
                    <span>{line.replace(/^\d+\.\s/, '')}</span>
                </div>
            );
        }

        return (
            <React.Fragment key={i}>
                {parts.length > 0 ? parts : line}
                {i < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
}

// Settings Modal
const SettingsModal = ({ models, capabilities, modelStatus, onClose, onModelDownload }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-lg">AI Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {/* Device Capabilities */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase mb-2">Device Capabilities</h3>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>WebGPU</span>
                                <span className={capabilities?.webGPU ? 'text-green-600' : 'text-slate-400'}>
                                    {capabilities?.webGPU ? '✓ Supported' : '✗ Not available'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>WASM SIMD</span>
                                <span className={capabilities?.wasmSIMD ? 'text-green-600' : 'text-slate-400'}>
                                    {capabilities?.wasmSIMD ? '✓ Supported' : '✗ Not available'}
                                </span>
                            </div>
                            {capabilities?.recommendedModel && (
                                <div className="pt-2 border-t border-slate-200">
                                    <span className="text-slate-600">Recommended: </span>
                                    <span className="font-medium">{capabilities.recommendedModel.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Models */}
                    <div>
                        <h3 className="font-semibold text-sm text-slate-500 uppercase mb-2">AI Models</h3>
                        <div className="space-y-3">
                            {models.map(model => (
                                <div 
                                    key={model.id}
                                    className="bg-white border border-slate-200 rounded-lg p-3"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium flex items-center gap-2">
                                                {model.name}
                                                {model.recommended && (
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                                        Recommended
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-sm text-slate-500">{model.description}</p>
                                        </div>
                                        <span className="text-xs text-slate-400">{model.sizeDisplay}</span>
                                    </div>

                                    {model.isInstalled ? (
                                        <div className="flex items-center gap-2 text-green-600 text-sm">
                                            <span>✓ Installed</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onModelDownload(model.id)}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Model
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Current Status */}
                    <div className="mt-6 p-3 bg-slate-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                                modelStatus === 'ready' ? 'bg-green-500' :
                                modelStatus === 'no-model' ? 'bg-amber-500' :
                                'bg-slate-400'
                            }`} />
                            <span>
                                {modelStatus === 'ready' && 'AI model loaded and ready'}
                                {modelStatus === 'no-model' && 'No model installed - using search mode'}
                                {modelStatus === 'checking' && 'Checking AI capabilities...'}
                                {modelStatus === 'fallback' && 'Running in fallback mode'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChat;

