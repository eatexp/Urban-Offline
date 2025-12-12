import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleBySlug } from '../services/db';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import DOMPurify from 'dompurify';

const ArticleView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [triageStory, setTriageStory] = useState(null);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await getArticleBySlug(slug);
                setArticle(data);

                // Check for related triage story
                if (data) {
                    const story = TriageRouter.findTriageStory(data.title + " " + (data.body_plain || ""));
                    setTriageStory(story);
                }
            } catch (e) {
                console.error("Failed to load article", e);
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [slug]);

    // Sanitize HTML to prevent XSS attacks
    const sanitizeHtml = (html) => {
        if (!html) return '';
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                          'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody',
                          'tr', 'th', 'td', 'img', 'figure', 'figcaption', 'span', 'div', 'section', 'article'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        });
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center" style={{ minHeight: '50vh' }}>
                <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="page-container flex flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
                <BookOpen size={48} className="text-muted mb-4" />
                <h2 className="text-xl font-bold mb-2">Article Not Found</h2>
                <p className="text-muted mb-6">The content likely hasn't been downloaded or was moved.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-primary"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <header className="flex items-center gap-sm mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem' }}
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold truncate">
                    {article.title}
                </h1>
            </header>

            {/* Triage Call-to-Action */}
            {triageStory && (
                <div className="card mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <div className="flex items-start gap-sm">
                        <AlertTriangle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                        <div className="flex-1">
                            <h3 className="font-bold" style={{ color: 'var(--color-danger)' }}>Emergency Situation?</h3>
                            <p className="text-sm text-muted mt-1">
                                Start an interactive guide for {triageStory.category} assessment.
                            </p>
                            <button
                                onClick={() => navigate(`/triage/${triageStory.story}`)}
                                className="btn btn-primary mt-3"
                                style={{ background: 'var(--color-danger)' }}
                            >
                                Start Guided Help
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Content - SANITIZED */}
            <article className="content-card">
                <div
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.body_html) }}
                />
            </article>

            <footer className="mt-6 pt-4 text-xs text-muted" style={{ borderTop: '1px solid var(--color-border)' }}>
                <p>Source: {article.source}</p>
                <p>Last Updated: {new Date(article.last_updated).toLocaleDateString()}</p>
            </footer>
        </div>
    );
};

export default ArticleView;
