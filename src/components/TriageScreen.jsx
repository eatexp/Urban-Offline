import React, { useState, useEffect, useCallback, useRef } from 'react';
import { inkService } from '../services/InkService';
import { ArrowLeft, PlayCircle, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';
import { renderMarkdown } from '../utils/markdownRenderer';

const TriageScreen = ({ storyFile, onClose }) => {
    const [storyState, setStoryState] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [focusedChoice, setFocusedChoice] = useState(0);
    const choiceRefs = useRef([]);

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
        setFocusedChoice(0); // Reset focus to first choice
    };

    const handleRestart = async () => {
        inkService.reset();
        await loadStoryCallback(false);
    };

    // Keyboard navigation for choices
    const handleChoiceKeyDown = (e, choiceIndex) => {
        const choices = storyState?.choices || [];
        const numChoices = choices.length;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                const nextIndex = (choiceIndex + 1) % numChoices;
                setFocusedChoice(nextIndex);
                choiceRefs.current[nextIndex]?.focus();
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                const prevIndex = (choiceIndex - 1 + numChoices) % numChoices;
                setFocusedChoice(prevIndex);
                choiceRefs.current[prevIndex]?.focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                handleChoice(choices[choiceIndex].index);
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            default:
                break;
        }
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
                    {renderMarkdown(storyState.text)}
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
            <div
                className="p-4 bg-slate-50 border-t border-slate-200 space-y-3"
                role="group"
                aria-label="Available choices"
            >
                {storyState.choices.length > 0 ? (
                    storyState.choices.map((choice, idx) => (
                        <button
                            key={choice.index}
                            ref={el => choiceRefs.current[idx] = el}
                            onClick={() => handleChoice(choice.index)}
                            onKeyDown={(e) => handleChoiceKeyDown(e, idx)}
                            className="w-full text-left p-4 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-md transition-all active:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label={`Choice ${idx + 1}: ${choice.text}`}
                            tabIndex={idx === focusedChoice ? 0 : -1}
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
