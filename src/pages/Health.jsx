import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Thermometer, HeartPulse, Droplets, AlertCircle, ChevronRight } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import AskAIChip from '../components/AskAIChip';

const Health = () => {
    const healthStories = TriageRouter.getStoriesByCategory('health');

    const getIcon = (storyName) => {
        if (storyName.includes('cpr')) return HeartPulse;
        if (storyName.includes('bleeding')) return Droplets;
        if (storyName.includes('choking')) return AlertCircle;
        if (storyName.includes('hypothermia')) return Thermometer;
        return Activity;
    };

    const getTitle = (storyName) => {
        if (storyName.includes('cpr')) return 'CPR & Cardiac Arrest';
        if (storyName.includes('bleeding')) return 'Severe Bleeding Control';
        if (storyName.includes('choking')) return 'Choking Emergency';
        if (storyName.includes('hypothermia')) return 'Hypothermia Triage';
        return 'Medical Emergency';
    };

    const getDescription = (storyName) => {
        if (storyName.includes('cpr')) return 'Cardiopulmonary resuscitation for unresponsive victims.';
        if (storyName.includes('bleeding')) return 'Control severe bleeding and apply pressure.';
        if (storyName.includes('choking')) return 'Heimlich maneuver and airway obstruction.';
        if (storyName.includes('hypothermia')) return 'Assess and treat cold exposure.';
        return 'Emergency medical protocol.';
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
                        const Icon = getIcon(route.story);
                        return (
                            <Link
                                key={route.story}
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
                                        {getTitle(route.story)}
                                    </h3>
                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        {getDescription(route.story)}
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
