/**
 * Shared Visualization Effects Library
 * 
 * Reusable visual components for AI data flow visualizations:
 * - Glassmorphism containers
 * - Particle systems
 * - Animated numbers
 * - Glow effects
 * - Floating animations
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// SVG FILTERS - Reusable glow and blur effects
// ============================================================================

/**
 * SVG Definitions for glow effects - include once in parent SVG
 */
export const GlowFilters = () => (
    <defs>
        {/* Standard glow */}
        {/* Standard glow - Tighter/Sharper */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        {/* Intense glow for active elements */}
        <filter id="glow-intense" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        {/* Soft ambient glow */}
        <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" />
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        {/* Animated gradient for beams */}
        <linearGradient id="beam-gradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0">
                <animate attributeName="offset" values="-0.5;1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="var(--color-primary-400)" stopOpacity="1">
                <animate attributeName="offset" values="0;1.5" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="var(--color-accent-purple)" stopOpacity="0">
                <animate attributeName="offset" values="0.5;2" dur="2s" repeatCount="indefinite" />
            </stop>
        </linearGradient>
    </defs>
);

// ============================================================================
// GLASSMORPHISM CARD
// ============================================================================

const glassStyles = `
  .glass-card {
    background: rgba(9, 9, 11, 0.95); /* Zinc-950, almost opaque */
    backdrop-filter: blur(8px); /* Moderate blur */
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Dark subtle border */
    border-radius: var(--radius-lg);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.03); /* Fainter inner highlight */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .glass-card:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 
      0 10px 15px -3px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .glass-card.glow-primary {
    box-shadow: 
      0 0 0 1px rgba(249, 115, 22, 0.15), /* Precision border glow */
      0 4px 12px -2px rgba(0, 0, 0, 0.5);
  }
  
  .glass-card.glow-purple {
    box-shadow: 
      0 0 0 1px rgba(139, 92, 246, 0.15),
      0 4px 12px -2px rgba(0, 0, 0, 0.5);
  }
  
  .glass-card.glow-success {
    box-shadow: 
      0 0 0 1px rgba(34, 197, 94, 0.15),
      0 4px 12px -2px rgba(0, 0, 0, 0.5);
  }
`;

export const GlassmorphismCard = ({
    children,
    className = '',
    glow = null, // 'primary', 'purple', 'success'
    style = {},
    ...props
}) => {
    return (
        <>
            <style>{glassStyles}</style>
            <div
                className={`glass-card ${glow ? `glow-${glow}` : ''} ${className}`}
                style={style}
                {...props}
            >
                {children}
            </div>
        </>
    );
};

// ============================================================================
// ANIMATED NUMBER - Count up animation
// ============================================================================

export const AnimatedNumber = ({
    value,
    duration = 500,
    suffix = '',
    prefix = '',
    decimals = 0
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (endValue - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span style={{ fontFamily: 'var(--font-family-mono)' }}>
            {prefix}{displayValue.toFixed(decimals)}{suffix}
        </span>
    );
};

// ============================================================================
// PULSE RING - Expanding ring animation
// ============================================================================

const pulseRingStyles = `
  .pulse-ring-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .pulse-ring {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 2px solid currentColor;
    opacity: 0;
    animation: pulse-ring-expand 1.5s ease-out forwards;
  }
  
  @keyframes pulse-ring-expand {
    0% {
      transform: scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }
`;

export const PulseRing = ({ color = 'var(--color-primary-500)', count = 1 }) => {
    return (
        <>
            <style>{pulseRingStyles}</style>
            <div className="pulse-ring-container">
                {[...Array(count)].map((_, i) => (
                    <div
                        key={i}
                        className="pulse-ring"
                        style={{
                            color,
                            animationDelay: `${i * 0.3}s`
                        }}
                    />
                ))}
            </div>
        </>
    );
};

// ============================================================================
// FLOATING ELEMENT - Subtle floating animation wrapper
// ============================================================================

const floatingStyles = `
  .floating-element {
    animation: float 4s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  .floating-element.subtle {
    animation-name: float-subtle;
  }
  
  @keyframes float-subtle {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .floating-element {
      animation: none;
    }
  }
`;

export const FloatingElement = ({
    children,
    delay = 0,
    duration = 4,
    subtle = false,
    className = '',
    style = {}
}) => {
    return (
        <>
            <style>{floatingStyles}</style>
            <div
                className={`floating-element ${subtle ? 'subtle' : ''} ${className}`}
                style={{
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    ...style
                }}
            >
                {children}
            </div>
        </>
    );
};

// ============================================================================
// PARTICLE SYSTEM - Animated particles
// ============================================================================

const particleStyles = `
  .particle-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    border-radius: 50%;
    filter: blur(0.5px);
  }
  
  @keyframes particle-float {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
  }
  
  @keyframes particle-drift {
    0% { transform: translateX(-50px); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 0.8; }
    100% { transform: translateX(50px); opacity: 0; }
  }
`;

export const ParticleSystem = ({
    count = 5,
    color = 'var(--color-primary-400)',
    size = 4,
    speed = 3,
    direction = 'up', // 'up', 'horizontal'
    active = true
}) => {
    // Use deterministic pseudo-random based on index instead of Math.random()
    const particles = useMemo(() => {
        return [...Array(count)].map((_, i) => ({
            id: i,
            x: ((i * 17) % 100), // Deterministic pseudo-random
            y: ((i * 31) % 100), // Deterministic pseudo-random
            size: size * (0.5 + ((i * 7) % 10) / 10), // Deterministic variation
            delay: (i / count) * speed,
            duration: speed * (0.8 + ((i * 3) % 10) / 25) // Deterministic variation
        }));
    }, [count, size, speed]);

    if (!active) return null;

    return (
        <>
            <style>{particleStyles}</style>
            <div className="particle-container">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="particle"
                        style={{
                            left: `${p.x}%`,
                            top: direction === 'up' ? `${p.y}%` : '50%',
                            width: p.size,
                            height: p.size,
                            background: color,
                            boxShadow: `0 0 ${p.size * 2}px ${color}`,
                            animation: `${direction === 'up' ? 'particle-float' : 'particle-drift'} ${p.duration}s ease-in-out infinite`,
                            animationDelay: `${p.delay}s`
                        }}
                    />
                ))}
            </div>
        </>
    );
};

