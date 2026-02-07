/**
 * RAG Pipeline Visualizer - Enhanced Edition
 * 
 * Shows the real-time flow of data through the RAG pipeline:
 * Query → Embedding → Retrieval → Context Build → Generate
 * 
 * Features:
 * - Glassmorphism stage cards
 * - Flowing energy beam with particles
 * - Live timing counters
 * - Staggered reveal animations
 * - Expandable stage details
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Cpu,
  Database,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  GlassmorphismCard,
  AnimatedNumber,
  GlowFilters,
  CircularProgress
} from './VisualizationEffects';

// Pipeline stages configuration
const PIPELINE_STAGES = [
  {
    id: 'query',
    label: 'Query',
    icon: Search,
    description: 'User question received',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)'
  },
  {
    id: 'embedding',
    label: 'Embed',
    icon: Cpu,
    description: 'Vector embedding',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)'
  },
  {
    id: 'retrieval',
    label: 'Retrieve',
    icon: Database,
    description: 'Search knowledge',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)'
  },
  {
    id: 'context',
    label: 'Context',
    icon: FileText,
    description: 'Build context',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    id: 'generate',
    label: 'Generate',
    icon: Sparkles,
    description: 'AI response',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.4)'
  }
];

/**
 * Enhanced RAG Pipeline Visualizer
 */
