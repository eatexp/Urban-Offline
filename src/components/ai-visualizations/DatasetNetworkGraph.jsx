/**
 * Dataset Network Graph - Enhanced Edition
 * 
 * Visualizes real-time connections between queries and datasets
 * with stunning animations and modern glass effects
 * 
 * Features:
 * - Floating nodes with subtle bobbing animation
 * - Glassmorphism containers
 * - Particle trails along connection lines
 * - 3D tilt on hover
 * - Animated data packets with glow trails
 * - Pulsing glow effects based on activity
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart,
  Tent,
  Scale,
  BookOpen,
  Activity,
  Database,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';
import {
  GlassmorphismCard,
  AnimatedNumber,
  GlowFilters
} from './VisualizationEffects';

// Dataset configuration with icons and colors
const DATASET_CONFIG = {
  health: {
    id: 'health',
    name: 'Health & Medical',
    shortName: 'Health',
    icon: Heart,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    position: { x: 0.2, y: 0.28 },
    floatDelay: 0
  },
  survival: {
    id: 'survival',
    name: 'Survival Skills',
    shortName: 'Survival',
    icon: Tent,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    position: { x: 0.8, y: 0.28 },
    floatDelay: 0.5
  },
  law: {
    id: 'law',
    name: 'Legal Rights',
    shortName: 'Legal',
    icon: Scale,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    position: { x: 0.2, y: 0.72 },
    floatDelay: 1
  },
  guides: {
    id: 'guides',
    name: 'General Guides',
    shortName: 'Guides',
    icon: BookOpen,
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    position: { x: 0.8, y: 0.72 },
    floatDelay: 1.5
  }
};

/**
 * Enhanced Dataset Network Graph Component
 */
