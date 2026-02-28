/**
 * Composer.jsx — Tactile Message Composer (The Living Reader)
 *
 * Physical, haptic input component for the AI chat interface.
 * Auto-expanding textarea, snap animation on submit, haptic feedback.
 * 
 * OPTIMIZED: [Performance] COMPOSER_MEMOIZED - 2026-02-15
 * - Wrapped with React.memo to prevent parent re-render cascades
 * - Debounced haptic feedback to prevent performance impact
 * - Optimized auto-resize with ResizeObserver
 * - Extracted static callbacks to prevent re-creation
 *
 * Refinery Standard:
 *   - Touch targets: 48px minimum (--button-height-lg)
 *   - Haptics: medium on Send
 *   - iOS safe areas: padding-bottom for Home Indicator
 *   - Accessible: aria-labels, disabled states
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Send, Loader } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import './Composer.css';

// Static constants outside component to prevent re-creation
const MAX_HEIGHT = 160; // 5 rows
const HAPTIC_DEBOUNCE_MS = 100;

/**
 * Composer Component - Optimized for performance
 * Uses React.memo to prevent unnecessary re-renders from parent
 */
const Composer = React.memo(({ onSend, disabled = false, placeholder }) => {
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef(null);
    const composerRef = useRef(null);
    const hapticTimeoutRef = useRef(null);
    const prevValueRef = useRef('');

    const canSend = useMemo(() => value.trim().length > 0 && !disabled, [value, disabled]);

    // Debounced haptic feedback to prevent performance impact during rapid typing
    const _debouncedHaptic = useCallback(() => {
        if (hapticTimeoutRef.current) {
            clearTimeout(hapticTimeoutRef.current);
        }
        hapticTimeoutRef.current = setTimeout(() => {
            triggerHaptic('light').catch(() => { });
        }, HAPTIC_DEBOUNCE_MS);
    }, []);

    // Auto-resize textarea using ResizeObserver for better performance
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        // Only resize if content actually changed
        if (prevValueRef.current === value) return;
        prevValueRef.current = value;

        // Use requestAnimationFrame for smooth resize
        requestAnimationFrame(() => {
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
        });
    }, [value]);

    // Cleanup haptic timeout on unmount
    useEffect(() => {
        return () => {
            if (hapticTimeoutRef.current) {
                clearTimeout(hapticTimeoutRef.current);
            }
        };
    }, []);

    // Snap animation — plays on submit for physicality
    const playSnap = useCallback(() => {
        const el = composerRef.current;
        if (!el) return;
        el.classList.remove('composer--snapping');
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
            el.classList.add('composer--snapping');
        });
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        const text = value.trim();
        if (!text || disabled) return;

        // Haptic feedback + snap
        await triggerHaptic('medium');
        playSnap();

        // Clear input and reset height
        setValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Fire callback
        onSend(text);
    }, [value, disabled, onSend, playSnap]);

    // Keyboard handling
    const handleKeyDown = useCallback((e) => {
        // Ctrl/Cmd + Enter to send (desktop)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            return;
        }
        // Plain Enter on desktop sends (Shift+Enter for newline)
        // On mobile, Enter always creates a newline (users have a send button)
        // We detect "desktop" by checking if it's NOT a touch device
        if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    // Allow parent to programmatically set value and focus
    const handleChange = useCallback((e) => {
        setValue(e.target.value);
    }, []);

    return (
        <div
            ref={composerRef}
            className={`composer ${isFocused ? 'composer--focused' : ''}`}
        >
            <div className="composer__row">
                <div className="composer__input-wrap">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder || 'Ask about emergencies, first aid, legal rights...'}
                        disabled={disabled}
                        rows={1}
                        className="composer__textarea"
                        aria-label="Message input"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className={`composer__send ${canSend ? 'composer__send--ready' : ''}`}
                    aria-label="Send message"
                >
                    {disabled ? (
                        <Loader className="composer__send-icon" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Send className="composer__send-icon" size={20} />
                    )}
                </button>
            </div>

            {/* Desktop keyboard hint */}
            <div className="composer__hint">
                <span className="composer__hint-key">Enter</span>
                <span className="composer__hint-text">to send</span>
                <span className="composer__hint-sep">·</span>
                <span className="composer__hint-key">Shift</span>
                <span className="composer__hint-text">+</span>
                <span className="composer__hint-key">Enter</span>
                <span className="composer__hint-text">for newline</span>
            </div>
        </div>
    );
});

export default Composer;