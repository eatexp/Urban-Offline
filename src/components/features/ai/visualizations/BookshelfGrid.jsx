import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

const SPINE_COLORS = [
  '#6366f1', '#8b5cf6', '#3b82f6', '#0891b2',
  '#059669', '#d97706', '#dc2626', '#db2777'
];

// Category color mapping
const CATEGORY_COLORS = {
  health: '#ef4444',
  medical: '#ef4444',
  survival: '#f97316',
  emergency: '#f97316',
  law: '#8b5cf6',
  legal: '#8b5cf6',
  default: '#6366f1'
};

const styles = `
  .bookshelf {
    position: relative;
    padding: 12px;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.08) 100%);
    border: 1px solid rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .bookshelf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .bookshelf-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-tertiary, #94a3b8);
  }

  .bookshelf-label svg {
    width: 12px;
    height: 12px;
  }

  .bookshelf-label.active {
    color: #6366f1;
  }

  .bookshelf-label.complete {
    color: #22c55e;
  }

  .source-count {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }

  .source-count.found {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  .bookshelf-row {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 60px;
    padding: 0 4px 4px;
    border-bottom: 2px solid rgba(0,0,0,0.08);
    position: relative;
  }

  .book-spine {
    flex: 1;
    min-width: 18px;
    max-width: 36px;
    height: 100%;
    border-radius: 2px 2px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    cursor: default;
  }

  .book-spine-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 7px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 50px;
    letter-spacing: 0.3px;
  }

  .book-spine.idle {
    opacity: 0.7;
  }

  @keyframes spine-breathe {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0.85; }
  }

  .book-spine.breathing {
    animation: spine-breathe 3s ease-in-out infinite;
  }

  .book-spine.scanning {
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .book-spine.hit {
    opacity: 1;
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  @keyframes spine-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    50% { box-shadow: 0 0 12px 2px rgba(255,255,255,0.3); }
  }

  .book-spine.hit {
    animation: spine-pulse 1s ease-in-out 2;
  }

  /* Spotlight beam */
  .bookshelf-spotlight {
    position: absolute;
    top: 0;
    width: 40px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    pointer-events: none;
    z-index: 2;
    border-radius: 4px;
  }

  @keyframes spotlight-sweep {
    0% { left: -40px; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { left: calc(100% + 40px); opacity: 0; }
  }

  .bookshelf-spotlight.active {
    animation: spotlight-sweep 1.2s ease-in-out forwards;
  }

  .category-legend {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .category-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .category-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
`;

export default function BookshelfGrid({ sources = [], stage = 'idle', hitIndices = [] }) {
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [scannedIndex, setScannedIndex] = useState(-1);

  // Determine label text and state based on stage
  const getLabelInfo = () => {
    switch (stage) {
      case 'retrieval':
        return { text: 'Searching your content...', icon: Search, className: 'active' };
      case 'context':
      case 'generation':
        return { text: 'Found in your library', icon: CheckCircle, className: 'complete' };
      default:
        return { text: 'Your Library', icon: BookOpen, className: '' };
    }
  };

  const labelInfo = getLabelInfo();
  const LabelIcon = labelInfo.icon;

  // Extract unique categories from sources
  const categories = useMemo(() => {
    const cats = new Set();
    sources.forEach(s => {
      if (s.category) cats.add(s.category.toLowerCase());
    });
    return Array.from(cats).slice(0, 3); // Max 3 categories
  }, [sources]);

  const spines = useMemo(() => {
    if (sources.length === 0) {
      // Show placeholder spines with deterministic heights
      return Array.from({ length: 8 }, (_, i) => ({
        title: ['Medical', 'Survival', 'Legal', 'First Aid', 'Shelter', 'Water', 'Navigation', 'Signals'][i],
        color: SPINE_COLORS[i % SPINE_COLORS.length],
        height: 40 + ((i * 7) % 20), // Deterministic pseudo-random instead of Math.random()
        category: ['health', 'survival', 'law', 'health', 'survival', 'survival', 'survival', 'survival'][i]
      }));
    }
    return sources.map((s) => {
      const cat = (s.category || '').toLowerCase();
      const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
      return {
        title: s.title || 'Untitled',
        color: catColor,
        height: 40 + Math.min(s.score || 0, 1) * 20,
        category: cat
      };
    });
  }, [sources]);

  // Trigger spotlight scan animation
  useEffect(() => {
    if (stage === 'retrieval') {
      queueMicrotask(() => {
        setSpotlightActive(true);
        setScannedIndex(-1);
      });

      // Scan through spines sequentially
      const interval = 1200 / spines.length;
      spines.forEach((_, i) => {
        setTimeout(() => setScannedIndex(i), interval * i);
      });

      // Mark scan complete
      const totalTime = 1200;
      const timer = setTimeout(() => {
        queueMicrotask(() => {
          setScannedIndex(spines.length);
          setSpotlightActive(false);
        });
      }, totalTime);

      return () => clearTimeout(timer);
    }
  }, [stage, spines]);

  function getSpineClass(index) {
    if (stage === 'idle' || stage === 'intent') return 'breathing';
    if (stage === 'retrieval') {
      if (hitIndices.includes(index) && scannedIndex >= index) return 'hit';
      if (scannedIndex >= index) return 'scanning';
      return 'idle';
    }
    // context or generation stage - keep hits highlighted
    if (hitIndices.includes(index)) return 'hit';
    return 'scanning';
  }

  const foundCount = hitIndices.length;

  return (
    <>
      <style>{styles}</style>
      <div className="bookshelf">
        <div className="bookshelf-header">
          <div className={`bookshelf-label ${labelInfo.className}`}>
            <LabelIcon />
            {labelInfo.text}
          </div>
          {(stage === 'context' || stage === 'generation') && foundCount > 0 && (
            <span className="source-count found">
              {foundCount} source{foundCount > 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <div className="bookshelf-row">
          {spotlightActive && <div className="bookshelf-spotlight active" />}
          {spines.map((spine, i) => (
            <div
              key={i}
              className={`book-spine ${getSpineClass(i)}`}
              style={{
                background: spine.color,
                height: `${spine.height}px`
              }}
              title={spine.title}
            >
              <span className="book-spine-text">{spine.title}</span>
            </div>
          ))}
        </div>
        {/* Category legend when sources are found */}
        {(stage === 'context' || stage === 'generation') && categories.length > 0 && (
          <div className="category-legend">
            {categories.map(cat => (
              <span key={cat} className="category-tag">
                <span
                  className="category-dot"
                  style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.default }}
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
