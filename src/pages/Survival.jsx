import React from 'react';
import { Link } from 'react-router-dom';
import { Tent, Droplets, Map as MapIcon, ShieldAlert, Flame } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

const Survival = () => {
    const survivalStories = TriageRouter.getStoriesByCategory('survival');

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>
                    <div className="module-card-icon orange" style={{ marginRight: '0.75rem' }}>
                        <Tent size={24} />
                    </div>
                    Survival & Preparedness
                </h1>
                <p>Guides for flood risks, shelter, water safety, and emergency planning.</p>
            </header>

            <div className="grid-2">
                {/* Interactive Skills Section */}
                <div className="content-card col-span-2">
                    <h2 className="flex items-center gap-sm mb-3">
                        <Flame size={18} className="text-primary" />
                        <span className="font-bold">Interactive Survival Skills</span>
                    </h2>
                    <div className="grid-2">
                        {survivalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="interactive-item orange"
                            >
                                <span className="font-medium capitalize">
                                    {item.keywords[0]} Guide
                                </span>
                                <span className="block text-xs text-muted mt-1">
                                    {item.story.split('/').pop().replace('.ink.json', '').replace(/-/g, ' ')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="content-card">
                    <h2 className="flex items-center gap-sm mb-2">
                        <Droplets size={18} className="text-primary" />
                        <span className="font-bold">Flood Risk & Zones</span>
                    </h2>
                    <p className="text-sm text-muted mb-3">Environment Agency Flood Maps</p>
                    <Link to="/map?category=flood" className="text-link">
                        View Flood Map
                    </Link>
                </div>

                <div className="content-card">
                    <h2 className="flex items-center gap-sm mb-2">
                        <ShieldAlert size={18} className="text-primary" />
                        <span className="font-bold">Emergency Plan</span>
                    </h2>
                    <p className="text-sm text-muted mb-3">Create your offline plan</p>
                    <button className="text-link text-left">
                        Manage Plan (Coming Soon)
                    </button>
                </div>

                <div className="content-card">
                    <h2 className="flex items-center gap-sm mb-2">
                        <MapIcon size={18} className="text-primary" />
                        <span className="font-bold">Water Safety (RNLI)</span>
                    </h2>
                    <p className="text-sm text-muted mb-3">Sea and urban water safety guides</p>
                    <Link to="/guides/water-safety" className="text-link">
                        Read Guide
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Survival;
