import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import BookshelfGrid from './BookshelfGrid';
import ContextAssemblyViz from './ContextAssemblyViz';
import GenerationStreamViz from './GenerationStreamViz';

const styles = `
  .ai-reading {
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: all 0.3s ease;
  }

  .ai-reading-collapsed {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(99, 102, 241, 0.04);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .ai-reading-collapsed:hover {
    background: rgba(99, 102, 241, 0.08);
  }

  .ai-reading-collapsed-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6366f1;
    flex-shrink: 0;
  }

  @keyframes ai-indicator-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }

  .ai-reading-collapsed-indicator.active {
    animation: ai-indicator-pulse 1.5s ease-in-out infinite;
  }

  .ai-reading-collapsed-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
    flex: 1;
  }

  .ai-reading-toggle {
    color: var(--color-text-tertiary, #94a3b8);
  }

  .ai-reading-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
  }

  .ai-reading-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--color-text-tertiary, #94a3b8);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ai-reading-title svg {
    color: #6366f1;
  }

  .ai-reading-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ai-reading-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-tertiary, #94a3b8);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ai-reading-btn:hover {
    background: var(--color-bg-tertiary, #e2e8f0);
    color: var(--color-text-secondary, #64748b);
  }

  .ai-reading-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .ai-reading-stages {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    transition: max-height 0.3s ease, opacity 0.3s ease;
  }

  .ai-reading-stage {
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .ai-reading-stage.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Stage progress dots */
  .ai-stage-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 6px 0;
  }

  .ai-stage-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-bg-tertiary, #e2e8f0);
    transition: all 0.3s ease;
  }

  .ai-stage-dot.active {
    background: #6366f1;
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  }

  .ai-stage-dot.done {
    background: #10b981;
  }
`;

function getStageLabel(currentStage) {
    switch (currentStage) {
        case 'intent': return 'Understanding query...';
        case 'retrieval': return 'Scanning library...';
        case 'context': return 'Assembling context...';
        case 'generation': return 'Generating response...';
        default: return 'AI Reading';
    }
}

const STAGE_ORDER = ['intent', 'retrieval', 'context', 'generation'];

export default function AIReadingViz({ stages = [], isActive = false, onReplay }) {
    const [expanded, setExpanded] = useState(true);
    const [replayKey, setReplayKey] = useState(0);

    // Derive current state from stages
    const latestStage = stages.length > 0 ? stages[stages.length - 1] : null;
    const currentStageName = latestStage?.stage || null;
    const currentStageIndex = currentStageName ? STAGE_ORDER.indexOf(currentStageName) : -1;

    // Extract data per stage
    const stageData = useMemo(() => {
        const data = {};
        for (const s of stages) {
            data[s.stage] = s.data;
        }
        return data;
    }, [stages]);

    // Sources from retrieval stage
    const retrievalSources = stageData.retrieval?.sources || [];
    const hitIndices = retrievalSources.map((_, i) => i);

    // Chunks from context stage
    const contextChunks = stageData.context?.chunks || [];

    // Generation data
    const genData = stageData.generation || {};

    // Auto-expand when active
    useEffect(() => {
        if (isActive && stages.length > 0) {
            queueMicrotask(() => {
                setExpanded(true);
            });
        }
    }, [isActive, stages.length]);

    const handleReplay = useCallback(() => {
        setReplayKey(k => k + 1);
        if (onReplay) onReplay();
    }, [onReplay]);

    // Collapsed view
    if (!expanded) {
        return (
            <>
                <style>{styles}</style>
                <div className="ai-reading-collapsed" onClick={() => setExpanded(true)}>
                    <div className={`ai-reading-collapsed-indicator ${isActive ? 'active' : ''}`} />
                    <span className="ai-reading-collapsed-text">
                        {isActive ? getStageLabel(currentStageName) : 'AI Reading Visualization'}
                    </span>
                    <ChevronDown size={14} className="ai-reading-toggle" />
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="ai-reading" key={replayKey}>
                <div className="ai-reading-header">
                    <div className="ai-reading-title">
                        <Eye size={12} />
                        AI Reading
                    </div>
                    <div className="ai-reading-actions">
                        <button
                            className="ai-reading-btn"
                            onClick={handleReplay}
                            disabled={isActive || stages.length === 0}
                            title="Replay animation"
                        >
                            <RotateCcw size={12} />
                            Replay
                        </button>
                        <button
                            className="ai-reading-btn"
                            onClick={() => setExpanded(false)}
                        >
                            <ChevronUp size={12} />
                        </button>
                    </div>
                </div>

                {/* Stage progress dots */}
                <div className="ai-stage-dots">
                    {STAGE_ORDER.map((stage, i) => (
                        <div
                            key={stage}
                            className={`ai-stage-dot ${
                                i === currentStageIndex ? 'active' :
                                i < currentStageIndex ? 'done' : ''
                            }`}
                        />
                    ))}
                </div>

                <div className="ai-reading-stages">
                    {/* Bookshelf — always visible */}
                    <div className={`ai-reading-stage ${currentStageIndex >= 0 ? 'visible' : ''}`}>
                        <BookshelfGrid
                            sources={retrievalSources}
                            stage={currentStageName || 'idle'}
                            hitIndices={hitIndices}
                        />
                    </div>

                    {/* Context Assembly — visible from context stage */}
                    <div className={`ai-reading-stage ${currentStageIndex >= 2 ? 'visible' : ''}`}>
                        <ContextAssemblyViz
                            chunks={contextChunks}
                            active={currentStageIndex >= 2}
                        />
                    </div>

                    {/* Generation Stream — visible from generation stage */}
                    <div className={`ai-reading-stage ${currentStageIndex >= 3 ? 'visible' : ''}`}>
                        <GenerationStreamViz
                            fullText={genData.fullText || ''}
                            citations={genData.citations || []}
                            generating={isActive && currentStageName === 'generation' && genData.progress < 100}
                            usedFallback={genData.usedFallback || false}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
