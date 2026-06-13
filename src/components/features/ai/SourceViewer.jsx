import React, { useState, useEffect } from 'react';
import { X, ExternalLink, BookOpen, Share2, Type } from 'lucide-react';
import dompurify from 'dompurify';
import { db } from '../services/db';
import '../styles/SourceViewer.css';

/**
 * SourceViewer - "The Truth Layer"
 * 
 * A sliding drawer that reveals the original source material for AI claims.
 * 
 * Features:
 * - Slide-over admission (Native feel)
 * - "Living Reader" Typography (Serif, comfortable reading)
 * - Fetching from DB (Lazy loading of full content)
 * - DOM Sanitization
 */
const SourceViewer = ({ source, isOpen, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fontSize, setFontSize] = useState(16);

    // Reset state when source changes
    useEffect(() => {
        if (isOpen && source) {
            loadSourceContent();
        } else {
            // Cleanup when closed
            setContent('');
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, source]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const loadSourceContent = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. If content is already provided, use it
            if (source.fullContent || source.content) {
                setContent(source.fullContent || source.content);
                setLoading(false);
                return;
            }

            // 2. Fetch from DB if we have an ID and Store
            if (source.id && source.store) {
                const doc = await db.get(source.store, source.id);
                if (doc) {
                    setContent(doc.fullContent || doc.content || doc.description || 'No content available.');
                } else {
                    setError('Source article not found in local database.');
                }
            }
            // 3. Fallback: Search all stores if we only have an ID
            else if (source.id) {
                // Try common stores
                const stores = ['health_content', 'survival_content', 'law_content', 'zim_content'];
                let found = false;

                for (const store of stores) {
                    try {
                        const doc = await db.get(store, source.id);
                        if (doc) {
                            setContent(doc.fullContent || doc.content || doc.description);
                            found = true;
                            break;
                        }
                    } catch (_e) {
                        // Continue searching
                    }
                }

                if (!found) {
                    setError('Could not locate original source document.');
                }
            } else {
                setError('Invalid source reference.');
            }

        } catch (err) {
            console.error('Failed to load source:', err);
            setError('Error loading content.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Sanitize HTML
    const sanitizedHTML = dompurify.sanitize(content, {
        ADD_TAGS: ['img', 'table', 'th', 'tr', 'td', 'h1', 'h2', 'h3', 'p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'hr', 'blockquote', 'code', 'pre'],
        ADD_ATTR: ['src', 'alt', 'class', 'id']
    });

    return (
        <div className="source-viewer-overlay" onClick={onClose}>
            <div
                className="source-viewer-drawer"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Source: ${source?.title || 'Unknown'}`}
            >
                {/* Header */}
                <header className="source-viewer-header">
                    <div className="source-meta">
                        <div className="source-icon">
                            <BookOpen size={18} />
                        </div>
                        <div className="source-info">
                            <span className="source-label">Source Verification</span>
                            <h2 className="source-title" title={source?.title}>{source?.title || 'Unknown Source'}</h2>
                        </div>
                    </div>

                    <div className="source-actions">
                        <button
                            className="action-btn"
                            onClick={() => setFontSize(prev => prev === 16 ? 20 : (prev === 20 ? 14 : 16))}
                            title="Toggle Text Size"
                            aria-label="Toggle Text Size"
                        >
                            <Type size={18} />
                        </button>
                        <button
                            className="action-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(source?.fullContent || source?.content || '');
                            }}
                            title="Copy Content"
                            aria-label="Copy Content"
                        >
                            <Share2 size={18} />
                        </button>
                        <button className="close-btn" onClick={onClose} aria-label="Close">
                            <X size={24} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="source-viewer-content" style={{ fontSize: `${fontSize}px` }}>
                    {loading ? (
                        <div className="source-loading">
                            <div className="spinner"></div>
                            <p>Retrieving original document...</p>
                        </div>
                    ) : error ? (
                        <div className="source-error">
                            <ExternalLink size={48} className="error-icon" />
                            <p>{error}</p>
                            <p className="error-sub">The article might have been deleted or the pack uninstalled.</p>
                        </div>
                    ) : (
                        <article className="living-reader-content">
                            {/* Render HTML Content */}
                            <div
                                className="article-body"
                                dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
                            />

                            {/* Metadata Footer */}
                            <footer className="article-footer">
                                <hr />
                                <p>
                                    <strong>Source ID:</strong> {source?.id}<br />
                                    <strong>Collection:</strong> {source?.store || 'Unknown'}<br />
                                    <strong>Confidence:</strong> {Math.round((source?.score || 0) * 100)}% Match
                                </p>
                            </footer>
                        </article>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SourceViewer;
