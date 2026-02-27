/**
 * MessageThread.jsx — Scroll-Anchored Message Container
 *
 * Manages the scrollable message list with:
 *   - Scroll anchoring: only auto-scrolls if user is near bottom
 *   - Streaming indicator with AI avatar + pulse loader
 *   - Proper overflow handling
 */

import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { Bot, Loader } from 'lucide-react';
import MessageBubble from './MessageBubble';

// How close (px) user must be to bottom for auto-scroll to engage
const SCROLL_THRESHOLD = 100;

// VERIFIED: [Performance] MESSAGETHREAD_OPTIMIZED - Phase 2.5c 2026-02-13
// Wrapped component with React.memo to prevent unnecessary re-renders from parent state changes.
// This prevents scroll position jumps during streaming AI responses.

const MessageThread = React.memo(({
    messages,
    isLoading,
    streamingMessageId,
    onSourcePreview,
}) => {
    const containerRef = useRef(null);
    const endRef = useRef(null);
    const isNearBottomRef = useRef(true);

    // Track whether user is near the bottom
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = distanceFromBottom < SCROLL_THRESHOLD;
    }, []);

    // Scroll to bottom when messages change, but only if user is near bottom
    useLayoutEffect(() => {
        if (isNearBottomRef.current) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, streamingMessageId]);

    // Force scroll to bottom on initial load and when first message arrives
    useLayoutEffect(() => {
        if (messages.length <= 2) {
            endRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages.length]);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
            style={{
                overscrollBehavior: 'contain',
                overflowAnchor: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-border-secondary) transparent',
            }}
        >
            <div
                className="space-y-4"
                style={{
                    maxWidth: '56rem',
                    margin: '0 auto',
                    padding: 'var(--space-4)',
                }}
            >
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={msg.id || idx}
                        message={msg}
                        onSourcePreview={onSourcePreview}
                        animationDelay={idx < 3 ? idx * 100 : 0}
                        isStreaming={msg.id === streamingMessageId}
                    />
                ))}

                {/* Streaming indicator — shown when AI is generating */}
                {isLoading && (
                    <div
                        className="flex gap-3 animate-fade-in"
                        style={{ animationDelay: '100ms' }}
                    >
                        <div
                            className="msg-bubble__avatar msg-bubble__avatar--ai"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Bot style={{ width: 16, height: 16, color: 'white' }} />
                        </div>
                        <div
                            className="rounded-2xl px-4 py-3"
                            style={{
                                background: 'var(--color-bg-glass, rgba(255,255,255,0.04))',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid var(--color-border-primary)',
                                borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 0',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Loader
                                    style={{
                                        width: 14,
                                        height: 14,
                                        color: 'var(--color-accent-teal, var(--color-primary-400))',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--color-text-muted)',
                                        fontFamily: 'Georgia, "Times New Roman", serif',
                                    }}
                                >
                                    Thinking…
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={endRef} aria-hidden="true" style={{ height: 1 }} />
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if messages, isLoading, or streamingMessageId actually changed
    return (
        prevProps.messages === nextProps.messages &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.streamingMessageId === nextProps.streamingMessageId &&
        prevProps.onSourcePreview === nextProps.onSourcePreview
    );
});

MessageThread.displayName = 'MessageThread';

export default MessageThread;
