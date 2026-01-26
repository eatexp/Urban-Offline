import React from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, Users, Shield, Navigation, Radio, Zap, Droplets, Wifi,
    Flame, Tent, Wind, Thermometer, MapIcon, ShieldAlert, Heart, Scale
} from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import ProtocolButton from '../components/ProtocolButton';
import { getAllScenarios } from '../services/ai/scenarioTemplates';
import AskAIChip from '../components/AskAIChip';

const Survival = () => {
    const survivalStories = TriageRouter.getStoriesByCategory('survival');
    const scenarios = getAllScenarios();

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

            {/* Quick Protocols Section */}
            <section className="animate-slide-up" style={{animationDelay: '50ms'}}>
                <h2 className="section-header section-header-with-line">Quick Emergency Protocols</h2>
                <p className="text-sm mb-4" style={{color: 'var(--color-text-muted)'}}>
                    Tap a button to generate a personalized 5-step emergency protocol based on your context
                </p>
                <div className="grid-responsive">
                    {scenarios.map(scenario => (
                        <ProtocolButton key={scenario.id} scenario={scenario} />
                    ))}
                </div>
            </section>

            {/* Priority 1: Civil Unrest & Breakdown of Order */}
            <section className="animate-slide-up" style={{animationDelay: '100ms'}}>
                <h2 className="section-header section-header-with-line">Civil Unrest & Breakdown of Order</h2>
                <div className="grid-responsive">
                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Users className="w-5 h-5" style={{color: 'var(--color-danger)'}} />
                            Shelter-in-Place vs. Evacuation
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Decision framework for riots and civil disturbances</p>
                        <span className="link-coming-soon">
                            Decision Guide
                        </span>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Navigation className="w-5 h-5" style={{color: 'var(--color-danger)'}} />
                            Safe Navigation During Unrest
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Avoiding danger zones and crowd crush risks</p>
                        <span className="link-coming-soon">
                            Navigation Guide
                        </span>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Radio className="w-5 h-5" style={{color: 'var(--color-danger)'}} />
                            Communication When Networks Down
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Alternative communication methods and protocols</p>
                        <span className="link-coming-soon">
                            Comm Guide
                        </span>
                    </div>

                    <div className="card card-emergency p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Shield className="w-5 h-5" style={{color: 'var(--color-danger)'}} />
                            Resource Security
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Protecting food, water, and supplies</p>
                        <span className="link-coming-soon">
                            Security Guide
                        </span>
                    </div>
                </div>
            </section>

            {/* Priority 2: Infrastructure Failure */}
            <section className="animate-slide-up" style={{animationDelay: '150ms'}}>
                <h2 className="section-header section-header-with-line">Infrastructure Failure</h2>
                <div className="grid-responsive">
                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Zap className="w-5 h-5" style={{color: 'var(--color-warning)'}} />
                            No Power
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Heating, cooling, food storage without electricity</p>
                        <span className="link-coming-soon">
                            Power Outage Guide
                        </span>
                    </div>

                    <div className="card card-accent-blue p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Droplets className="w-5 h-5" style={{color: 'var(--color-info)'}} />
                            No Water Supply
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Finding, purifying, and storing water</p>
                        <Link to="/survival#water" className="btn btn-ghost text-sm p-0" style={{color: 'var(--color-info)'}}>
                            Water Guide
                        </Link>
                    </div>

                    <div className="card card-accent-slate p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Wifi className="w-5 h-5" style={{color: 'var(--color-text-muted)'}} />
                            No Internet/Phone
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Communication alternatives and offline resources</p>
                        <span className="link-coming-soon">
                            Offline Comm Guide
                        </span>
                    </div>

                    <div className="card card-accent-green p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <MapIcon className="w-5 h-5" style={{color: 'var(--color-success)'}} />
                            No Transportation
                        </h3>
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>Walking routes, bicycle paths, exit strategies</p>
                        <Link to="/map" className="btn btn-ghost text-sm p-0" style={{color: 'var(--color-success)'}}>
                            View Offline Maps
                        </Link>
                    </div>
                </div>
            </section>

            {/* Priority 3: Environmental & Weather Threats */}
            <section className="animate-slide-up" style={{animationDelay: '200ms'}}>
                <h2 className="section-header section-header-with-line">Environmental & Weather Emergencies</h2>
                <div className="grid-responsive">
                    <div className="card card-accent-blue p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Droplets className="w-5 h-5" style={{color: 'var(--color-info)'}} />
                            Flood Risk & Zones
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Environment Agency Flood Maps</p>
                        <Link to="/map?category=flood" className="btn btn-ghost text-sm p-0" style={{color: 'var(--color-info)'}}>
                            View Flood Map
                        </Link>
                    </div>

                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Thermometer className="w-5 h-5" style={{color: 'var(--color-warning)'}} />
                            Heat Wave / Extreme Cold
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Temperature emergency protocols</p>
                        <span className="link-coming-soon">
                            Temperature Guide
                        </span>
                    </div>

                    <div className="card card-accent-slate p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Wind className="w-5 h-5" style={{color: 'var(--color-text-muted)'}} />
                            Severe Weather
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Storms, hurricanes, tornadoes</p>
                        <span className="link-coming-soon">
                            Weather Guide
                        </span>
                    </div>

                    <div className="card card-accent-amber p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <ShieldAlert className="w-5 h-5" style={{color: 'var(--color-warning)'}} />
                            Emergency Plan
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Create your offline preparedness plan</p>
                        <span className="link-coming-soon">
                            Manage Plan
                        </span>
                    </div>
                </div>
            </section>

            {/* Priority 4: Wilderness Survival Skills */}
            <section className="animate-slide-up" style={{animationDelay: '250ms'}}>
                <h2 className="section-header section-header-with-line">Wilderness Survival Skills</h2>
                <div className="card card-accent-green p-4 mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3" style={{color: 'var(--color-text-primary)'}}>
                        <Flame className="w-5 h-5" style={{color: 'var(--color-warning)'}} />
                        Interactive Survival Training
                    </h3>
                    <div className="grid-responsive-3">
                        {survivalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="card p-3 hover:shadow-lg transition-all"
                                style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    borderColor: 'rgba(34, 197, 94, 0.2)'
                                }}
                            >
                                <span className="font-medium capitalize" style={{color: 'var(--color-success)'}}>
                                    {item.keywords[0]}
                                </span>
                                <span className="block text-xs" style={{color: 'var(--color-text-muted)'}}>
                                    Interactive Guide
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="grid-responsive">
                    <div className="card card-accent-green p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <Tent className="w-5 h-5" style={{color: 'var(--color-success)'}} />
                            Shelter Construction
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Building emergency shelters</p>
                        <Link to="/survival#shelter" className="btn btn-ghost text-sm p-0" style={{color: 'var(--color-success)'}}>
                            Shelter Guide
                        </Link>
                    </div>

                    <div className="card card-accent-blue p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{color: 'var(--color-text-primary)'}}>
                            <MapIcon className="w-5 h-5" style={{color: 'var(--color-info)'}} />
                            Water Safety (RNLI)
                        </h3>
                        <p className="text-sm mb-2" style={{color: 'var(--color-text-muted)'}}>Sea and urban water safety</p>
                        <Link to="/survival#water-safety" className="btn btn-ghost text-sm p-0" style={{color: 'var(--color-info)'}}>
                            Read Guide
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Access to Other Domains */}
            <section className="animate-slide-up" style={{animationDelay: '300ms'}}>
                <h2 className="section-header section-header-with-line">Other Emergency Resources</h2>
                <div className="grid-responsive">
                    <Link
                        to="/health"
                        className="card card-link hover:shadow-xl"
                        style={{borderColor: 'rgba(239, 68, 68, 0.2)'}}
                    >
                        <div
                            className="card-link-icon"
                            style={{background: 'rgba(239, 68, 68, 0.1)'}}
                        >
                            <Heart className="w-6 h-6" style={{color: 'var(--color-danger)'}} />
                        </div>
                        <div>
                            <h3 className="font-bold" style={{color: 'var(--color-text-primary)'}}>Health & First Aid</h3>
                            <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>Medical emergencies when hospitals unreachable</p>
                        </div>
                    </Link>

                    <Link
                        to="/law"
                        className="card card-link hover:shadow-xl"
                        style={{borderColor: 'rgba(59, 130, 246, 0.2)'}}
                    >
                        <div
                            className="card-link-icon"
                            style={{background: 'rgba(59, 130, 246, 0.1)'}}
                        >
                            <Scale className="w-6 h-6" style={{color: 'var(--color-info)'}} />
                        </div>
                        <div>
                            <h3 className="font-bold" style={{color: 'var(--color-text-primary)'}}>Law & Rights</h3>
                            <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>Know your rights during police encounters or martial law</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Ask AI Chip */}
            <section className="mt-8 animate-slide-up" style={{ animationDelay: '350ms' }}>
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
