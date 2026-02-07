import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, Users, Shield, Navigation, Radio, Zap, Droplets, Wifi,
    Flame, Tent, Wind, Thermometer, MapIcon, ShieldAlert, Heart, Scale,
    ChevronRight, BookOpen, Loader2
} from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { db } from '../services/db';
import ProtocolButton from '../components/ProtocolButton';
import { getAllScenarios } from '../services/ai/scenarioTemplates';
import AskAIChip from '../components/AskAIChip';

const Survival = () => {
    const survivalStories = TriageRouter.getStoriesByCategory('survival');
    const scenarios = getAllScenarios();
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                const survivalArticles = await db.getAll('survival_content');
                setArticles(survivalArticles || []);
            } catch (error) {
                console.error('Failed to load survival articles:', error);
                setArticles([]);
            } finally {
                setLoadingArticles(false);
            }
        };
        loadArticles();
    }, []);

    const getIcon = (iconName) => {
        const icons = { Flame, Tent, Droplets, Radio };
        return icons[iconName] || Flame;
    };

    return (
        <div className="page-container space-y-6 animate-slide-up">
            {/* Page Header */}
            <header className="page-header animate-fade-in">
                <div className="page-header-row">
                    <div className="page-header-icon page-header-icon-warning">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h1 className="page-header-title">Survival & Preparedness</h1>
                </div>
                <p className="page-header-description">
                    Critical information for civil unrest, infrastructure failure, and emergency scenarios when systems fail.
                </p>
            </header>

            {/* Interactive Survival Guides - MOVED TO TOP */}
            <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <h2 className="section-header section-header-with-line">Interactive Survival Guides</h2>
                <div className="card card-accent-green p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="p-2 rounded-lg"
                            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                        >
                            <Flame className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                        </div>
                        <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                            Wilderness Survival Training
                        </h3>
                    </div>
                    <div className="grid gap-3">
                        {survivalStories.map((item, index) => {
                            const Icon = getIcon(item.icon);
                            return (
                                <Link
                                    key={item.key}
                                    to={`/triage/${item.story}`}
                                    className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                    style={{
                                        background: 'rgba(34, 197, 94, 0.05)',
                                        borderColor: 'rgba(34, 197, 94, 0.2)',
                                        animationDelay: `${index * 50 + 100}ms`
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} style={{ color: 'var(--color-success)' }} />
                                            <div>
                                                <span className="font-medium" style={{ color: 'var(--color-success)' }}>
                                                    {item.title}
                                                </span>
                                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} style={{ color: 'var(--color-success)' }} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Quick Protocols Section */}
            <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h2 className="section-header section-header-with-line">Quick Emergency Protocols</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Tap a button to generate a personalized 5-step emergency protocol based on your context
                </p>
                <div className="grid-responsive">
                    {scenarios.map(scenario => (
                        <ProtocolButton key={scenario.id} scenario={scenario} />
                    ))}
                </div>
            </section>

            {/* Priority 1: Civil Unrest & Breakdown of Order */}
            <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h2 className="section-header section-header-with-line">Civil Unrest & Breakdown of Order</h2>
                <div className="grid-responsive">
                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Users className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                            Shelter-in-Place vs. Evacuation
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Decision framework for riots and civil disturbances</p>
                        <Link to="/ai?q=shelter in place vs evacuation decision framework civil unrest" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-danger)' }}>
                            Ask AI for Guidance
                        </Link>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Navigation className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                            Safe Navigation During Unrest
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Avoiding danger zones and crowd crush risks</p>
                        <Link to="/ai?q=safe navigation during civil unrest avoid crowd crush" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-danger)' }}>
                            Ask AI for Guidance
                        </Link>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Radio className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                            Communication When Networks Down
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Alternative communication methods and protocols</p>
                        <Link to="/triage/survival/signaling.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-danger)' }}>
                            Open Signaling Guide
                        </Link>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Shield className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                            Resource Security
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Protecting food, water, and supplies</p>
                        <Link to="/ai?q=how to secure and protect food water supplies emergency" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-danger)' }}>
                            Ask AI for Guidance
                        </Link>
                    </div>
                </div>
            </section>

            {/* Priority 2: Infrastructure Failure */}
            <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <h2 className="section-header section-header-with-line">Infrastructure Failure</h2>
                <div className="grid-responsive">
                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Zap className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                            No Power
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Heating, cooling, food storage without electricity</p>
                        <Link to="/triage/survival/fire-making.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-warning)' }}>
                            Fire Making Guide
                        </Link>
                    </div>

                    <div className="card card-accent-blue p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Droplets className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                            No Water Supply
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Finding, purifying, and storing water</p>
                        <Link to="/triage/survival/water-purification.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-info)' }}>
                            Water Purification Guide
                        </Link>
                    </div>

                    <div className="card card-accent-slate p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Wifi className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                            No Internet/Phone
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Communication alternatives and offline resources</p>
                        <Link to="/triage/survival/signaling.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-text-secondary)' }}>
                            Emergency Signaling Guide
                        </Link>
                    </div>

                    <div className="card card-accent-green p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <MapIcon className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                            No Transportation
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Walking routes, bicycle paths, exit strategies</p>
                        <Link to="/map" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-success)' }}>
                            View Offline Maps
                        </Link>
                    </div>
                </div>
            </section>

            {/* Priority 3: Environmental & Weather Threats */}
            <section className="animate-slide-up" style={{ animationDelay: '250ms' }}>
                <h2 className="section-header section-header-with-line">Environmental & Weather Emergencies</h2>
                <div className="grid-responsive">
                    <div className="card card-accent-blue p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Droplets className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                            Flood Risk & Zones
                        </h3>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Environment Agency Flood Maps</p>
                        <Link to="/map?category=flood" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-info)' }}>
                            View Flood Map
                        </Link>
                    </div>

                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Thermometer className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                            Heat Wave / Extreme Cold
                        </h3>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Temperature emergency protocols</p>
                        <div className="flex gap-2 flex-wrap">
                            <Link to="/triage/medical/heat-illness.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-warning)' }}>
                                Heat Illness
                            </Link>
                            <span style={{ color: 'var(--color-text-muted)' }}>|</span>
                            <Link to="/triage/hypothermia.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-warning)' }}>
                                Hypothermia
                            </Link>
                        </div>
                    </div>

                    <div className="card card-accent-slate p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Wind className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                            Severe Weather
                        </h3>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Storms, hurricanes, tornadoes</p>
                        <Link to="/triage/survival/shelter-building.ink.json" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-text-secondary)' }}>
                            Shelter Building Guide
                        </Link>
                    </div>

                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                            Emergency Plan
                        </h3>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Create your offline preparedness plan</p>
                        <Link to="/ai?q=help me create an emergency preparedness plan" className="btn btn-ghost text-sm p-0" style={{ color: 'var(--color-warning)' }}>
                            Create with AI
                        </Link>
                    </div>
                </div>
            </section>

            {/* Reference Articles Section */}
            <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                <h2 className="section-header section-header-with-line">
                    <BookOpen size={18} className="inline mr-2" />
                    Survival Reference Articles
                </h2>

                {loadingArticles ? (
                    <div className="card p-6 text-center">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading articles...</p>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid gap-3">
                        {articles.slice(0, 8).map((article, index) => (
                            <Link
                                key={article.id}
                                to={`/article/${article.id}`}
                                className="card p-4 hover:shadow-lg transition-all animate-scale-in"
                                style={{
                                    borderColor: 'rgba(245, 158, 11, 0.15)',
                                    animationDelay: `${index * 30 + 350}ms`
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                            {article.title || article.name}
                                        </h4>
                                        {article.description && (
                                            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                                                {article.description.substring(0, 100)}...
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                        {articles.length > 8 && (
                            <Link
                                to="/browse?category=survival"
                                className="card p-4 text-center hover:shadow-lg transition-all"
                                style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}
                            >
                                <span style={{ color: 'var(--color-warning)' }}>
                                    View all {articles.length} articles →
                                </span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="card p-6 text-center">
                        <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            Survival reference articles will appear here once synced.
                        </p>
                    </div>
                )}
            </section>

            {/* Quick Access to Other Domains */}
            <section className="animate-slide-up" style={{ animationDelay: '350ms' }}>
                <h2 className="section-header section-header-with-line">Other Emergency Resources</h2>
                <div className="grid-responsive">
                    <Link
                        to="/health"
                        className="card card-link hover:shadow-xl"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                        <div
                            className="card-link-icon"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <Heart className="w-6 h-6" style={{ color: 'var(--color-danger)' }} />
                        </div>
                        <div>
                            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Health & First Aid</h3>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Medical emergencies when hospitals unreachable</p>
                        </div>
                    </Link>

                    <Link
                        to="/law"
                        className="card card-link hover:shadow-xl"
                        style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <div
                            className="card-link-icon"
                            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                        >
                            <Scale className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
                        </div>
                        <div>
                            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Law & Rights</h3>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Know your rights during police encounters or martial law</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Ask AI Chip */}
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
                <AskAIChip
                    title="Survival & Preparedness"
                    category="survival"
                    variant="expanded"
                />
            </section>
        </div>
    );
};

export default Survival;
