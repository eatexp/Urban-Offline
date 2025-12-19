import React from 'react';
import { Link } from 'react-router-dom';
import { Tent, Droplets, Map as MapIcon, ShieldAlert, Flame } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

const Survival = () => {
    const survivalStories = TriageRouter.getStoriesByCategory('survival');

    return (
        <div className="page-container space-y-4">
            <header className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Tent className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Survival & Preparedness</h1>
                </div>
                <p className="text-sm text-muted">
                    Guides for flood risks, shelter, water safety, and emergency planning.
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Interactive Skills Section */}
                <div className="bg-white p-4 rounded-lg shadow border border-orange-200 col-span-1 md:col-span-2">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Interactive Survival Skills
                    </h2>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        {survivalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="block p-3 bg-orange-50 rounded hover:bg-orange-100 transition-colors border border-orange-100"
                            >
                                <span className="font-medium text-orange-800 capitalize">
                                    {item.keywords[0]} Guide
                                </span>
                                <span className="block text-xs text-orange-600">
                                    {item.story.split('/').pop().replace('.ink.json', '').replace(/-/g, ' ')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-orange-500" />
                        Flood Risk & Zones
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">Environment Agency Flood Maps</p>
                    <Link to="/map?category=flood" className="text-orange-600 font-medium hover:underline">
                        View Flood Map
                    </Link>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-orange-500" />
                        Emergency Plan
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">Create your offline plan</p>
                    <button className="text-orange-600 font-medium hover:underline text-left">
                        Manage Plan (Coming Soon)
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-orange-500" />
                        Water Safety (RNLI)
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">Sea and urban water safety guides</p>
                    <Link to="/guides/water-safety" className="text-orange-600 font-medium hover:underline">
                        Read Guide
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Survival;
