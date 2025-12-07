import React, { useState, useEffect } from 'react';
import { inkService } from '../services/InkService';
import { ArrowLeft, PlayCircle, RefreshCw, AlertCircle } from 'lucide-react';

const TriageScreen = ({ storyFile, onClose }) => {
    const [storyState, setStoryState] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStory();
    }, [storyFile]);

    const loadStory = async () => {
        setError(null);
        try {
            await inkService.loadStory(storyFile);
            const initial = inkService.continue();
            setStoryState(initial);
        } catch (e) {
            console.error(e);
            setError("Failed to load triage guide.");
        }
    };

    const handleChoice = (index) => {
        const next = inkService.choose(index);
        setStoryState(next);
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle />
                <div>
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!storyState) return <div className="p-8 text-center text-slate-400">Loading flow...</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[60vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold tracking-wide">Interactive Triage</span>
                </div>
                <button onClick={loadStory} className="text-slate-400 hover:text-white">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose prose-slate max-w-none">
                    {storyState.text.split('\n').map((line, i) => {
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

                {/* Tags Debug (Optional) */}
                {storyState.tags && storyState.tags.length > 0 && (
                    <div className="flex gap-2">
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
                        <p className="text-slate-500 mb-4">End of Guide</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium">
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TriageScreen;
