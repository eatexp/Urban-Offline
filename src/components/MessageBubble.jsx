/**
 * MessageBubble.jsx — Living Message Bubble (Refinery Standard)
 *
 * Upgraded to use react-markdown for full GFM support (tables, lists).
 * Maintains "Living Reader" aesthetic:
 *   - Serif font (Georgia) for AI responses
 *   - Glassmorphism card with streaming pulse
 *   - Interactive CitationChips
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, AlertCircle, Database } from 'lucide-react';
import DOMPurify from 'dompurify';
import CitationChip from './CitationChip';
import MiniMapCard from './chat/MiniMapCard';
import MiniMapCardBoundary from './chat/MiniMapCardBoundary';
import './MessageBubble.css';

// ═════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE COMPONENT
// ═════════════════════════════════════════════════════════════════

const MessageBubble = React.memo(({
    message,
    onSourcePreview,
    animationDelay = 0,
    isStreaming = false,
}) => {
    const isUser = message.role === 'user';
    const hasError = !!message.error;

    // Sanitize content (still good practice even with react-markdown)
    // We sanitize BEFORE markdown parsing to prevent XSS in raw HTML if we allowed it,
    // though react-markdown escapes HTML by default.
    const sanitizedContent = useMemo(() => {
        if (!message.content) return '';

        let content = message.content;

        // Transform [1] -> [[1]](#source-1) for interactive handling
        // We do this before markdown parsing so it becomes a link
        content = content.replace(/\[(\d+)\]/g, '[$&](#source-$1)');

        return content;
    }, [message.content]);

    // Compute CSS classes
    const bubbleClass = [
        'msg-bubble',
        isUser ? 'msg-bubble--user' : 'msg-bubble--ai',
        hasError && 'msg-bubble--error',
        isStreaming && 'msg-bubble--streaming',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={bubbleClass}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Avatar */}
            <div className={`msg-bubble__avatar ${isUser ? 'msg-bubble__avatar--user' : 'msg-bubble__avatar--ai'}`}>
                {isUser
                    ? <User style={{ width: 16, height: 16 }} />
                    : <Bot style={{ width: 16, height: 16 }} />
                }
            </div>

            {/* Body */}
            <div className="msg-bubble__body">
                <div className="msg-bubble__card">
                    <div className="msg-bubble__content">
                        {/* Map Tag Parser & Markdown Renderer */}
                        {/* Supports both simple and enriched formats:
                            Simple:   <<MAP: London>>
                            Enriched: <<MAP: St Thomas' Hospital | poi:true | coords:-0.1175,51.4985 | zoom:16>>
                        */}
                        {(() => {
                            // Regex to find <<MAP: ...>> tags
                            const parts = sanitizedContent.split(/(<<MAP:\s*[^>]+>>)/g);

                            return parts.map((part, index) => {
                                // Enhanced parser: supports both simple and enriched formats
                                const mapMatch = part.match(/<<MAP:\s*([^|>]+?)(?:\s*\|\s*(.+?))?>>/)

;

                                if (mapMatch) {
                                    const query = mapMatch[1].trim();
                                    const params = {};

                                    // Parse optional enriched params
                                    if (mapMatch[2]) {
                                        const enrichedParts = mapMatch[2].split('|').map(p => p.trim());
                                        enrichedParts.forEach(p => {
                                            if (p.startsWith('poi:')) {
                                                params.isPOI = p.split(':')[1] === 'true';
                                            }
                                            if (p.startsWith('coords:')) {
                                                const coordStr = p.split(':')[1];
                                                const [lon, lat] = coordStr.split(',').map(Number);
                                                if (!isNaN(lon) && !isNaN(lat)) {
                                                    params.coords = [lon, lat];
                                                }
                                            }
                                            if (p.startsWith('zoom:')) {
                                                const zoomVal = parseInt(p.split(':')[1]);
                                                if (!isNaN(zoomVal)) {
                                                    params.zoom = zoomVal;
                                                }
                                            }
                                        });
                                    }

                                    return (
                                        <div key={`map-${index}`} className="my-2">
                                            <MiniMapCardBoundary query={query}>
                                                <MiniMapCard 
                                                    query={query}
                                                    coords={params.coords}
                                                    zoom={params.zoom}
                                                    isPOI={params.isPOI}
                                                />
                                            </MiniMapCardBoundary>
                                        </div>
                                    );
                                }

                                // Otherwise render standard Markdown
                                if (!part.trim()) return null;

                                return (
                                    <ReactMarkdown
                                        key={`md-${index}`}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Override default elements to match our styling
                                            p: ({ node: _node, ...props }) => <p {...props} />,
                                            h1: ({ node: _node, ...props }) => <h2 className="msg-bubble__heading msg-bubble__heading--1" {...props} />,
                                            h2: ({ node: _node, ...props }) => <h2 className="msg-bubble__heading msg-bubble__heading--1" {...props} />,
                                            h3: ({ node: _node, ...props }) => <h3 className="msg-bubble__heading msg-bubble__heading--2" {...props} />,
                                            h4: ({ node: _node, ...props }) => <h4 className="msg-bubble__heading msg-bubble__heading--3" {...props} />,
                                            ul: ({ node: _node, ...props }) => <ul className="msg-bubble__list" {...props} />,
                                            ol: ({ node: _node, ...props }) => <ol className="msg-bubble__list" {...props} />,
                                            li: ({ node: _node, ...props }) => <li className="msg-bubble__list-item" {...props} />,
                                            blockquote: ({ node: _node, ...props }) => <blockquote className="msg-bubble__blockquote" {...props} />,
                                            code: ({ node: _node, inline, className: _className, children, ...props }) => {
                                                return inline ? (
                                                    <code className="msg-bubble__inline-code" {...props}>{children}</code>
                                                ) : (
                                                    <pre className="msg-bubble__code-block"><code {...props}>{children}</code></pre>
                                                );
                                            },
                                            table: ({ node: _node, ...props }) => (
                                                <div className="msg-bubble__table-wrapper">
                                                    <table className="msg-bubble__table" {...props} />
                                                </div>
                                            ),
                                            th: ({ node: _node, ...props }) => <th className="msg-bubble__th" {...props} />,
                                            td: ({ node: _node, ...props }) => <td className="msg-bubble__td" {...props} />,
                                            a: ({ node: _node, href, children, ..._props }) => {
                                                // Intercept source links
                                                if (href && href.startsWith('#source-')) {
                                                    const index = parseInt(href.replace('#source-', ''), 10) - 1;
                                                    const source = message.sources?.[index];

                                                    if (source) {
                                                        return (
                                                            <button
                                                                className="citation-inline"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    onSourcePreview(source);
                                                                }}
                                                                title={source.title}
                                                            >
                                                                {children}
                                                            </button>
                                                        );
                                                    }
                                                }
                                                return <span className="msg-bubble__link">{children}</span>;
                                            },
                                        }}
                                    >
                                        {part}
                                    </ReactMarkdown>
                                );
                            });
                        })()}
                        {isStreaming && <span className="msg-bubble__cursor" aria-hidden="true" />}
                    </div>
                </div>

                {/* Citation Chips */}
                {message.sources && message.sources.length > 0 && (
                    <div className="msg-bubble__citations">
                        <div className="msg-bubble__source-badge">
                            <Database style={{ width: 12, height: 12 }} />
                            <span>Data from your library • {message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="msg-bubble__chips">
                            {message.sources.map((source, idx) => (
                                <CitationChip
                                    key={source.id || idx}
                                    source={source}
                                    onPreview={onSourcePreview}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback indicator */}
                {message.usedFallback && !isUser && (
                    <p className="msg-bubble__fallback">
                        <AlertCircle style={{ width: 12, height: 12 }} />
                        Answered from cached templates
                    </p>
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.message.id === next.message.id &&
        prev.message.content === next.message.content &&
        prev.message.role === next.message.role &&
        prev.isStreaming === next.isStreaming &&
        prev.animationDelay === next.animationDelay
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