const DatasetNetworkGraph = ({
  activeDatasets = [],
  queryActivity = [],
  showStats = true,
  size = 'medium',
  onDatasetClick
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [pulses, setPulses] = useState([]);
  const [particles, setParticles] = useState([]);
  // const [hoveredNode, setHoveredNode] = useState(null); // Unused

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create pulse and particle animation when dataset is queried
  useEffect(() => {
    if (queryActivity.length === 0) return;

    const latestActivity = queryActivity[queryActivity.length - 1];
    const datasetId = latestActivity.datasetId;

    // Create pulse
    const newPulse = {
      id: Date.now(),
      datasetId,
      timestamp: Date.now()
    };
    setPulses(prev => [...prev, newPulse]);
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== newPulse.id));
    }, 2000);

    // Create particles along the connection
    const config = DATASET_CONFIG[datasetId];
    if (config) {
      const numParticles = 5;
      const newParticles = Array.from({ length: numParticles }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        datasetId,
        progress: 0,
        delay: i * 0.15,
        color: config.color
      }));
      setParticles(prev => [...prev, ...newParticles]);

      // Animate and remove particles
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1500);
    }
  }, [queryActivity]);

  const getNodePosition = (datasetId) => {
    const config = DATASET_CONFIG[datasetId];
    if (!config) return { x: 0, y: 0 };
    return {
      x: config.position.x * dimensions.width,
      y: config.position.y * dimensions.height
    };
  };

  const centerPosition = {
    x: dimensions.width / 2,
    y: dimensions.height / 2
  };

  // Calculate hit rate
  const hitRate = useMemo(() => {
    if (queryActivity.length === 0) return 0;
    return Math.round((queryActivity.filter(a => a.hits > 0).length / queryActivity.length) * 100);
  }, [queryActivity]);

  return (
    <GlassmorphismCard
      ref={containerRef}
      className={`dataset-network-graph dataset-network-${size}`}
      glow={queryActivity.length > 0 ? 'primary' : null}
    >
      <style>{`
        .dataset-network-graph {
          position: relative;
          overflow: hidden;
        }
        
        .dataset-network-small { height: 220px; }
        .dataset-network-medium { height: 320px; }
        .dataset-network-large { height: 420px; }
        
        .network-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        
        /* Background grid pattern */
        .network-bg-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
          background-size: 24px 24px;
          pointer-events: none;
        }
        
        /* Center node */
        .network-center {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
        }
        
        .center-node {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 40px rgba(249, 115, 22, 0.5),
            0 0 80px rgba(139, 92, 246, 0.3),
            inset 0 2px 4px rgba(255,255,255,0.2);
          animation: center-breathe 4s ease-in-out infinite;
          border: 2px solid rgba(255,255,255,0.2);
        }
        
        @keyframes center-breathe {
          0%, 100% { 
            box-shadow: 
              0 0 40px rgba(249, 115, 22, 0.5),
              0 0 80px rgba(139, 92, 246, 0.3),
              inset 0 2px 4px rgba(255,255,255,0.2);
            transform: scale(1);
          }
          50% { 
            box-shadow: 
              0 0 60px rgba(249, 115, 22, 0.6),
              0 0 100px rgba(139, 92, 246, 0.4),
              inset 0 2px 4px rgba(255,255,255,0.2);
            transform: scale(1.08);
          }
        }
        
        .center-label {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        
        /* Dataset nodes */
        .dataset-node {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 20;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .dataset-node:hover {
          z-index: 30;
        }
        
        .dataset-node:hover .node-circle {
          transform: scale(1.15) translateZ(20px);
        }
        
        .dataset-node.disabled {
          opacity: 0.35;
          filter: grayscale(0.9);
        }
        
        .dataset-node.disabled:hover .node-circle {
          transform: scale(1);
        }
        
        /* Floating animation */
        .node-float {
          animation: node-float 5s ease-in-out infinite;
        }
        
        @keyframes node-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .node-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transform-style: preserve-3d;
        }
        
        .node-circle.active {
          animation: node-active-glow 2.5s ease-in-out infinite;
        }
        
        @keyframes node-active-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        
        /* Pulse rings */
        .pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid;
          opacity: 0;
          animation: pulse-ring-expand 2s ease-out forwards;
          pointer-events: none;
        }
        
        @keyframes pulse-ring-expand {
          0% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        .node-label {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          text-align: center;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        
        .node-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 22px;
          height: 22px;
          border-radius: 11px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          border: 2px solid rgba(0,0,0,0.2);
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
          animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes badge-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        
        /* Stats panel */
        .network-stats {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 16px;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent);
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        
        .network-stats::-webkit-scrollbar { display: none; }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          min-width: fit-content;
          transition: all 0.2s ease;
        }
        
        .stat-item:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
        }
        
        .stat-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        
        .stat-label {
          font-size: 9px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary);
          font-family: var(--font-family-mono);
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .center-node, .node-float, .node-circle.active, .pulse-ring {
            animation: none;
          }
        }
      `}</style>

      {/* Background pattern */}
      <div className="network-bg-pattern" />

      {/* SVG Layer for connections and particles */}
      <svg className="network-canvas">
        <GlowFilters />

        <defs>
          {/* Connection gradient */}
          <linearGradient id="connection-gradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>

          {/* Animated dash pattern */}
          <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="12" height="1">
            <line x1="0" y1="0" x2="8" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.6s" repeatCount="indefinite" />
            </line>
          </pattern>
        </defs>

        {/* Connection lines */}
        {Object.keys(DATASET_CONFIG).map(datasetId => {
          const isActive = activeDatasets.includes(datasetId);
          const config = DATASET_CONFIG[datasetId];
          const end = getNodePosition(datasetId);

          if (!isActive) return null;

          return (
            <g key={`conn-${datasetId}`}>
              {/* Glow layer */}
              <line
                x1={centerPosition.x}
                y1={centerPosition.y}
                x2={end.x}
                y2={end.y}
                stroke={config.color}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={0.15}
                filter="url(#glow-soft)"
              />

              {/* Main line */}
              <line
                x1={centerPosition.x}
                y1={centerPosition.y}
                x2={end.x}
                y2={end.y}
                stroke={config.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="8 6"
                opacity={0.7}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-14"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </line>

              {/* Arrow head */}
              <circle
                cx={end.x}
                cy={end.y}
                r="4"
                fill={config.color}
                opacity={0.5}
              />
            </g>
          );
        })}

        {/* Animated particles along connections */}
        {particles.map(particle => {
          const config = DATASET_CONFIG[particle.datasetId];
          if (!config) return null;

          const end = getNodePosition(particle.datasetId);

          return (
            <circle
              key={particle.id}
              r="5"
              fill={particle.color}
              filter="url(#glow)"
            >
              <animate
                attributeName="cx"
                from={centerPosition.x}
                to={end.x}
                dur="1s"
                begin={`${particle.delay}s`}
                fill="freeze"
              />
              <animate
                attributeName="cy"
                from={centerPosition.y}
                to={end.y}
                dur="1s"
                begin={`${particle.delay}s`}
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.2;0.8;1"
                dur="1s"
                begin={`${particle.delay}s`}
                fill="freeze"
              />
              <animate
                attributeName="r"
                values="3;6;3"
                dur="1s"
                begin={`${particle.delay}s`}
                fill="freeze"
              />
            </circle>
          );
        })}
      </svg>

      {/* Center Node */}
      <div
        className="network-center"
        style={{ left: centerPosition.x, top: centerPosition.y }}
      >
        <div className="center-node">
          <Sparkles className="w-7 h-7" style={{ color: 'white' }} />
        </div>
        <span className="center-label">Query</span>
      </div>

      {/* Dataset Nodes */}
      {Object.values(DATASET_CONFIG).map(dataset => {
        const isActive = activeDatasets.includes(dataset.id);
        const position = getNodePosition(dataset.id);
        const recentPulses = pulses.filter(p => p.datasetId === dataset.id);
        const activityCount = queryActivity.filter(a => a.datasetId === dataset.id).length;
        const Icon = dataset.icon;

        return (
          <div
            key={dataset.id}
            className={`dataset-node ${isActive ? '' : 'disabled'}`}
            style={{ left: position.x, top: position.y }}
            onClick={() => onDatasetClick?.(dataset.id)}

          >
            {/* Floating wrapper */}
            <div
              className="node-float"
              style={{ animationDelay: `${dataset.floatDelay}s` }}
            >
              {/* Pulse rings */}
              {recentPulses.map((pulse, i) => (
                <div
                  key={pulse.id}
                  className="pulse-ring"
                  style={{
                    borderColor: dataset.color,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}

              {/* Node circle */}
              <div
                className={`node-circle ${isActive ? 'active' : ''}`}
                style={{
                  borderColor: dataset.color,
                  background: dataset.bgColor,
                  boxShadow: isActive
                    ? `0 0 30px ${dataset.glowColor}, inset 0 2px 4px rgba(255,255,255,0.1)`
                    : 'none'
                }}
              >
                <Icon
                  className="w-7 h-7"
                  style={{
                    color: dataset.color,
                    filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                  }}
                />
              </div>

              {/* Activity badge */}
              {activityCount > 0 && (
                <div className="node-badge">
                  {activityCount}
                </div>
              )}

              {/* Label */}
              <div className="node-label" style={{ color: dataset.color }}>
                {dataset.shortName}
              </div>
            </div>
          </div>
        );
      })}

      {/* Stats Panel */}
      {showStats && (
        <div className="network-stats">
          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
              <Activity className="w-4 h-4" style={{ color: '#f97316' }} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active</span>
              <span className="stat-value">
                <AnimatedNumber value={activeDatasets.length} />/
                {Object.keys(DATASET_CONFIG).length}
              </span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
              <Zap className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Queries</span>
              <span className="stat-value">
                <AnimatedNumber value={queryActivity.length} />
              </span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
              <Target className="w-4 h-4" style={{ color: '#22c55e' }} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Hit Rate</span>
              <span className="stat-value">
                <AnimatedNumber value={hitRate} suffix="%" />
              </span>
            </div>
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
};

/**
 * Compact Dataset Activity Indicator
 */
export const DatasetActivityIndicator = ({ activeDatasets = [], lastQuery }) => {
  return (
    <div className="dataset-activity-indicator">
      <style>{`
        .dataset-activity-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .activity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .activity-dot.pulse {
          animation: dot-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        
        .activity-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-left: 4px;
          font-weight: 500;
        }
      `}</style>

      {Object.values(DATASET_CONFIG).map(dataset => {
        const isActive = activeDatasets.includes(dataset.id);
        const wasQueried = lastQuery?.datasetId === dataset.id;
        const Icon = dataset.icon;

        return (
          <div
            key={dataset.id}
            className="flex items-center gap-1"
            title={dataset.name}
          >
            <div
              className={`activity-dot ${wasQueried ? 'pulse' : ''}`}
              style={{
                background: isActive ? dataset.color : 'rgba(100, 116, 139, 0.3)',
                boxShadow: isActive ? `0 0 8px ${dataset.glowColor}` : 'none'
              }}
            />
            <Icon
              className="w-3.5 h-3.5"
              style={{
                color: isActive ? dataset.color : 'var(--color-text-muted)',
                opacity: isActive ? 1 : 0.4
              }}
            />
          </div>
        );
      })}

      <span className="activity-label">
        {lastQuery ? `→ ${DATASET_CONFIG[lastQuery.datasetId]?.shortName}` : 'Ready'}
      </span>
    </div>
  );
};

export default DatasetNetworkGraph;