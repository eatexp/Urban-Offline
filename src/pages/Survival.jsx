import React from 'react';
import { Link } from 'react-router-dom';
import { Tent, Droplets, Map as MapIcon, ShieldAlert } from 'lucide-react';

const Survival = () => {
    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Tent className="w-8 h-8" />
                Survival & Preparedness
            </h1>
            <p className="text-gray-600">
                Guides for flood risks, shelter, water safety, and emergency planning.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
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
