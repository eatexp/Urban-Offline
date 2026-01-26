import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, Gavel, Shield, ChevronRight } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import AskAIChip from '../components/AskAIChip';

const Law = () => {
    const legalStories = TriageRouter.getStoriesByCategory('legal');

    const getStoryTitle = (story) => {
        if (story.includes('stop-and-search')) return 'Stop & Search (GOWISELY)';
        if (story.includes('arrest')) return 'Arrest Rights & Custody';
        if (story.includes('custody')) return 'Custody Welfare';
        return 'Legal Guide';
    };

    const getStoryDescription = (story) => {
        if (story.includes('stop-and-search')) return 'Know your rights during police stop and search.';
        if (story.includes('arrest')) return 'Your rights upon arrest and during custody.';
        if (story.includes('custody')) return 'Welfare rights and procedures in custody.';
        return 'Interactive legal guidance.';
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
                        {legalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                style={{
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    borderColor: 'rgba(59, 130, 246, 0.2)',
                                    animationDelay: `${index * 50 + 100}ms`
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-medium" style={{ color: 'var(--color-info)' }}>
                                            {getStoryTitle(item.story)}
                                        </span>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            {getStoryDescription(item.story)}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-info)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reference Materials */}
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
                            to="/guides/pace-codes"
                            className="btn btn-ghost text-sm p-0"
                            style={{ color: 'var(--color-info)' }}
                        >
                            Browse Codes
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
                            to="/guides/legislation"
                            className="btn btn-ghost text-sm p-0"
                            style={{ color: 'var(--color-info)' }}
                        >
                            View Acts
                        </Link>
                    </div>
                </div>
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
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
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
