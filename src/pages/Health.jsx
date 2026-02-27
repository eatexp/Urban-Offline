import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Thermometer, HeartPulse, Droplets, AlertCircle, ChevronRight, Flame, Brain, BookOpen, Loader2 } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { db } from '../services/db';
import AskAIChip from '../components/shared/AskAIChip';

const Health = () => {
    const healthStories = TriageRouter.getStoriesByCategory('health');
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                const healthArticles = await db.getAll('health_content');
                setArticles(healthArticles || []);
            } catch (error) {
                console.error('Failed to load health articles:', error);
                setArticles([]);
            } finally {
                setLoadingArticles(false);
            }
        };
        loadArticles();
    }, []);

    const getIcon = (iconName) => {
        const icons = {
            HeartPulse, Droplets, AlertCircle, Thermometer, Activity, Flame, Brain
        };
        return icons[iconName] || Activity;
    };

    return (
        <div className="page-container animate-slide-up">
            {/* Page Header */}
            <header className="page-header animate-fade-in">
                <div className="page-header-row">
                    <div className="page-header-icon page-header-icon-emergency">
                        <Heart size={24} />
                    </div>
                    <h1 className="page-header-title">Health & First Aid</h1>
                </div>
                <p className="page-header-description">
                    Emergency medical protocols and interactive triage guides.
                </p>
            </header>

            {/* Emergency Triage Cards */}
            <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <h2 className="section-header section-header-with-line">Interactive Emergency Guides</h2>
                <div className="grid gap-4">
                    {healthStories.map((route, index) => {
                        const Icon = getIcon(route.icon);
                        return (
                            <Link
                                key={route.key}
                                to={`/triage/${route.story}`}
                                className="card card-link hover:shadow-xl animate-scale-in"
                                style={{
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    animationDelay: `${index * 50 + 100}ms`
                                }}
                            >
                                <div
                                    className="card-link-icon"
                                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                >
                                    <Icon size={24} style={{ color: 'var(--color-danger)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                        {route.title}
                                    </h3>
                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        {route.description}
                                    </p>
                                </div>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                >
                                    <ChevronRight size={16} style={{ color: 'var(--color-danger)' }} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Empty State if no stories */}
            {healthStories.length === 0 && (
                <div
                    className="card p-8 text-center animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                >
                    <div
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                    >
                        <Heart size={32} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        No Health Guides Available
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Health triage guides will appear here once content is downloaded.
                    </p>
                </div>
            )}

            {/* Reference Articles Section */}
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h2 className="section-header section-header-with-line">
                    <BookOpen size={18} className="inline mr-2" />
                    Reference Articles
                </h2>

                {loadingArticles ? (
                    <div className="card p-6 text-center">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading articles...</p>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid gap-3">
                        {articles.slice(0, 12).map((article, index) => (
                            <Link
                                key={article.id}
                                to={`/article/${article.id}`}
                                className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                style={{
                                    borderColor: 'rgba(239, 68, 68, 0.15)',
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
                                                {article.summary.substring(0, 120)}...
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                        {articles.length > 12 && (
                            <Link
                                to="/browse?category=health"
                                className="card p-4 text-center hover:shadow-lg transition-all"
                                style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            >
                                <span style={{ color: 'var(--color-danger)' }}>
                                    View all {articles.length} articles →
                                </span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="card p-6 text-center">
                        <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            Medical reference articles will appear here once synced.
                        </p>
                    </div>
                )}
            </section>

            {/* Ask AI Chip */}
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <AskAIChip
                    title="Health & First Aid"
                    category="health"
                    variant="expanded"
                />
            </section>
        </div>
    );
};

export default Health;
