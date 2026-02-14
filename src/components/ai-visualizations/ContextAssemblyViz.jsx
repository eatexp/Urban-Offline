import React, { useState, useEffect } from 'react';
import { GlassmorphismCard } from './VisualizationEffects';

const styles = `
  .ctx-assembly {
    position: relative;
    min-height: 80px;
    padding: 12px;
  }

  .ctx-assembly-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-tertiary, #94a3b8);
    margin-bottom: 8px;
  }

  .ctx-chunks {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ctx-chunk {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 8px;
    opacity: 0;
    transform: translateX(-20px) scale(0.95);
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .ctx-chunk.visible {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  .ctx-chunk-score {
    flex-shrink: 0;
    width: 32px;
    height: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: white;
  }

  .ctx-chunk-score.high { background: #10b981; }
  .ctx-chunk-score.medium { background: #f59e0b; }
  .ctx-chunk-score.low { background: #94a3b8; }

  .ctx-chunk-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-primary, #0f172a);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ctx-chunk-source {
    font-size: 9px;
    color: var(--color-text-tertiary, #94a3b8);
    flex-shrink: 0;
  }

  .ctx-empty {
    text-align: center;
    padding: 16px;
    font-size: 12px;
    color: var(--color-text-tertiary, #94a3b8);
    font-style: italic;
  }

  @keyframes ctx-tokens-count {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ctx-token-count {
    text-align: right;
    font-size: 10px;
    color: var(--color-text-tertiary, #94a3b8);
    margin-top: 6px;
    animation: ctx-tokens-count 0.3s ease forwards;
  }
`;

export default function ContextAssemblyViz({ chunks = [], active = false }) {
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        if (!active || chunks.length === 0) {
            queueMicrotask(() => {
                setVisibleCount(0);
            });
            return;
        }

        queueMicrotask(() => {
            setVisibleCount(0);
        });
        const timers = chunks.map((_, i) =>
            setTimeout(() => setVisibleCount(i + 1), 150 * (i + 1))
        );

        return () => timers.forEach(clearTimeout);
    }, [active, chunks]);

    // Sort by score descending
    const sorted = [...chunks].sort((a, b) => (b.score || 0) - (a.score || 0));

    function scoreClass(score) {
        if (score >= 0.8) return 'high';
        if (score >= 0.5) return 'medium';
        return 'low';
    }

    const totalTokens = sorted.reduce((sum, c) => sum + Math.ceil((c.length || 0) / 4), 0);

    return (
        <>
            <style>{styles}</style>
            <div className="ctx-assembly">
                <div className="ctx-assembly-label">Context Assembly</div>

                {sorted.length === 0 ? (
                    <div className="ctx-empty">Waiting for retrieval...</div>
                ) : (
                    <GlassmorphismCard style={{ padding: '10px', background: 'rgba(15,23,42,0.02)' }}>
                        <div className="ctx-chunks">
                            {sorted.map((chunk, i) => (
                                <div
                                    key={i}
                                    className={`ctx-chunk ${i < visibleCount ? 'visible' : ''}`}
                                    style={{ transitionDelay: `${i * 50}ms` }}
                                >
                                    <div className={`ctx-chunk-score ${scoreClass(chunk.score || 0)}`}>
                                        {((chunk.score || 0) * 100).toFixed(0)}
                                    </div>
                                    <span className="ctx-chunk-title">{chunk.title}</span>
                                    <span className="ctx-chunk-source">{chunk.store}</span>
                                </div>
                            ))}
                        </div>
                        {visibleCount >= sorted.length && totalTokens > 0 && (
                            <div className="ctx-token-count">
                                ~{totalTokens.toLocaleString()} tokens assembled
                            </div>
                        )}
                    </GlassmorphismCard>
                )}
            </div>
        </>
    );
}
