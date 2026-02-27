import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, Gavel, Shield, ChevronRight, Search, Loader2 } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { db } from '../services/db';
import AskAIChip from '../components/shared/AskAIChip';

const Law = () => {
    const legalStories = TriageRouter.getStoriesByCategory('legal');
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                const lawArticles = await db.getAll('law_content');
                setArticles(lawArticles || []);
            } catch (error) {
                console.error('Failed to load law articles:', error);
                setArticles([]);
            } finally {
                setLoadingArticles(false);
            }
        };
        loadArticles();
    }, []);

    const getIcon = (iconName) => {
        const icons = { Shield, Search, Gavel, Scale };
        return icons[iconName] || Scale;
    };

    return (
        <div className="page-container space-y-6 animate-slide-up">
            {/* Page Header */}
            <header className="page-header animate-fade-in">
                <div className="page-header-row">
                    <div className="page-header-icon page-header-icon-info">
                        <Scale className="w-6 h-6" />
                    </div>
                    <h1 className="page-header-title">Law & Rights</h1>
                </div>
                <p className="page-header-description">
                    Offline access to UK legislation, PACE codes, and your rights.
                </p>
            </header>

            {/* Interactive Legal Guides */}
            <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <h2 className="section-header section-header-with-line">Interactive Legal Guides</h2>
                <div className="card card-accent-blue p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="p-2 rounded-lg"
                            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                        >
                            <Shield className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                        </div>
                        <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                            Know Your Rights
                        </h3>
                    </div>
                    <div className="grid gap-3">
                        {legalStories.map((item, index) => {
                            const Icon = getIcon(item.icon);
                            return (
                                <Link
                                    key={item.key}
                                    to={`/triage/${item.story}`}
                                    className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        borderColor: 'rgba(59, 130, 246, 0.2)',
                                        animationDelay: `${index * 50 + 100}ms`
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} style={{ color: 'var(--color-info)' }} />
                                            <div>
                                                <span className="font-medium" style={{ color: 'var(--color-info)' }}>
                                                    {item.title}
                                                </span>
                                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} style={{ color: 'var(--color-info)' }} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Reference Materials - Fixed links */}
            <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h2 className="section-header section-header-with-line">Reference Materials</h2>
                <div className="grid-responsive">
                    <div className="card card-accent-blue p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="p-2 rounded-lg"
                                style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                            >
                                <BookOpen className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                            </div>
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                PACE Codes of Practice
                            </h3>
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                            Police And Criminal Evidence Act Codes A-I
                        </p>
                        <Link
                            to="/ai?q=PACE codes of practice police powers"
                            className="btn btn-ghost text-sm p-0"
                            style={{ color: 'var(--color-info)' }}
                        >
                            Ask AI About PACE Codes
                        </Link>
                    </div>

                    <div className="card card-accent-blue p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="p-2 rounded-lg"
                                style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                            >
                                <Gavel className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                            </div>
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                Key Legislation
                            </h3>
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                            Public Order Act, Human Rights Act
                        </p>
                        <Link
                            to="/ai?q=UK emergency legislation human rights public order act"
                            className="btn btn-ghost text-sm p-0"
                            style={{ color: 'var(--color-info)' }}
                        >
                            Ask AI About Legislation
                        </Link>
                    </div>
                </div>
            </section>

            {/* Reference Articles Section */}
            <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h2 className="section-header section-header-with-line">
                    <BookOpen size={18} className="inline mr-2" />
                    Legal Reference Articles
                </h2>

                {loadingArticles ? (
                    <div className="card p-6 text-center">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading articles...</p>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid gap-3">
                        {articles.slice(0, 10).map((article, index) => (
                            <Link
                                key={article.id}
                                to={`/article/${article.id}`}
                                className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                style={{
                                    borderColor: 'rgba(59, 130, 246, 0.15)',
                                    animationDelay: `${index * 30 + 200}ms`
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                            {article.title}
                                        </h4>
                                        {article.summary && (
                                            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                                                {article.summary.substring(0, 100)}...
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                        {articles.length > 10 && (
                            <Link
                                to="/browse?category=law"
                                className="card p-4 text-center hover:shadow-lg transition-all"
                                style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}
                            >
                                <span style={{ color: 'var(--color-info)' }}>
                                    View all {articles.length} articles →
                                </span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="card p-6 text-center">
                        <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            Legal reference articles will appear here once synced.
                        </p>
                    </div>
                )}
            </section>

            {/* Empty State if no stories */}
            {legalStories.length === 0 && (
                <div
                    className="card p-8 text-center animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                >
                    <div
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                    >
                        <Scale size={32} style={{ color: 'var(--color-info)' }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        No Legal Guides Available
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Legal guides will appear here once content is downloaded.
                    </p>
                </div>
            )}

            {/* Ask AI Chip */}
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <AskAIChip
                    title="Law & Rights"
                    category="legal"
                    variant="expanded"
                />
            </section>
        </div>
    );
};

export default Law;
