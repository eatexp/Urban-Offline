/**
 * Intent Classification Visualizer - Enhanced Edition
 * 
 * Shows the hybrid ML/keyword classification process with:
 * - Circular confidence gauges
 * - Animated "battle" between ML and Keywords
 * - Winner celebration effect
 * - Matched keyword highlighting
 * - Route destination animation
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Sparkles,
  ArrowRight,
  Trophy,
  MessageSquare,
  AlertCircle,
  FileText,
  Compass,
  Zap,
  Target
} from 'lucide-react';
import {
  GlassmorphismCard,
  AnimatedNumber,
  CircularProgress
} from './VisualizationEffects';

// Route configuration
const ROUTE_CONFIG = {
  triage: {
    id: 'triage',
    label: 'Triage',
    icon: AlertCircle,
    color: '#ef4444',
    description: 'Medical emergency assessment'
  },
  protocol: {
    id: 'protocol',
    label: 'Protocol',
    icon: FileText,
    color: '#f97316',
    description: 'Step-by-step procedure'
  },
  search: {
    id: 'search',
    label: 'Search',
    icon: Compass,
    color: '#3b82f6',
    description: 'Knowledge search'
  },
  chat: {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    color: '#8b5cf6',
    description: 'General AI chat'
  }
};

/**
 * Enhanced Intent Classification Visualizer
 */
