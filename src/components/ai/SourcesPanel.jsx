import React from 'react';
import { ChevronRight, BookOpen } from 'lucide-react';

const SourcesPanel = ({ messages, onSourceClick }) => {
    const allSources = messages
        .filter(m => m.role === 'assistant' && m.sources && m.sources.length > 0)
        .flatMap(m => m.sources)
        .filter((source, index, self) =>
            index === self.findIndex(s => s.id === source.id)
        )
        .slice(0, 5);

    const hasConversationStarted = messages.length > 1;

    return (
        <div
            className="hidden lg:flex flex-col w-80 xl:w-96 border-l"
            style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-primary)'
            }}
        >
            <div
                className="px-4 py-3"
                style={{
                    background: 'var(--color-bg-glass)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--color-border-primary)'
                }}
            >
                <h2
                    className="font-semibold text-sm flex items-center gap-2"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    <BookOpen className="w-4 h-4" />
                    Sources
                </h2>
                <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {allSources.length} reference{allSources.length !== 1 ? 's' : ''} from this conversation
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {allSources.length > 0 ? (
                    allSources.map((source, index) => (
                        <button
                            key={source.id}
                            onClick={() => onSourceClick(source)}
                            className="source-button w-full text-left p-3 rounded-xl transition-all group"
                            style={{
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-border-primary)'
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                                    style={{
                                        background: 'var(--color-primary-600)',
                                        color: 'white'
                                    }}
                                >
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h4
                                        className="text-sm font-medium truncate"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {source.title}
                                    </h4>
                                    {source.category && (
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            {source.category}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight
                                    className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--color-primary-400)' }}
                                />
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {hasConversationStarted ? 'No sources yet' : 'Start a conversation'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {hasConversationStarted
                                ? 'Sources will appear here when the AI references articles'
                                : 'Ask a question and see relevant sources appear here'
                            }
                        </p>
                    </div>
                )}
            </div>

            <div
                className="px-4 py-3 text-xs"
                style={{
                    background: 'var(--color-bg-tertiary)',
                    borderTop: '1px solid var(--color-border-primary)',
                    color: 'var(--color-text-muted)'
                }}
            >
                Click a source to read the full article
            </div>
        </div>
    );
};

export default SourcesPanel;
