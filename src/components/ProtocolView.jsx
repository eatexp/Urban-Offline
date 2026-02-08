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

        utterance.onstart = () => setIsSpeaking(true);

        // Use addEventListener to avoid overwriting handlers
        utterance.addEventListener('end', () => {
            // If there's context, speak it after a brief pause
            if (context) {
                setTimeout(() => {
                    const contextUtterance = new SpeechSynthesisUtterance(context);
                    contextUtterance.rate = 0.8;
                    contextUtterance.volume = 0.8;
                    contextUtterance.addEventListener('end', () => setIsSpeaking(false));
                    contextUtterance.addEventListener('error', () => setIsSpeaking(false));
                    window.speechSynthesis.speak(contextUtterance);
                }, 300);
            } else {
                setIsSpeaking(false);
            }
        });

        // VERIFIED: [P0][Safety] SPEECH_SYNTHESIS_ERROR_HANDLING
        utterance.addEventListener('error', (e) => {
            setIsSpeaking(false);
            if (e.error !== 'canceled') {
                window.dispatchEvent(new CustomEvent('voice-guidance-error', {
                    detail: { error: e.error, message: 'Voice guidance unavailable' }
                }));
            }
        });

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
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: 'var(--color-bg-primary)' }}
            >
                <div className="text-center">
                    <p className="text-xl" style={{ color: 'var(--color-text-muted)' }}>
                        Loading protocol...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 overflow-auto"
            style={{ background: 'var(--color-bg-primary)' }}
        >
            {/* Header */}
            <div
                className="sticky top-0 z-10 shadow-sm"
                style={{
                    background: 'var(--color-bg-secondary)',
                    borderBottom: '2px solid var(--color-border-primary)'
                }}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <h1
                            className="text-3xl md:text-4xl font-bold leading-tight"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {protocol.scenarioName || 'EMERGENCY PROTOCOL'}
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {completionPercent}% Complete ({checkedSteps.length}/{protocol.steps?.length || 0})
                            </span>
                            {protocol.usedAI && (
                                <span
                                    className="text-xs px-2 py-1 rounded-full"
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        color: 'var(--color-info)'
                                    }}
                                >
                                    AI Generated
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label="Close protocol"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-2" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${completionPercent}%`,
                            background: 'var(--color-success)'
                        }}
                    />
                </div>
            </div>

            {/* Action Bar */}
            <div
                className="p-3 flex gap-2 flex-wrap"
                style={{
                    background: 'var(--color-bg-tertiary)',
                    borderBottom: '1px solid var(--color-border-primary)'
                }}
            >
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
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: '2px solid var(--color-border-primary)',
                            color: 'var(--color-text-primary)'
                        }}
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
                            className="flex items-start gap-4 p-4 md:p-6 rounded-xl shadow-lg border-2 transition-all"
                            style={{
                                background: isChecked
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : 'var(--color-bg-secondary)',
                                borderColor: isChecked
                                    ? 'var(--color-success)'
                                    : 'var(--color-border-primary)'
                            }}
                        >
                            {/* Checkbox */}
                            <label className="flex-shrink-0 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleStep(index)}
                                className="sr-only peer"
                                aria-label={`Step ${index + 1}: ${step.text}`}
                            />
                                <div
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg border-3 flex items-center justify-center transition-all peer-focus:ring-4"
                                    style={{
                                        background: isChecked ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
                                        borderColor: isChecked ? 'var(--color-success)' : 'var(--color-border-primary)',
                                        '--tw-ring-color': 'rgba(59, 130, 246, 0.4)'
                                    }}
                                >
                                    {isChecked && <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                                </div>
                            </label>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                    <span
                                        className="text-2xl md:text-3xl font-bold flex-shrink-0"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {index + 1}.
                                    </span>
                                    <div className="flex-1">
                                        <p
                                            className="text-xl md:text-2xl leading-relaxed"
                                            style={{
                                                color: isChecked
                                                    ? 'var(--color-success)'
                                                    : 'var(--color-text-primary)'
                                            }}
                                        >
                                            {step.text}
                                        </p>
                                        {step.context && (
                                            <p
                                                className="text-sm md:text-base mt-2 italic"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
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
                                    className="flex-shrink-0 p-2 md:p-3 rounded-lg transition-colors"
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: 'var(--color-info)'
                                    }}
                                    aria-label="Read step aloud"
                                >
                                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {completionPercent === 100 && (
                <div
                    className="mx-4 mb-6 p-6 border-2 rounded-xl text-center"
                    style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'var(--color-success)'
                    }}
                >
                    <CheckCircle2
                        className="w-16 h-16 mx-auto mb-3"
                        style={{ color: 'var(--color-success)' }}
                    />
                    <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'var(--color-success)' }}
                    >
                        Protocol Complete
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        You've completed all steps. Stay safe and monitor the situation.
                    </p>
                </div>
            )}

            {/* Sources/Metadata Footer */}
            {(protocol.sources?.length > 0 || protocol.generatedAt) && (
                <div
                    className="p-4 text-sm"
                    style={{
                        borderTop: '1px solid var(--color-border-primary)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-muted)'
                    }}
                >
                    {protocol.generatedAt && (
                        <p className="mb-2">
                            Generated: {new Date(protocol.generatedAt).toLocaleString('en-GB')}
                        </p>
                    )}
                    {protocol.sources?.length > 0 && (
                        <div>
                            <p className="font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Sources:
                            </p>
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