const IntentClassificationViz = ({
  isActive = false,
  mlResult = null,
  keywordResult = null,
  finalResult = null,
  matchedKeywords = [],
  query = '',
  compact = false
}) => {
  const [showWinner, setShowWinner] = useState(false);
  const [particles, setParticles] = useState([]);

  // Trigger winner celebration
  useEffect(() => {
    if (finalResult && !isActive) {
      setShowWinner(true);

      // Create celebration particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * 360,
        delay: i * 0.05
      }));
      setParticles(newParticles);

      // Reset after animation
      const timer = setTimeout(() => {
        setShowWinner(false);
        setParticles([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [finalResult, isActive]);

  const winner = finalResult?.method || null;
  const finalRoute = finalResult?.route || null;

  if (compact) {
    return <CompactIntentView
      mlResult={mlResult}
      keywordResult={keywordResult}
      finalResult={finalResult}
      isActive={isActive}
    />;
  }

  return (
    <GlassmorphismCard
      className="intent-viz"
      glow={isActive ? 'purple' : null}
    >
      <style>{`
        .intent-viz {
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        /* Header */
        .intent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .intent-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .intent-title h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }
        
        /* Battle arena */
        .classification-arena {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        /* Classifier card */
        .classifier-card {
          flex: 1;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .classifier-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        
        .classifier-card.active {
          border-color: currentColor;
          box-shadow: 0 0 30px currentColor;
        }
        
        .classifier-card.winner {
          animation: winner-glow 0.5s ease forwards;
        }
        
        @keyframes winner-glow {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .classifier-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
        }
        
        .classifier-label {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .gauge-container {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }
        
        .confidence-value {
          font-size: 18px;
          font-weight: 700;
          font-family: var(--font-family-mono);
        }
        
        .category-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* VS divider */
        .vs-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 0 8px;
        }
        
        .vs-text {
          font-size: 11px;
          font-weight: 800;
          color: var(--color-text-muted);
          background: rgba(255,255,255,0.05);
          padding: 6px 12px;
          border-radius: 20px;
        }
        
        .vs-lightning {
          animation: vs-pulse 1s ease-in-out infinite;
        }
        
        @keyframes vs-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Winner badge */
        .winner-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
          animation: badge-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes badge-bounce {
          0% { transform: scale(0) rotate(-20deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        /* Celebration particles */
        .celebration-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: particle-burst 1s ease-out forwards;
        }
        
        @keyframes particle-burst {
          0% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% { 
            transform: translate(
              calc(-50% + var(--tx)),
              calc(-50% + var(--ty))
            ) scale(1);
            opacity: 0;
          }
        }
        
        /* Matched keywords */
        .keywords-section {
          margin-bottom: 16px;
        }
        
        .keywords-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        
        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .keyword-chip {
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          color: #a78bfa;
          animation: chip-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes chip-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        
        /* Route result */
        .route-result {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        
        .route-arrow {
          color: var(--color-text-muted);
          animation: arrow-pulse 1s ease-in-out infinite;
        }
        
        @keyframes arrow-pulse {
          0%, 100% { opacity: 0.5; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(4px); }
        }
        
        .route-destination {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 2px solid;
          transition: all 0.3s ease;
        }
        
        .route-destination.final {
          animation: route-glow 0.5s ease forwards;
        }
        
        @keyframes route-glow {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .route-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .route-label {
          font-size: 14px;
          font-weight: 700;
        }
        
        .route-desc {
          font-size: 10px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }
        
        /* Urgency meter */
        .urgency-meter {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .urgency-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          min-width: 50px;
        }
        
        .urgency-bar {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .urgency-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        
        .urgency-value {
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-family-mono);
          min-width: 30px;
          text-align: right;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .vs-lightning, .route-arrow, .classifier-card.active,
          .winner-badge, .celebration-particle, .keyword-chip {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="intent-header">
        <div className="intent-title">
          <Target className="w-4 h-4" style={{ color: '#8b5cf6' }} />
          <h3>Intent Classification</h3>
        </div>
        {isActive && (
          <Sparkles
            className="w-4 h-4 animate-spin"
            style={{ color: '#8b5cf6', animationDuration: '2s' }}
          />
        )}
      </div>

      {/* Classification Arena */}
      <div className="classification-arena">
        {/* ML Classifier */}
        <div
          className={`classifier-card ${isActive && !keywordResult ? 'active' : ''} ${winner === 'ml' ? 'winner' : ''}`}
          style={{ color: '#8b5cf6' }}
        >
          {winner === 'ml' && (
            <>
              <div className="winner-badge">
                <Trophy className="w-4 h-4" style={{ color: 'white' }} />
              </div>
              {/* Celebration particles */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className="celebration-particle"
                  style={{
                    background: '#8b5cf6',
                    top: '50%',
                    left: '50%',
                    '--tx': `${Math.cos(p.angle * Math.PI / 180) * 60}px`,
                    '--ty': `${Math.sin(p.angle * Math.PI / 180) * 60}px`,
                    animationDelay: `${p.delay}s`
                  }}
                />
              ))}
            </>
          )}

          <div className="classifier-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
            <Brain className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          </div>
          <div className="classifier-label" style={{ color: '#8b5cf6' }}>ML Model</div>

          <div className="gauge-container">
            <CircularProgress
              progress={mlResult?.confidence || 0}
              size={70}
              strokeWidth={5}
              color="#8b5cf6"
            >
              <span className="confidence-value" style={{ color: '#8b5cf6' }}>
                {mlResult?.confidence || 0}%
              </span>
            </CircularProgress>
          </div>

          {mlResult?.category && (
            <div className="category-badge" style={{ color: '#a78bfa' }}>
              {mlResult.category}
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <Zap
            className={`w-5 h-5 vs-lightning ${isActive ? '' : 'opacity-30'}`}
            style={{ color: '#fbbf24' }}
          />
          <span className="vs-text">VS</span>
        </div>

        {/* Keyword Classifier */}
        <div
          className={`classifier-card ${isActive && !mlResult ? 'active' : ''} ${winner === 'keyword' ? 'winner' : ''}`}
          style={{ color: '#f97316' }}
        >
          {winner === 'keyword' && (
            <>
              <div className="winner-badge">
                <Trophy className="w-4 h-4" style={{ color: 'white' }} />
              </div>
              {particles.map(p => (
                <div
                  key={p.id}
                  className="celebration-particle"
                  style={{
                    background: '#f97316',
                    top: '50%',
                    left: '50%',
                    '--tx': `${Math.cos(p.angle * Math.PI / 180) * 60}px`,
                    '--ty': `${Math.sin(p.angle * Math.PI / 180) * 60}px`,
                    animationDelay: `${p.delay}s`
                  }}
                />
              ))}
            </>
          )}

          <div className="classifier-icon" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
            <Search className="w-5 h-5" style={{ color: '#f97316' }} />
          </div>
          <div className="classifier-label" style={{ color: '#f97316' }}>Keywords</div>

          <div className="gauge-container">
            <CircularProgress
              progress={keywordResult?.confidence || 0}
              size={70}
              strokeWidth={5}
              color="#f97316"
            >
              <span className="confidence-value" style={{ color: '#f97316' }}>
                {keywordResult?.confidence || 0}%
              </span>
            </CircularProgress>
          </div>

          {keywordResult?.category && (
            <div className="category-badge" style={{ color: '#fb923c' }}>
              {keywordResult.category}
            </div>
          )}
        </div>
      </div>

      {/* Matched Keywords */}
      {matchedKeywords.length > 0 && (
        <div className="keywords-section">
          <div className="keywords-label">Matched Keywords</div>
          <div className="keywords-list">
            {matchedKeywords.map((keyword, i) => (
              <span
                key={keyword}
                className="keyword-chip"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Routing Result */}
      {finalRoute && (
        <div className="route-result">
          <span className="route-arrow">
            <ArrowRight className="w-5 h-5" />
          </span>

          <RouteDestination route={finalRoute} isFinal={!isActive} />
        </div>
      )}

      {/* Urgency Meter */}
      {finalResult?.urgency !== undefined && (
        <UrgencyMeter urgency={finalResult.urgency} />
      )}
    </GlassmorphismCard>
  );
};

/**
 * Route destination badge
 */
const RouteDestination = ({ route, isFinal }) => {
  const config = ROUTE_CONFIG[route];
  if (!config) return null;

  const RouteIcon = config.icon;

  return (
    <div
      className={`route-destination ${isFinal ? 'final' : ''}`}
      style={{
        borderColor: config.color,
        background: `${config.color}15`
      }}
    >
      <div
        className="route-icon"
        style={{ background: `${config.color}30` }}
      >
        <RouteIcon className="w-5 h-5" style={{ color: config.color }} />
      </div>
      <div>
        <div className="route-label" style={{ color: config.color }}>
          {config.label}
        </div>
        <div className="route-desc">{config.description}</div>
      </div>
    </div>
  );
};

/**
 * Urgency level meter
 */
const UrgencyMeter = ({ urgency }) => {
  const getUrgencyColor = () => {
    if (urgency >= 0.7) return '#ef4444';
    if (urgency >= 0.4) return '#f97316';
    return '#22c55e';
  };

  const color = getUrgencyColor();
  const percent = Math.round(urgency * 100);

  return (
    <div className="urgency-meter">
      <span className="urgency-label">Urgency</span>
      <div className="urgency-bar">
        <div
          className="urgency-fill"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`
          }}
        />
      </div>
      <span className="urgency-value" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
};

/**
 * Compact view
 */
const CompactIntentView = ({ mlResult, keywordResult, finalResult, isActive }) => {
  const winner = finalResult?.method;
  const route = finalResult?.route;
  const config = route ? ROUTE_CONFIG[route] : null;
  const RouteIcon = config?.icon;

  return (
    <div className="intent-compact">
      <style>{`
        .intent-compact {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .compact-classifier {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .compact-bar {
          width: 40px;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .compact-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .compact-vs {
          font-size: 8px;
          font-weight: 700;
          color: var(--color-text-muted);
          padding: 0 4px;
        }
        
        .compact-arrow {
          color: var(--color-text-muted);
          margin: 0 4px;
        }
        
        .compact-route {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid;
        }
        
        .compact-route-label {
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>

      {/* ML indicator */}
      <div className="compact-classifier">
        <Brain className="w-3.5 h-3.5" style={{ color: winner === 'ml' ? '#8b5cf6' : 'var(--color-text-muted)' }} />
        <div className="compact-bar">
          <div
            className="compact-bar-fill"
            style={{
              width: `${mlResult?.confidence || 0}%`,
              background: '#8b5cf6'
            }}
          />
        </div>
      </div>

      <span className="compact-vs">VS</span>

      {/* Keyword indicator */}
      <div className="compact-classifier">
        <Search className="w-3.5 h-3.5" style={{ color: winner === 'keyword' ? '#f97316' : 'var(--color-text-muted)' }} />
        <div className="compact-bar">
          <div
            className="compact-bar-fill"
            style={{
              width: `${keywordResult?.confidence || 0}%`,
              background: '#f97316'
            }}
          />
        </div>
      </div>

      {/* Route result */}
      {config && (
        <>
          <ArrowRight className="w-3.5 h-3.5 compact-arrow" />
          <div
            className="compact-route"
            style={{
              borderColor: config.color,
              background: `${config.color}15`
            }}
          >
            <RouteIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
            <span className="compact-route-label" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default IntentClassificationViz;