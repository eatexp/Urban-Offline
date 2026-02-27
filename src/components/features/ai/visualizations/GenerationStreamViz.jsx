import React, { useState, useEffect, useRef } from 'react';

const CITATION_COLORS = [
    '#6366f1', '#8b5cf6', '#3b82f6', '#0891b2',
    '#059669', '#d97706', '#dc2626', '#db2777'
];

const styles = `
  .gen-stream {
    padding: 12px;
  }

  .gen-stream-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-tertiary, #94a3b8);
    margin-bottom: 8px;
  }

  .gen-stream-body {
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-primary, #0f172a);
    min-height: 40px;
  }

  .gen-word {
    display: inline;
    opacity: 0;
    animation: gen-word-appear 0.15s ease forwards;
  }

  @keyframes gen-word-appear {
    from { opacity: 0; filter: blur(2px); }
    to { opacity: 1; filter: blur(0); }
  }

  .gen-citation {
    display: inline;
    font-weight: 600;
    border-bottom: 2px solid;
    padding-bottom: 1px;
    cursor: default;
  }

  .gen-cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: #6366f1;
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: gen-cursor-blink 0.8s ease-in-out infinite;
  }

  @keyframes gen-cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .gen-sources {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(0,0,0,0.04);
  }

  .gen-source-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.04);
    color: var(--color-text-secondary, #64748b);
  }

  .gen-source-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .gen-waiting {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 16px;
    font-size: 12px;
    color: var(--color-text-tertiary, #94a3b8);
    font-style: italic;
  }

  @keyframes gen-dot-pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }

  .gen-waiting-dots span {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #6366f1;
    margin: 0 1px;
    animation: gen-dot-pulse 1.4s ease-in-out infinite;
  }

  .gen-waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
  .gen-waiting-dots span:nth-child(3) { animation-delay: 0.4s; }
`;

export default function GenerationStreamViz({
    fullText = '',
    citations = [],
    generating = false,
    _usedFallback = false
}) {
    const [displayedWords, setDisplayedWords] = useState(0);
    const containerRef = useRef(null);
    const prevTextRef = useRef('');

    // Parse text into words, highlighting citations like [1], [2]
    const words = fullText ? fullText.split(/(\s+|\[\d+\])/).filter(Boolean) : [];

    useEffect(() => {
        // If new text arrives, start typewriter from where we left off
        if (fullText && fullText !== prevTextRef.current) {
            const prevWordCount = prevTextRef.current
                ? prevTextRef.current.split(/(\s+|\[\d+\])/).filter(Boolean).length
                : 0;

            prevTextRef.current = fullText;

            // Animate new words appearing
            const newWords = words.length;
            const startFrom = Math.min(prevWordCount, newWords);

            queueMicrotask(() => {
                setDisplayedWords(startFrom);
            });

            // Reveal words progressively
            if (startFrom < newWords) {
                const remaining = newWords - startFrom;
                const batchSize = Math.max(1, Math.floor(remaining / 30)); // ~30 animation steps
                let current = startFrom;

                const interval = setInterval(() => {
                    current = Math.min(current + batchSize, newWords);
                    setDisplayedWords(current);
                    if (current >= newWords) clearInterval(interval);
                }, 30);

                return () => clearInterval(interval);
            }
        }
    }, [fullText, words.length]);

    // Auto-scroll
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayedWords]);

    function isCitation(word) {
        return /^\[\d+\]$/.test(word);
    }

    function getCitationColor(word) {
        const num = parseInt(word.replace(/\[|\]/g, ''), 10) - 1;
        return CITATION_COLORS[num % CITATION_COLORS.length];
    }

    if (!fullText && !generating) {
        return null;
    }

    return (
        <>
            <style>{styles}</style>
            <div className="gen-stream">
                <div className="gen-stream-label">
                    {generating && !fullText ? 'Generating' : 'Response'}
                </div>

                {generating && !fullText ? (
                    <div className="gen-waiting">
                        Thinking
                        <div className="gen-waiting-dots">
                            <span /><span /><span />
                        </div>
                    </div>
                ) : (
                    <div className="gen-stream-body" ref={containerRef}>
                        {words.slice(0, displayedWords).map((word, i) => {
                            if (isCitation(word)) {
                                return (
                                    <span
                                        key={i}
                                        className="gen-citation gen-word"
                                        style={{
                                            color: getCitationColor(word),
                                            borderColor: getCitationColor(word),
                                            animationDelay: `${i * 10}ms`
                                        }}
                                    >
                                        {word}
                                    </span>
                                );
                            }
                            if (/^\s+$/.test(word)) return word;
                            return (
                                <span
                                    key={i}
                                    className="gen-word"
                                    style={{ animationDelay: `${Math.max(0, (i - displayedWords + 5)) * 10}ms` }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                        {generating && displayedWords < words.length && (
                            <span className="gen-cursor" />
                        )}
                    </div>
                )}

                {citations.length > 0 && displayedWords >= words.length && (
                    <div className="gen-sources">
                        {citations.map((src, i) => (
                            <div key={i} className="gen-source-chip">
                                <div
                                    className="gen-source-dot"
                                    style={{ background: CITATION_COLORS[i % CITATION_COLORS.length] }}
                                />
                                [{src.index != null ? src.index + 1 : i + 1}] {src.title}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
