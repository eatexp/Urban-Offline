import React, { useState, useEffect, useCallback } from 'react';
import { inkService } from '../services/InkService';
import { ArrowLeft, PlayCircle, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';

const TriageScreen = ({ storyFile, onClose }) => {
    const [storyState, setStoryState] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    const loadStoryCallback = useCallback(async (resume = true) => {
        setError(null);
        setLoading(true);
        setShowResumePrompt(false);

        try {
            const success = await inkService.loadStory(storyFile, { resumeFromSaved: resume });
            if (!success) {
                setError("Failed to load triage guide. The file may be missing.");
                setLoading(false);
                return;
            }
            const initial = inkService.continue();
            setStoryState(initial);
        } catch (e) {
            console.error('Story load error:', e);
            setError("Failed to load triage guide.");
        } finally {
            setLoading(false);
        }
    }, [storyFile]);

    // Check for saved progress on mount
    useEffect(() => {
        const checkSavedProgress = async () => {
            const hasSaved = await inkService.hasSavedProgress(storyFile);
            if (hasSaved) {
                setShowResumePrompt(true);
                setLoading(false);
            } else {
                // No saved progress, load fresh
                await loadStoryCallback(false);
            }
        };
        checkSavedProgress();
    }, [storyFile, loadStoryCallback]);

    const handleChoice = (index) => {
        const next = inkService.choose(index);
        setStoryState(next);
    };

    const handleRestart = async () => {
        inkService.reset();
        await loadStoryCallback(false);
    };

    // Resume prompt screen
    if (showResumePrompt) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-900 text-white p-4 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="hover:bg-slate-700 p-1 rounded"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide">Interactive Triage</span>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-2">Continue where you left off?</h3>
                        <p className="text-sm text-blue-700">
                            You have saved progress in this guide. Would you like to resume or start fresh?
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => loadStoryCallback(true)}
                            className="w-full p-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <PlayCircle size={20} />
                            Resume Progress
                        </button>

                        <button
                            onClick={() => loadStoryCallback(false)}
                            className="w-full p-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={20} />
                            Start Fresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-4 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="hover:bg-slate-700 p-1 rounded"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide">Interactive Triage</span>
                </div>
                <div className="p-6">
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                        <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-bold">Error</p>
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={() => loadStoryCallback(false)}
                                className="mt-3 text-sm font-medium text-red-800 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading || !storyState) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[60vh]">
                <div className="bg-slate-900 text-white p-4 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="hover:bg-slate-700 p-1 rounded"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide">Interactive Triage</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-slate-400">Loading guide...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[60vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="hover:bg-slate-700 p-1 rounded"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide">Interactive Triage</span>
                </div>
                <button
                    onClick={handleRestart}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
                    aria-label="Restart guide"
                    title="Restart guide"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose prose-slate max-w-none">
                    {storyState.text.split('\n').map((line, i) => {
                        if (!line.trim()) return null;
                        // Simple Markdown Parser for **bold**
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                            <p key={i} className="text-lg leading-relaxed text-slate-800 font-medium">
                                {parts.map((part, index) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
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
                            <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-mono uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Choices */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                {storyState.choices.length > 0 ? (
                    storyState.choices.map((choice) => (
                        <button
                            key={choice.index}
                            onClick={() => handleChoice(choice.index)}
                            className="w-full text-left p-4 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-md transition-all active:bg-blue-50"
                        >
                            <span className="font-semibold text-slate-700">{choice.text}</span>
                        </button>
                    ))
                ) : (
                    <div className="text-center p-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-green-800 font-medium">Guide Complete</p>
                            <p className="text-sm text-green-600">You've completed this assessment.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
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
