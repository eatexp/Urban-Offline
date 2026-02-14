/**
 * Composer.jsx — Tactile Message Composer (The Living Reader)
 *
 * Physical, haptic input component for the AI chat interface.
 * Auto-expanding textarea, snap animation on submit, haptic feedback.
 *
 * Refinery Standard:
 *   - Touch targets: 48px minimum (--button-height-lg)
 *   - Haptics: medium on Send
 *   - iOS safe areas: padding-bottom for Home Indicator
 *   - Accessible: aria-labels, disabled states
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import './Composer.css';

const Composer = ({ onSend, disabled = false, placeholder }) => {
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef(null);
    const composerRef = useRef(null);

    const canSend = value.trim().length > 0 && !disabled;

    // TODO: [Performance] COMPOSER_NO_MEMO - LOW 2026-02-12
    // Composer component re-renders on every keystroke which triggers auto-resize and haptics.
// Action: Consider memoizing with React.memo and deferring haptics to useEffect.

    // Auto-resize textarea to content
    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        // Reset to auto to get the real scrollHeight
        el.style.height = 'auto';
        // Clamp to max-height (160px ≈ 5 rows)
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, []);

    // Auto-resize on value change
    useEffect(() => {
        autoResize();
    }, [value, autoResize]);

    // Snap animation — plays on submit for physicality
    const playSnap = useCallback(() => {
        const el = composerRef.current;
        if (!el) return;
        el.classList.remove('composer--snapping');
        void el.offsetWidth; // Force reflow
        el.classList.add('composer--snapping');
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
};

export default Composer;