const RAGPipelineVisualizer = ({
  isActive = false,
  currentStage = null,
  stageData = {},
  onStageClick,
  compact = false
}) => {
  const [expandedStage, setExpandedStage] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);

  // Track elapsed time when active
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
      startTimeRef.current = null;
    }
  }, [isActive]);

  const getStageStatus = (stageIndex) => {
    if (!currentStage) return 'pending';
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getProgressPercent = () => {
    if (!currentStage) return 0;
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);
    return ((currentIndex + 1) / PIPELINE_STAGES.length) * 100;
  };

  if (compact) {
    return <CompactPipelineView
      isActive={isActive}
      currentStage={currentStage}
      stageData={stageData}
      elapsedTime={elapsedTime}
    />;
  }

  return (
    <GlassmorphismCard
      className="rag-pipeline-viz"
      glow={isActive ? 'primary' : null}
    >
      <style>{`
        .rag-pipeline-viz {
          padding: 20px;
        }
        
        .pipeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .pipeline-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .pipeline-title h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        
        .pipeline-timer {
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-family-mono);
          color: var(--color-primary-400);
          background: rgba(249, 115, 22, 0.15);
          padding: 4px 10px;
          border-radius: 6px;
        }
        
        .pipeline-track {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          margin-bottom: 16px;
        }
        
        /* Connection beam */
        .pipeline-beam {
          position: absolute;
          top: 50%;
          left: 40px;
          right: 40px;
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          transform: translateY(-50%);
          overflow: hidden;
        }
        
        .beam-progress {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #f97316, #8b5cf6, #3b82f6, #06b6d4, #22c55e);
          background-size: 200% 100%;
          transition: width 0.5s ease;
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
        }
        
        .beam-progress.animate {
          animation: beam-shimmer 2s linear infinite;
        }
        
        @keyframes beam-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* Particles on beam */
        .beam-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .beam-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          animation: particle-travel 1.5s linear infinite;
        }
        
        @keyframes particle-travel {
          0% { left: -10px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% + 10px); opacity: 0; }
        }
        
        /* Stage nodes */
        .pipeline-stage {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .pipeline-stage:hover {
          transform: translateY(-4px);
        }
        
        .stage-node {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(255,255,255,0.1);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .stage-node.pending {
          opacity: 0.5;
        }
        
        .stage-node.active {
          border-color: currentColor;
          animation: stage-active-pulse 1.5s ease-in-out infinite;
        }
        
        .stage-node.completed {
          background: currentColor;
          border-color: currentColor;
        }
        
        @keyframes stage-active-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px currentColor;
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 35px currentColor;
            transform: scale(1.08);
          }
        }
        
        .stage-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
        }
        
        .stage-label.active {
          color: var(--color-text-primary);
        }
        
        .stage-timing {
          font-size: 10px;
          font-family: var(--font-family-mono);
          color: var(--color-text-muted);
          opacity: 0.7;
        }
        
        /* Expanded details */
        .stage-details {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          animation: details-slide-in 0.3s ease;
        }
        
        @keyframes details-slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .detail-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .detail-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }
        
        .detail-label {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        
        .detail-value {
          font-size: 11px;
          color: var(--color-text-primary);
          font-family: var(--font-family-mono);
        }
        
        .detail-value.highlight {
          color: var(--color-primary-400);
          font-weight: 600;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .beam-progress.animate, .stage-node.active, .beam-particle {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="pipeline-header">
        <div className="pipeline-title">
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--color-primary-400)' }} />
          <h3>RAG Pipeline</h3>
        </div>
        {isActive && (
          <div className="pipeline-timer">
            <AnimatedNumber value={elapsedTime} suffix="ms" />
          </div>
        )}
      </div>

      {/* Pipeline Track */}
      <div className="pipeline-track">
        {/* Energy beam */}
        <div className="pipeline-beam">
          <div
            className={`beam-progress ${isActive ? 'animate' : ''}`}
            style={{ width: `${getProgressPercent()}%` }}
          />

          {/* Floating particles */}
          {isActive && (
            <div className="beam-particles">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="beam-particle"
                  style={{
                    background: '#f97316',
                    boxShadow: '0 0 10px #f97316',
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stage nodes */}
        {PIPELINE_STAGES.map((stage, index) => {
          const status = getStageStatus(index);
          const StageIcon = stage.icon;
          const data = stageData[stage.id];

          return (
            <div
              key={stage.id}
              className="pipeline-stage"
              onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
            >
              <div
                className={`stage-node ${status}`}
                style={{ color: stage.color }}
              >
                {status === 'active' && isActive ? (
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: stage.color }}
                  />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'white' }} />
                ) : (
                  <StageIcon
                    className="w-5 h-5"
                    style={{ color: status === 'pending' ? 'var(--color-text-muted)' : stage.color }}
                  />
                )}
              </div>

              <span className={`stage-label ${status === 'active' ? 'active' : ''}`}>
                {stage.label}
              </span>

              {data?.duration && (
                <span className="stage-timing">{data.duration}ms</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded stage details */}
      {expandedStage && stageData[expandedStage] && (
        <div className="stage-details">
          <StageDetails
            stage={PIPELINE_STAGES.find(s => s.id === expandedStage)}
            data={stageData[expandedStage]}
          />
        </div>
      )}
    </GlassmorphismCard>
  );
};

/**
 * Compact view for tight spaces
 */
const CompactPipelineView = ({ isActive, currentStage, stageData, elapsedTime }) => {
  const currentIndex = currentStage
    ? PIPELINE_STAGES.findIndex(s => s.id === currentStage)
    : -1;

  return (
    <div className="rag-compact">
      <style>{`
        .rag-compact {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .compact-stages {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .compact-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
        }
        
        .compact-dot.active {
          border-color: currentColor;
          box-shadow: 0 0 10px currentColor;
          animation: compact-pulse 1.5s ease-in-out infinite;
        }
        
        .compact-dot.completed {
          background: currentColor;
          border-color: currentColor;
        }
        
        @keyframes compact-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        
        .compact-connector {
          width: 12px;
          height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 1px;
        }
        
        .compact-connector.active {
          background: linear-gradient(90deg, currentColor, rgba(255,255,255,0.1));
        }
        
        .compact-label {
          font-size: 10px;
          font-weight: 500;
          color: var(--color-primary-400);
          margin-left: 6px;
        }
        
        .compact-time {
          font-size: 10px;
          font-family: var(--font-family-mono);
          color: var(--color-text-muted);
          margin-left: auto;
        }
      `}</style>

      <div className="compact-stages">
        {PIPELINE_STAGES.map((stage, index) => {
          const status = index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'pending';

          return (
            <React.Fragment key={stage.id}>
              <div
                className={`compact-dot ${status}`}
                style={{ color: stage.color }}
                title={stage.label}
              />
              {index < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`compact-connector ${index < currentIndex ? 'active' : ''}`}
                  style={{ color: PIPELINE_STAGES[index + 1]?.color }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {currentStage && (
        <span className="compact-label">
          {PIPELINE_STAGES.find(s => s.id === currentStage)?.label}
        </span>
      )}

      {isActive && (
        <span className="compact-time">
          {Math.round(elapsedTime)}ms
        </span>
      )}
    </div>
  );
};

/**
 * Stage details component
 */
const StageDetails = ({ stage, data }) => {
  const renderDetails = () => {
    switch (stage.id) {
      case 'query':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Query Length</span>
              <span className="detail-value">{data.length} chars</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <span className="detail-value highlight">{data.category || 'general'}</span>
            </div>
          </>
        );

      case 'embedding':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Model</span>
              <span className="detail-value">MiniLM-L6</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Dimensions</span>
              <span className="detail-value">384</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Method</span>
              <span className="detail-value highlight">{data.method || 'semantic'}</span>
            </div>
          </>
        );

      case 'retrieval':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Docs Found</span>
              <span className="detail-value highlight">{data.docCount || 0}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Search Mode</span>
              <span className="detail-value">{data.searchMethod || 'hybrid'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Datasets</span>
              <span className="detail-value">{data.datasets?.join(', ') || 'all'}</span>
            </div>
          </>
        );

      case 'context':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Context Size</span>
              <span className="detail-value highlight">{data.tokenCount || 0} tokens</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Documents</span>
              <span className="detail-value">{data.docCount || 0}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Chunks</span>
              <span className="detail-value">{data.chunkCount || 0}</span>
            </div>
          </>
        );

      case 'generate':
        return (
          <>
            <div className="detail-row">
              <span className="detail-label">Model</span>
              <span className="detail-value highlight">{data.model || 'fallback'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Output</span>
              <span className="detail-value">{data.outputTokens || 0} tokens</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Temperature</span>
              <span className="detail-value">{data.temperature || 0.3}</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="detail-header">
        <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
        <span className="detail-title">{stage.label}</span>
        {data?.duration && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-family-mono)'
          }}>
            <Clock className="w-3 h-3 inline mr-1" />
            {data.duration}ms
          </span>
        )}
      </div>
      {renderDetails()}
    </>
  );
};

export default RAGPipelineVisualizer;