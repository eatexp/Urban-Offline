import React, { useState, useEffect, useCallback } from 'react';
import { inkService } from '../services/InkService';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { createLogger } from '../utils/logger';

const log = createLogger('TriageScreen');

const TriageScreen = ({ storyFile, onClose }) => {
    const [storyState, setStoryState] = useState(null);
    const [error, setError] = useState(null);
    const [shouldLoad, setShouldLoad] = useState(true);

    // Separate effect for loading story - triggered by shouldLoad flag
    useEffect(() => {
        if (!shouldLoad) return;

        let isMounted = true;

        const doLoad = async () => {
            try {
                await inkService.loadStory(storyFile);
                if (isMounted) {
                    const initial = inkService.continue();
                    setStoryState(initial);
                    setError(null);
                }
            } catch (_e) {
                log.error('Failed to load story', _e);
                if (isMounted) {
                    setError("Failed to load triage guide.");
                }
            }
            if (isMounted) {
                setShouldLoad(false);
            }
        };

        doLoad();

        return () => {
            isMounted = false;
        };
    }, [shouldLoad, storyFile]);

    // Function to trigger reload
    const handleReload = useCallback(() => {
        setStoryState(null);
        setError(null);
        setShouldLoad(true);
    }, []);

    const handleChoice = (index) => {
        const next = inkService.choose(index);
        setStoryState(next);
    };

    if (error) {
        return (
            <div
                className="card card-emergency p-4 flex items-center gap-3 animate-fade-in"
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                >
                    <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-danger)' }}>Error</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!storyState) {
        return (
            <div
                className="p-8 text-center animate-fade-in"
                style={{ color: 'var(--color-text-muted)' }}
            >
                <div
                    className="animate-spin w-8 h-8 rounded-full mx-auto mb-4"
                    style={{
                        borderWidth: '3px',
                        borderColor: 'var(--color-border-primary)',
                        borderTopColor: 'var(--color-primary-500)'
                    }}
                ></div>
                Loading triage flow...
            </div>
        );
    }

    return (
        <div
            className="card rounded-xl overflow-hidden flex flex-col h-[60vh] animate-scale-in"
            style={{
                background: 'var(--color-bg-secondary)',
                viewTransitionName: 'search-bar' // Morph from Search bar
            }}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between"
                style={{
                    background: 'var(--color-bg-glass)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--color-border-primary)'
                }}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                        Interactive Triage
                    </span>
                </div>
                <button
                    onClick={handleReload}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose prose-invert max-w-none">
                    {storyState.text.split('\n').map((line, i) => {
                        // Simple Markdown Parser for **bold**
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                            <p
                                key={i}
                                className="text-lg leading-relaxed font-medium"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {parts.map((part, index) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                            <strong
                                                key={index}
                                                className="font-bold"
                                                style={{ color: 'var(--color-text-primary)' }}
                                            >
                                                {part.slice(2, -2)}
                                            </strong>
                                        );
                                    }
                                    return part;
                                })}
                            </p>
                        );
                    })}
                </div>

                {/* Tags */}
                {storyState.tags && storyState.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {storyState.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-xs rounded-full font-mono uppercase"
                                style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--color-info)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Choices */}
            <div
                className="p-4 space-y-3"
                style={{
                    background: 'var(--color-bg-tertiary)',
                    borderTop: '1px solid var(--color-border-primary)'
                }}
            >
                {storyState.choices.length > 0 ? (
                    storyState.choices.map((choice, index) => (
                        <button
                            key={choice.index}
                            onClick={() => handleChoice(choice.index)}
                            className="w-full text-left p-4 rounded-lg transition-all animate-scale-in"
                            style={{
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border-primary)',
                                color: 'var(--color-text-primary)',
                                animationDelay: `${index * 50}ms`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                                e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary-500), var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span className="font-semibold">{choice.text}</span>
                        </button>
                    ))
                ) : (
                    <div className="text-center p-4 animate-fade-in">
                        <div
                            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                        >
                            <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
                        </div>
                        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                            End of Guide
                        </p>
                        <button
                            onClick={onClose}
                            className="btn btn-primary btn-md"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TriageScreen;
