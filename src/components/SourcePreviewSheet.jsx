/**
 * SourcePreviewSheet.jsx — Bottom Sheet Source Preview
 *
 * Slides up from the bottom to show a source excerpt without
 * leaving the conversation. "Read Full Article →" button navigates.
 *
 * Refinery Standard:
 *   - iOS safe area: bottom padding for Home Indicator
 *   - Dismiss: backdrop tap, X button
 *   - Animation: slide-up / slide-down
 */

import { useState, useCallback, useEffect } from 'react';
import { X, ArrowRight, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

const SourcePreviewSheet = ({ source, onClose }) => {
    const navigate = useNavigate();
    const [isClosing, setIsClosing] = useState(false);

    // Animate out then unmount
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 200); // match sheetSlideDown duration
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handleClose]);

    // Prevent body scroll while sheet is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    if (!source) return null;



    const handleReadMore = () => {
        // Navigate to the article page
        if (source.url) {
            navigate(source.url);
        } else if (source.id) {
            navigate(`/guide/${source.id}`);
        }
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`source-sheet-backdrop ${isClosing ? 'source-sheet-backdrop--closing' : ''}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className={`source-sheet ${isClosing ? 'source-sheet--closing' : ''}`}
                role="dialog"
                aria-label={`Source preview: ${source.title}`}
                aria-modal="true"
            >
                {/* Drag handle */}
                <div className="source-sheet__handle">
                    <div className="source-sheet__handle-bar" />
                </div>

                {/* Header */}
                <div className="source-sheet__header">
                    <div>
                        <h3 className="source-sheet__title">{source.title}</h3>
                        {source.category && (
                            <span className="source-sheet__category">
                                <Database style={{ width: 10, height: 10 }} />
                                {source.category}
                            </span>
                        )}
                    </div>
                    <button
                        className="source-sheet__close"
                        onClick={handleClose}
                        aria-label="Close source preview"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="source-sheet__content">
                    <div
                        className="source-sheet__body typography"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(source.content || source.description || '', {
                                USE_PROFILES: { html: true },
                                FORBID_TAGS: ['style', 'script'],
                            })
                        }}
                    />

                    <button
                        className="source-sheet__read-more"
                        onClick={handleReadMore}
                    >
                        Read Full Article
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default SourcePreviewSheet;
