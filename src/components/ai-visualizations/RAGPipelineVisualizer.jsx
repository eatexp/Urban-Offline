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
// Pipeline stages configuration - Tactical Dark Theme
const PIPELINE_STAGES = [
  {
    id: 'query',
    label: 'Query',
    icon: Search,
    description: 'Input',
    color: '#64748b', // Slate-500
    glowColor: 'rgba(100, 116, 139, 0.1)'
  },
  {
    id: 'embedding',
    label: 'Embed',
    icon: Cpu,
    description: 'Vectorize',
    color: '#52525b', // Zinc-600
    glowColor: 'rgba(82, 82, 91, 0.1)'
  },
  {
    id: 'retrieval',
    label: 'Search',
    icon: Database,
    description: 'Lookup',
    color: '#075985', // Sky-800
    glowColor: 'rgba(7, 89, 133, 0.2)'
  },
  {
    id: 'context',
    label: 'Context',
    icon: FileText,
    description: 'Assemble',
    color: '#3730a3', // Indigo-800
    glowColor: 'rgba(55, 48, 163, 0.2)'
  },
  {
    id: 'generate',
    label: 'Generate',
    icon: Sparkles,
    description: 'Output',
    color: '#047857', // Emerald-700
    glowColor: 'rgba(4, 120, 87, 0.2)'
  }
];

/**
 * Enhanced RAG Pipeline Visualizer
 */
const RAGPipelineVisualizer = ({
  isActive = false,
  currentStage = null,
  stageData = {},
  _onStageClick,
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
      queueMicrotask(() => {
        setElapsedTime(0);
      });
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
          letter-spacing: 0.02em;
        }
        
        .pipeline-timer {
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-family-mono);
          color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.05); /* Stealth bg */
          padding: 4px 8px;
          border-radius: 4px; /* Sharper */
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .pipeline-track {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 10px; /* More vertical padding */
          margin-bottom: 16px;
          overflow-x: auto; /* Allow scrolling on small screens */
          scrollbar-width: none; /* Hide scrollbar Firefox */
          -ms-overflow-style: none; /* Hide scrollbar IE/Edge */
        }
        
        .pipeline-track::-webkit-scrollbar {
          display: none; /* Hide scrollbar Chrome/Safari */
        }

        /* Ensure min-width for scrolling */
        @media (max-width: 600px) {
          .pipeline-track {
            justify-content: flex-start;
            gap: 20px;
            padding-right: 20px;
          }
          
          .pipeline-beam {
            left: 20px;
            width: calc(100% - 40px);
            min-width: 400px; /* Ensure beam stretches */
          }
          
          .pipeline-stage {
            min-width: 60px; /* Ensure click target size */
          }
        }
        
        /* Connection beam */
        .pipeline-beam {
          position: absolute;
          top: 50%;
          left: 40px;
          right: 40px;
          height: 1px; /* Thinner beam */
          background: rgba(255,255,255,0.05);
          transform: translateY(-50%);
          overflow: hidden;
        }
        
        .beam-progress {
          height: 100%;
          background: linear-gradient(90deg, #18181b, #27272a, #0ea5e9, #10b981); /* Zinc to Sky/Emerald */
          background-size: 200% 100%;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .beam-progress.animate {
          animation: beam-shimmer 1.5s linear infinite; /* Faster */
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
          width: 3px; /* Smaller */
          height: 1px; /* Dash */
          background: #fff;
          top: 50%;
          transform: translateY(-50%);
          animation: particle-travel 1s linear infinite; /* Faster */
          box-shadow: 0 0 2px rgba(255,255,255,0.8);
        }
        
        @keyframes particle-travel {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
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
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .pipeline-stage:hover {
          transform: translateY(-2px);
        }
        
        .stage-node {
          width: 32px; /* Smaller */
          height: 32px;
          border-radius: 6px; /* Squircle */
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6); /* Darker base */
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }
        
        .stage-node.pending {
          opacity: 0.4;
          background: rgba(9, 9, 11, 0.4);
        }
        
        .stage-node.active {
          border-color: currentColor;
          box-shadow: 0 0 0 1px currentColor, inset 0 0 10px rgba(0,0,0,0.5); /* Tactical active state */
          transform: scale(1.05);
          background: rgba(0,0,0,0.8);
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
          font-size: 9px;
          font-family: var(--font-family-mono);
          color: var(--color-text-muted);
          opacity: 0.7;
        }
        
        /* Expanded details */
        .stage-details {
          margin-top: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
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
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .detail-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
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
                    background: '#c2410c', /* Darker Orange */
                    boxShadow: 'none',
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
const CompactPipelineView = ({ isActive, currentStage, _stageData, elapsedTime }) => {
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
          background: rgba(2, 6, 23, 0.4);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
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