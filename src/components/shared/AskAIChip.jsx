/**
 * AskAIChip - Contextual AI touchpoint component
 *
 * Displays at the bottom of content pages (ArticleView, Health, Survival, Law)
 * Provides context-aware question suggestions that open AI Chat.
 *
 * Features:
 * - Pre-generates relevant questions based on current content
 * - Non-intrusive, expandable design
 * - Falls back gracefully when AI unavailable
 * - Passes article context to AI Chat for better answers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, ChevronRight, Sparkles, HelpCircle } from 'lucide-react';
import { AIModelManager } from '../services/ai/AIModelManager';
import { createLogger } from '../utils/logger';

const log = createLogger('AskAIChip');

/**
 * Generate context-aware question suggestions based on content
 */
function generateSuggestions(context) {
    const { title, category } = context;

    // Default suggestions by category
    const categorySuggestions = {
        medical: [
            'How do I know if this is serious?',
            'What should I do while waiting for help?',
            'What are the warning signs?'
        ],
        health: [
            'How do I know if this is serious?',
            'What should I do while waiting for help?',
            'What are the warning signs?'
        ],
        survival: [
            'What if I don\'t have the right supplies?',
            'How long can I survive without this?',
            'What are common mistakes to avoid?'
        ],
        legal: [
            'What are my rights in this situation?',
            'What should I say to police?',
            'When can I refuse?'
        ]
    };

    // Get base suggestions for category
    let suggestions = categorySuggestions[category] || [
        'Tell me more about this',
        'What should I do first?',
        'Are there alternatives?'
    ];

    // If we have a title, make first suggestion more specific
    if (title) {
        const shortTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
        suggestions = [
            `How do I ${shortTitle.toLowerCase()}?`,
            ...suggestions.slice(1)
        ];
    }

    return suggestions.slice(0, 3);
}

/**
 * AskAIChip Component
 *
 * @param {Object} props
 * @param {string} props.title - Current article/page title
 * @param {string} props.category - Content category (medical, survival, legal)
 * @param {string} props.content - Article content for context (optional)
 * @param {string} props.articleId - Article ID for context injection
 * @param {string} props.variant - 'compact' | 'expanded' (default: compact)
 */
const AskAIChip = ({
    title = '',
    category = 'general',
    _content = '',
    articleId = null,
    variant = 'compact'
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(variant === 'expanded');
    const [suggestions, setSuggestions] = useState([]);
    const [aiStatus, setAIStatus] = useState('checking'); // checking, ready, search-only

    // Initialize and generate suggestions
    useEffect(() => {
        const init = async () => {
            try {
                // Check if AI model is available
                await AIModelManager.init();
                const isLoaded = AIModelManager.isModelLoaded();
                setAIStatus(isLoaded ? 'ready' : 'search-only');
            } catch (error) {
                log.debug('AI check failed', error);
                setAIStatus('search-only');
            }

            // Generate suggestions based on context
            const newSuggestions = generateSuggestions({ title, category });
            setSuggestions(newSuggestions);
        };

        init();
    }, [title, category]);

    // Handle suggestion click - navigate to AI Chat with context
    const handleSuggestionClick = (question) => {
        // Build context object to pass to AI Chat
        const context = {
            question,
            sourceTitle: title,
            sourceCategory: category,
            sourceId: articleId,
            sourcePath: location.pathname
        };

        // Navigate to AI Chat with context in state
        navigate('/ai', { state: { context } });
    };

    // Handle "Ask anything" click
    const handleAskAnything = () => {
        navigate('/ai', {
            state: {
                context: {
                    sourceTitle: title,
                    sourceCategory: category,
                    sourceId: articleId,
                    sourcePath: location.pathname
                }
            }
        });
    };

    // Compact variant - just a chip
    if (!isExpanded && variant === 'compact') {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border-primary)',
                    color: 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                    e.currentTarget.style.color = 'var(--color-primary-400)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
            >
                <MessageCircle size={16} />
                <span className="text-sm font-medium">Have a question?</span>
                <ChevronRight size={16} />
            </button>
        );
    }

    // Expanded variant - full suggestions
    return (
        <div
            className="rounded-xl p-4 animate-fade-in"
            style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-primary)'
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                        background: aiStatus === 'ready'
                            ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
                            : 'var(--color-bg-tertiary)'
                    }}
                >
                    {aiStatus === 'ready' ? (
                        <Sparkles size={16} style={{ color: 'white' }} />
                    ) : (
                        <HelpCircle size={16} style={{ color: 'var(--color-text-muted)' }} />
                    )}
                </div>
                <div>
                    <h4
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Have a question about this?
                    </h4>
                    <p
                        className="text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {aiStatus === 'ready' ? 'AI assistant ready' : 'Search available'}
                    </p>
                </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-sm px-3 py-1.5 rounded-full transition-all"
                        style={{
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border-primary)',
                            color: 'var(--color-text-secondary)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                            e.currentTarget.style.color = 'var(--color-primary-400)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            {/* Ask anything button */}
            <button
                onClick={handleAskAnything}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
                style={{
                    background: aiStatus === 'ready'
                        ? 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))'
                        : 'var(--color-bg-tertiary)',
                    color: aiStatus === 'ready' ? 'white' : 'var(--color-text-secondary)',
                    border: aiStatus === 'ready' ? 'none' : '1px solid var(--color-border-primary)'
                }}
                onMouseEnter={(e) => {
                    if (aiStatus !== 'ready') {
                        e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (aiStatus !== 'ready') {
                        e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                    }
                }}
            >
                <MessageCircle size={16} />
                <span className="font-medium">Ask anything</span>
            </button>

            {/* Collapse button (only in expanded-from-compact mode) */}
            {variant === 'compact' && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="w-full text-center py-2 text-xs mt-2"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    Collapse
                </button>
            )}
        </div>
    );
};

export default AskAIChip;
