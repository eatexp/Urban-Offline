import React from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, Users, Shield, Navigation, Radio, Zap, Droplets, Wifi,
    Flame, Tent, Wind, Thermometer, MapIcon, ShieldAlert, Heart, Scale
} from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import ProtocolButton from '../components/ProtocolButton';
import { getAllScenarios } from '../services/ai/scenarioTemplates';

const Survival = () => {
    const survivalStories = TriageRouter.getStoriesByCategory('survival');
    const scenarios = getAllScenarios();

    return (
        <div className="page-container space-y-6">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Survival & Preparedness</h1>
                </div>
                <p className="text-sm text-slate-600">
                    Critical information for civil unrest, infrastructure failure, and emergency scenarios when systems fail.
                </p>
            </header>

            {/* Quick Protocols Section */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Emergency Protocols</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Tap a button to generate a personalized 5-step emergency protocol based on your context
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                    {scenarios.map(scenario => (
                        <ProtocolButton key={scenario.id} scenario={scenario} />
                    ))}
                </div>
            </section>

            {/* Priority 1: Civil Unrest & Breakdown of Order */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Civil Unrest & Breakdown of Order</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg shadow border border-red-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-red-600" />
                            Shelter-in-Place vs. Evacuation
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Decision framework for riots and civil disturbances</p>
                        <button className="text-red-600 font-medium hover:underline text-sm">
                            Decision Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg shadow border border-red-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Navigation className="w-5 h-5 text-red-600" />
                            Safe Navigation During Unrest
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Avoiding danger zones and crowd crush risks</p>
                        <button className="text-red-600 font-medium hover:underline text-sm">
                            Navigation Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg shadow border border-red-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Radio className="w-5 h-5 text-red-600" />
                            Communication When Networks Down
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Alternative communication methods and protocols</p>
                        <button className="text-red-600 font-medium hover:underline text-sm">
                            Comm Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg shadow border border-red-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-red-600" />
                            Resource Security
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Protecting food, water, and supplies</p>
                        <button className="text-red-600 font-medium hover:underline text-sm">
                            Security Guide (Coming Soon)
                        </button>
                    </div>
                </div>
            </section>

            {/* Priority 2: Infrastructure Failure */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Infrastructure Failure</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-amber-600" />
                            No Power
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Heating, cooling, food storage without electricity</p>
                        <button className="text-amber-600 font-medium hover:underline text-sm">
                            Power Outage Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Droplets className="w-5 h-5 text-blue-600" />
                            No Water Supply
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Finding, purifying, and storing water</p>
                        <Link to="/survival#water" className="text-blue-600 font-medium hover:underline text-sm">
                            Water Guide
                        </Link>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Wifi className="w-5 h-5 text-slate-600" />
                            No Internet/Phone
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Communication alternatives and offline resources</p>
                        <button className="text-slate-600 font-medium hover:underline text-sm">
                            Offline Comm Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <MapIcon className="w-5 h-5 text-green-600" />
                            No Transportation
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">Walking routes, bicycle paths, exit strategies</p>
                        <Link to="/map" className="text-green-600 font-medium hover:underline text-sm">
                            View Offline Maps
                        </Link>
                    </div>
                </div>
            </section>

            {/* Priority 3: Environmental & Weather Threats */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Environmental & Weather Emergencies</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Droplets className="w-5 h-5 text-blue-600" />
                            Flood Risk & Zones
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Environment Agency Flood Maps</p>
                        <Link to="/map?category=flood" className="text-blue-600 font-medium hover:underline text-sm">
                            View Flood Map
                        </Link>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Thermometer className="w-5 h-5 text-orange-600" />
                            Heat Wave / Extreme Cold
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Temperature emergency protocols</p>
                        <button className="text-orange-600 font-medium hover:underline text-sm">
                            Temperature Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-slate-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Wind className="w-5 h-5 text-slate-600" />
                            Severe Weather
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Storms, hurricanes, tornadoes</p>
                        <button className="text-slate-600 font-medium hover:underline text-sm">
                            Weather Guide (Coming Soon)
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <ShieldAlert className="w-5 h-5 text-orange-600" />
                            Emergency Plan
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Create your offline preparedness plan</p>
                        <button className="text-orange-600 font-medium hover:underline text-sm">
                            Manage Plan (Coming Soon)
                        </button>
                    </div>
                </div>
            </section>

            {/* Priority 4: Wilderness Survival Skills */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Wilderness Survival Skills</h2>
                <div className="bg-white p-4 rounded-lg shadow border border-green-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Interactive Survival Training
                    </h3>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                        {survivalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="block p-3 bg-green-50 rounded hover:bg-green-100 transition-colors border border-green-100"
                            >
                                <span className="font-medium text-green-800 capitalize">
                                    {item.keywords[0]}
                                </span>
                                <span className="block text-xs text-green-600">
                                    Interactive Guide
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="bg-white p-4 rounded-lg shadow border border-green-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <Tent className="w-5 h-5 text-green-600" />
                            Shelter Construction
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Building emergency shelters</p>
                        <Link to="/survival#shelter" className="text-green-600 font-medium hover:underline text-sm">
                            Shelter Guide
                        </Link>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                            <MapIcon className="w-5 h-5 text-blue-600" />
                            Water Safety (RNLI)
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">Sea and urban water safety</p>
                        <Link to="/survival#water-safety" className="text-blue-600 font-medium hover:underline text-sm">
                            Read Guide
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Access to Other Domains */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other Emergency Resources</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Link to="/health" className="flex items-center p-4 bg-white rounded-lg shadow border border-red-100 hover:border-red-300 hover:shadow-lg transition-all group">
                        <div className="bg-red-50 p-3 rounded-xl mr-4 group-hover:bg-red-100 transition-colors">
                            <Heart className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Health & First Aid</h3>
                            <p className="text-xs text-slate-500">Medical emergencies when hospitals unreachable</p>
                        </div>
                    </Link>

                    <Link to="/law" className="flex items-center p-4 bg-white rounded-lg shadow border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all group">
                        <div className="bg-blue-50 p-3 rounded-xl mr-4 group-hover:bg-blue-100 transition-colors">
                            <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Law & Rights</h3>
                            <p className="text-xs text-slate-500">Know your rights during police encounters or martial law</p>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Survival;
