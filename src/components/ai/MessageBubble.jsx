import React from 'react';
import {
    User, Bot, AlertCircle,
    ChevronRight, BookOpen, Database,
    Heart, Tent, Scale
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatContent } from './formatContent';

const MessageBubble = React.memo(({ message, onSourceClick, animationDelay = 0 }) => {
    const isUser = message.role === 'user';

    const sanitizedContent = React.useMemo(() => {
        if (!message.content) return '';
        return DOMPurify.sanitize(message.content);
    }, [message.content]);

    return (
        <div
            className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Avatar */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    background: isUser
                        ? 'var(--color-bg-tertiary)'
                        : 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
                }}
            >
                {isUser
                    ? <User className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    : <Bot className="w-4 h-4" style={{ color: 'white' }} />
                }
            </div>

            {/* Message */}
            <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div
                    className="rounded-2xl px-4 py-3"
                    style={{
                        background: isUser
                            ? 'var(--color-primary-600)'
                            : 'var(--color-bg-secondary)',
                        border: isUser ? 'none' : '1px solid var(--color-border-primary)',
                        borderRadius: isUser ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                        ...(message.error && {
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        })
                    }}
                >
                    <div
                        className="text-sm whitespace-pre-wrap"
                        style={{
                            color: isUser ? 'white' : 'var(--color-text-secondary)',
                            ...(message.error && { color: 'var(--color-danger)' })
                        }}
                    >
                        {formatContent(sanitizedContent, isUser)}
                    </div>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <div
                            className="flex items-center gap-2 px-2 py-1 rounded-full w-fit text-xs"
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                color: 'var(--color-success)'
                            }}
                        >
                            <Database className="w-3 h-3" />
                            <span>Data from your library • {message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
                        </div>

                        <div className="space-y-1.5">
                            {message.sources.map((source, i) => {
                                const getCategoryIcon = () => {
                                    const cat = (source.category || '').toLowerCase();
                                    if (cat.includes('health') || cat.includes('medical')) {
                                        return <Heart className="w-3 h-3" style={{ color: '#ef4444' }} />;
                                    }
                                    if (cat.includes('survival') || cat.includes('emergency')) {
                                        return <Tent className="w-3 h-3" style={{ color: '#f97316' }} />;
                                    }
                                    if (cat.includes('law') || cat.includes('legal')) {
                                        return <Scale className="w-3 h-3" style={{ color: '#8b5cf6' }} />;
                                    }
                                    return <BookOpen className="w-3 h-3" style={{ color: 'var(--color-primary-400)' }} />;
                                };

                                return (
                                    <button
                                        key={i}
                                        onClick={() => onSourceClick(source)}
                                        className="source-button flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-all w-full"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid var(--color-border-primary)'
                                        }}
                                    >
                                        {getCategoryIcon()}
                                        <span
                                            className="flex-1 text-left truncate"
                                            style={{ color: 'var(--color-text-secondary)' }}
                                        >
                                            {source.title}
                                        </span>
                                        <ChevronRight className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Fallback indicator */}
                {message.usedFallback && !isUser && (
                    <p
                        className="text-xs mt-1 flex items-center gap-1"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <AlertCircle className="w-3 h-3" />
                        Answered from cached templates
                    </p>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.role === nextProps.message.role &&
        prevProps.animationDelay === nextProps.animationDelay
    );
});

export default MessageBubble;
