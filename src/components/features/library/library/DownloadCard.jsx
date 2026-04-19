import React from 'react';
import { Download, Check, Trash2, Loader, Cpu, BookOpen, Zap, Sparkles } from 'lucide-react';

const styles = `
  .dl-card {
    position: relative;
    background: rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    padding: 16px;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .dl-card:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
  }

  .dl-card.active {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 20px rgba(16, 185, 129, 0.1);
  }

  .dl-card.bundled {
    border-color: rgba(16, 185, 129, 0.25);
    background: rgba(16, 185, 129, 0.03);
  }

  .dl-card-bundled-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  .dl-card-article-count {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary, #64748b);
  }

  .dl-card-ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    animation: dl-ai-pulse 2s ease-in-out infinite;
  }

  @keyframes dl-ai-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .dl-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }

  .dl-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dl-card-icon.content {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }

  .dl-card-icon.model {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .dl-card-info {
    flex: 1;
    min-width: 0;
  }

  .dl-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    margin: 0 0 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dl-card-desc {
    font-size: 12px;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dl-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .dl-card-tag {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(99, 102, 241, 0.08);
    color: #6366f1;
  }

  .dl-card-tag.emerald {
    background: rgba(16, 185, 129, 0.08);
    color: #10b981;
  }

  .dl-card-size {
    font-size: 11px;
    color: var(--color-text-tertiary, #94a3b8);
    font-weight: 500;
  }

  .dl-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }

  .dl-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
  }

  .dl-card-btn.primary {
    background: #6366f1;
    color: white;
  }

  .dl-card-btn.primary:hover {
    background: #4f46e5;
  }

  .dl-card-btn.primary:active {
    transform: scale(0.97);
  }

  .dl-card-btn.emerald {
    background: #10b981;
    color: white;
  }

  .dl-card-btn.emerald:hover {
    background: #059669;
  }

  .dl-card-btn.danger {
    background: transparent;
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    flex: 0;
    padding: 8px;
  }

  .dl-card-btn.danger:hover {
    background: rgba(239, 68, 68, 0.05);
  }

  .dl-card-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dl-card-progress {
    margin-top: 12px;
  }

  .dl-card-progress-track {
    height: 6px;
    background: var(--color-bg-tertiary, #e2e8f0);
    border-radius: 3px;
    overflow: hidden;
  }

  .dl-card-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #818cf8);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .dl-card-progress-fill.emerald {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  .dl-card-progress-label {
    font-size: 11px;
    color: var(--color-text-secondary, #64748b);
    margin-top: 4px;
    text-align: center;
  }

  .dl-card-warning {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #f59e0b;
    margin-top: 6px;
  }

  @keyframes dl-spin {
    to { transform: rotate(360deg); }
  }

  .dl-card-spinner {
    animation: dl-spin 1s linear infinite;
  }
`;

// status: 'available' | 'downloading' | 'ready' | 'active' | 'bundled'
export default function DownloadCard({
  title,
  description,
  sizeDisplay,
  status = 'available',
  progress = 0,
  progressMessage = '',
  onDownload,
  onDelete,
  onActivate,
  tags = [],
  type = 'content', // 'content' | 'model'
  warning = null,
  articleCount = 0,
  className = ''
}) {
  const IconComponent = type === 'model' ? Cpu : BookOpen;
  const colorClass = type === 'model' ? 'emerald' : '';
  const cardClass = status === 'active' ? 'active' : status === 'bundled' ? 'bundled' : '';

  return (
    <>
      <style>{styles}</style>
      <div className={`dl-card ${cardClass} ${className}`}>
        <div className="dl-card-header">
          <div className={`dl-card-icon ${type}`}>
            <IconComponent size={20} />
          </div>
          <div className="dl-card-info">
            <h4 className="dl-card-title">{title}</h4>
            <p className="dl-card-desc">{description}</p>
          </div>
        </div>

        <div className="dl-card-meta">
          {status === 'bundled' && (
            <span className="dl-card-bundled-badge">
              <Check size={10} />
              Pre-installed
            </span>
          )}
          {/* AI access badge for installed content */}
          {type === 'content' && (status === 'ready' || status === 'bundled') && (
            <span className="dl-card-ai-badge">
              <Sparkles size={10} />
              AI can access
            </span>
          )}
          {articleCount > 0 && (
            <span className="dl-card-article-count">{articleCount} articles</span>
          )}
          {tags.map((tag, i) => (
            <span key={i} className={`dl-card-tag ${type === 'model' ? 'emerald' : ''}`}>
              {tag}
            </span>
          ))}
          {sizeDisplay && <span className="dl-card-size">{sizeDisplay}</span>}
        </div>

        {warning && (
          <div className="dl-card-warning">
            <Zap size={12} />
            {warning}
          </div>
        )}

        {status === 'downloading' && (
          <div className="dl-card-progress">
            <div className="dl-card-progress-track">
              <div
                className={`dl-card-progress-fill ${colorClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progressMessage && (
              <div className="dl-card-progress-label">{progressMessage}</div>
            )}
          </div>
        )}

        <div className="dl-card-actions">
          {status === 'available' && (
            <button className={`dl-card-btn ${type === 'model' ? 'emerald' : 'primary'}`} onClick={onDownload}>
              <Download size={14} />
              Download
            </button>
          )}

          {status === 'downloading' && (
            <button className="dl-card-btn primary" disabled>
              <Loader size={14} className="dl-card-spinner" />
              {Math.round(progress)}%
            </button>
          )}

          {status === 'bundled' && (
            <button className="dl-card-btn emerald" disabled>
              <Check size={14} />
              Installed
            </button>
          )}

          {status === 'ready' && (
            <>
              {type === 'model' && onActivate && (
                <button className="dl-card-btn emerald" onClick={onActivate}>
                  <Zap size={14} />
                  Activate
                </button>
              )}
              {!onActivate && (
                <button className="dl-card-btn primary" disabled>
                  <Check size={14} />
                  Installed
                </button>
              )}
              {onDelete && (
                <button aria-label="Delete" title="Delete" className="dl-card-btn danger" onClick={onDelete}>
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}

          {status === 'active' && (
            <>
              <button className="dl-card-btn emerald" disabled>
                <Check size={14} />
                Active
              </button>
              {onDelete && (
                <button aria-label="Delete" title="Delete" className="dl-card-btn danger" onClick={onDelete}>
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
