import React, { useState, useEffect } from 'react';
import { X, Volume2, RotateCw, CheckCircle2 } from 'lucide-react';

/**
 * Protocol View Component
 *
 * Full-screen emergency protocol checklist optimized for high-stress scenarios
 * Following Gemini's cognitive load principles:
 * - Large text (48pt+ headings)
 * - Binary checkboxes for progress tracking
 * - Voice guidance via Web Speech API
 * - Simple, clear layout
 * - High contrast colors
 */
const ProtocolView = ({ protocol, onClose, onRegenerate }) => {
    const [checkedSteps, setCheckedSteps] = useState([]);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Initialize speech synthesis
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // Preload voices
            window.speechSynthesis.getVoices();
        } else {
            console.warn('Web Speech API not supported');
            setVoiceEnabled(false);
        }
    }, []);

    // Toggle step completion
    const toggleStep = (index) => {
        setCheckedSteps(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Voice guidance for step
    const speakStep = (text, context) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice
        utterance.rate = 0.9; // Slightly slower for clarity under stress
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Optional: Add context after brief pause
        if (context) {
            utterance.onend = () => {
                setTimeout(() => {
                    const contextUtterance = new SpeechSynthesisUtterance(context);
                    contextUtterance.rate = 0.8;
                    contextUtterance.volume = 0.8;
                    window.speechSynthesis.speak(contextUtterance);
                }, 300);
            };
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        // =============================================================================
        // VERIFIED: [P0][Safety] SPEECH_SYNTHESIS_ERROR_HANDLING
        // Implementation: Error callback dispatches custom event to UI layer for
        //   toast notification when voice guidance fails (excluding user cancellation).
        //   Ensures users are notified of voice guidance failures in emergency scenarios.
        // =============================================================================
        utterance.onerror = (e) => {
            setIsSpeaking(false);
            if (e.error !== 'canceled') {
                window.dispatchEvent(new CustomEvent('voice-guidance-error', {
                    detail: { error: e.error, message: 'Voice guidance unavailable' }
                }));
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    // Stop speech
    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    // Speak all steps sequentially
    const speakAllSteps = () => {
        if (!voiceEnabled || !protocol?.steps) return;

        stopSpeaking();

        let currentIndex = 0;

        const speakNext = () => {
            if (currentIndex >= protocol.steps.length) {
                setIsSpeaking(false);
                return;
            }

            const step = protocol.steps[currentIndex];
            const utterance = new SpeechSynthesisUtterance(
                `Step ${currentIndex + 1}. ${step.text}. ${step.context || ''}`
            );

            utterance.rate = 0.9;
            utterance.onend = () => {
                currentIndex++;
                setTimeout(speakNext, 500); // Brief pause between steps
            };
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        };

        setIsSpeaking(true);
        speakNext();
    };

    // Calculate completion percentage
    const completionPercent = protocol?.steps
        ? Math.round((checkedSteps.length / protocol.steps.length) * 100)
        : 0;

    if (!protocol) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-slate-500">Loading protocol...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b-2 border-slate-200 shadow-sm z-10">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                            {protocol.scenarioName || 'EMERGENCY PROTOCOL'}
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-slate-500">
                                {completionPercent}% Complete ({checkedSteps.length}/{protocol.steps?.length || 0})
                            </span>
                            {protocol.usedAI && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    AI Generated
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-8 h-8 text-slate-700" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2 flex-wrap">
                {voiceEnabled && (
                    <button
                        onClick={isSpeaking ? stopSpeaking : speakAllSteps}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isSpeaking
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        <Volume2 className="w-4 h-4" />
                        {isSpeaking ? 'Stop Voice' : 'Read All Steps'}
                    </button>
                )}

                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-lg font-medium hover:border-slate-400 transition-colors"
                    >
                        <RotateCw className="w-4 h-4" />
                        Regenerate
                    </button>
                )}
            </div>

            {/* Steps Checklist */}
            <div className="p-4 md:p-6 space-y-4">
                {protocol.steps?.map((step, index) => {
                    const isChecked = checkedSteps.includes(index);

                    return (
                        <div
                            key={index}
                            className={`flex items-start gap-4 p-4 md:p-6 rounded-xl shadow-lg border-2 transition-all ${
                                isChecked
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Checkbox */}
                            <label className="flex-shrink-0 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleStep(index)}
                                className="sr-only peer"
                                // =============================================================================
                                // VERIFIED: [P0][Accessibility] PROTOCOL_CHECKBOX_ARIA_LABELS
                                // Implementation: Added aria-label with step number and content summary.
                                //   Ensures screen readers can identify checkbox purpose for accessibility.
                                //   Also using sr-only with aria-label pattern for proper assistive tech support.
                                // =============================================================================
                                aria-label={`Step ${index + 1}: ${step.text}`}
                            />
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-3 flex items-center justify-center transition-all ${
                                    isChecked
                                        ? 'bg-green-600 border-green-600'
                                        : 'bg-white border-slate-300 peer-focus:ring-4 peer-focus:ring-blue-300'
                                }`}>
                                    {isChecked && <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                                </div>
                            </label>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                    <span className="text-2xl md:text-3xl font-bold text-slate-900 flex-shrink-0">
                                        {index + 1}.
                                    </span>
                                    <div className="flex-1">
                                        <p className={`text-xl md:text-2xl leading-relaxed ${
                                            isChecked ? 'text-green-900' : 'text-slate-900'
                                        }`}>
                                            {step.text}
                                        </p>
                                        {step.context && (
                                            <p className="text-sm md:text-base text-slate-500 mt-2 italic">
                                                {step.context}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Voice Button */}
                            {voiceEnabled && (
                                <button
                                    onClick={() => speakStep(step.text, step.context)}
                                    className="flex-shrink-0 p-2 md:p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                                    aria-label="Read step aloud"
                                >
                                    <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-blue-700" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {completionPercent === 100 && (
                <div className="mx-4 mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-green-900 mb-2">
                        Protocol Complete
                    </h2>
                    <p className="text-green-700">
                        You've completed all steps. Stay safe and monitor the situation.
                    </p>
                </div>
            )}

            {/* Sources/Metadata Footer */}
            {(protocol.sources?.length > 0 || protocol.generatedAt) && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {protocol.generatedAt && (
                        <p className="mb-2">
                            Generated: {new Date(protocol.generatedAt).toLocaleString('en-GB')}
                        </p>
                    )}
                    {protocol.sources?.length > 0 && (
                        <div>
                            <p className="font-semibold mb-1">Sources:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {protocol.sources.map((source, i) => (
                                    <li key={i} className="truncate">
                                        {source.title || source.id || 'Unknown'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProtocolView;