// ============================================================================
// CIRCULAR PROGRESS - Animated circular gauge
// ============================================================================

const circularProgressStyles = `
  .circular-progress {
    transform: rotate(-90deg);
  }
  
  .circular-progress-bg {
    fill: none;
    stroke: var(--color-bg-tertiary);
  }
  
  .circular-progress-fill {
    fill: none;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
  }
  
  .circular-progress-glow {
    fill: none;
    stroke-linecap: round;
    filter: blur(4px);
    opacity: 0.5;
  }
`;

export const CircularProgress = ({
    progress = 0,
    size = 60,
    strokeWidth = 4,
    color = 'var(--color-primary-500)',
    showGlow = true,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <>
            <style>{circularProgressStyles}</style>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg
                    className="circular-progress"
                    width={size}
                    height={size}
                >
                    {/* Background circle */}
                    <circle
                        className="circular-progress-bg"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />

                    {/* Glow layer */}
                    {showGlow && (
                        <circle
                            className="circular-progress-glow"
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            strokeWidth={strokeWidth + 4}
                            stroke={color}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    )}

                    {/* Progress circle */}
                    <circle
                        className="circular-progress-fill"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        stroke={color}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>

                {/* Center content */}
                {children && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {children}
                    </div>
                )}
            </div>
        </>
    );
};

// ============================================================================
// DATA BEAM - Animated connection line
// ============================================================================

const dataBeamStyles = `
  @keyframes beam-flow {
    0% { stroke-dashoffset: 20; }
    100% { stroke-dashoffset: 0; }
  }
  
  @keyframes beam-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

export const DataBeam = ({
    x1, y1, x2, y2,
    color = 'var(--color-primary-500)',
    active = false,
    animated = true
}) => {
    return (
        <>
            <style>{dataBeamStyles}</style>
            <g>
                {/* Glow layer */}
                <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={6}
                    strokeLinecap="round"
                    opacity={0.2}
                    filter="url(#glow-soft)"
                />

                {/* Main line */}
                <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={animated ? "8 4" : "none"}
                    style={{
                        animation: active && animated ? 'beam-flow 0.5s linear infinite, beam-pulse 2s ease-in-out infinite' : 'none',
                        opacity: active ? 1 : 0.4
                    }}
                />
            </g>
        </>
    );
};

// ============================================================================
// SHIMMER EFFECT
// ============================================================================

const shimmerStyles = `
  .shimmer {
    position: relative;
    overflow: hidden;
  }
  
  .shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: shimmer-slide 2s infinite;
  }
  
  @keyframes shimmer-slide {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

export const Shimmer = ({ children, className = '', active = true }) => {
    return (
        <>
            <style>{shimmerStyles}</style>
            <div className={`${active ? 'shimmer' : ''} ${className}`}>
                {children}
            </div>
        </>
    );
};

// ============================================================================
// 3D TILT CARD
// ============================================================================

const tiltStyles = `
  .tilt-card {
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
  }
  
  .tilt-card:hover {
    transform: perspective(1000px) rotateX(var(--rotateX, 0deg)) rotateY(var(--rotateY, 0deg));
  }
  
  .tilt-card-inner {
    transform: translateZ(20px);
  }
`;

export const TiltCard = ({ children, className = '', intensity = 10 }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;

        cardRef.current.style.setProperty('--rotateX', `${rotateX}deg`);
        cardRef.current.style.setProperty('--rotateY', `${rotateY}deg`);
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.setProperty('--rotateX', '0deg');
        cardRef.current.style.setProperty('--rotateY', '0deg');
    };

    return (
        <>
            <style>{tiltStyles}</style>
            <div
                ref={cardRef}
                className={`tilt-card ${className}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        </>
    );
};

// Export all components
export default {
    GlowFilters,
    GlassmorphismCard,
    AnimatedNumber,
    PulseRing,
    FloatingElement,
    ParticleSystem,
    CircularProgress,
    DataBeam,
    Shimmer,
    TiltCard
};
