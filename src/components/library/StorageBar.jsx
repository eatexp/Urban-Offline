import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const styles = `
  .storage-bar {
    padding: 12px 16px;
    background: var(--color-bg-secondary, #f8fafc);
    border-radius: 12px;
    border: 1px solid var(--color-border, rgba(0,0,0,0.06));
  }

  .storage-bar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .storage-bar-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
  }

  .storage-bar-badge {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    background: var(--color-bg-tertiary, #e2e8f0);
    padding: 2px 8px;
    border-radius: 20px;
  }

  .storage-bar-track {
    height: 8px;
    background: var(--color-bg-tertiary, #e2e8f0);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }

  .storage-bar-segment {
    height: 100%;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .storage-bar-segment.content {
    background: #6366f1;
    border-radius: 4px 0 0 4px;
  }

  .storage-bar-segment.models {
    background: #10b981;
  }

  .storage-bar-segment.other {
    background: #94a3b8;
    border-radius: 0 4px 4px 0;
  }

  .storage-bar-legend {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .storage-bar-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-secondary, #64748b);
  }

  .storage-bar-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
`;

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StorageBar({ contentBytes = 0, modelBytes = 0, className = '' }) {
    const [quota, setQuota] = useState({ usage: 0, quota: 1 });

    useEffect(() => {
        async function estimate() {
            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const est = await navigator.storage.estimate();
                    setQuota({ usage: est.usage || 0, quota: est.quota || 1 });
                }
            } catch (_) {
                // fallback
            }
        }
        estimate();
    }, [contentBytes, modelBytes]);

    const totalUsed = quota.usage;
    const totalQuota = quota.quota;
    const otherBytes = Math.max(0, totalUsed - contentBytes - modelBytes);

    const contentPct = (contentBytes / totalQuota) * 100;
    const modelPct = (modelBytes / totalQuota) * 100;
    const otherPct = (otherBytes / totalQuota) * 100;

    return (
        <>
            <style>{styles}</style>
            <div className={`storage-bar ${className}`}>
                <div className="storage-bar-header">
                    <span className="storage-bar-label">Device Storage</span>
                    <span className="storage-bar-badge">
                        {formatBytes(totalUsed)} / {formatBytes(totalQuota)}
                    </span>
                </div>
                <div className="storage-bar-track">
                    <div className="storage-bar-segment content" style={{ width: `${contentPct}%` }} />
                    <div className="storage-bar-segment models" style={{ width: `${modelPct}%` }} />
                    {otherPct > 0.1 && (
                        <div className="storage-bar-segment other" style={{ width: `${otherPct}%` }} />
                    )}
                </div>
                <div className="storage-bar-legend">
                    <div className="storage-bar-legend-item">
                        <div className="storage-bar-legend-dot" style={{ background: '#6366f1' }} />
                        Content {formatBytes(contentBytes)}
                    </div>
                    <div className="storage-bar-legend-item">
                        <div className="storage-bar-legend-dot" style={{ background: '#10b981' }} />
                        Models {formatBytes(modelBytes)}
                    </div>
                    {otherBytes > 1024 && (
                        <div className="storage-bar-legend-item">
                            <div className="storage-bar-legend-dot" style={{ background: '#94a3b8' }} />
                            Other {formatBytes(otherBytes)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
