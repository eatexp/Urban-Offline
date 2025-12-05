import React, { useState } from 'react';
import { Heart, Activity, Thermometer } from 'lucide-react';
import TriageScreen from '../components/TriageScreen';

const Health = () => {
    const [activeTriage, setActiveTriage] = useState(null);

    return (
        <div className="page-container p-4">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <Heart size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Health & First Aid</h1>
                </div>
                <p className="text-slate-600">Emergency medical protocols and triage.</p>
            </header>

            {activeTriage ? (
                <TriageScreen
                    storyFile={activeTriage}
                    onClose={() => setActiveTriage(null)}
                />
            ) : (
                <div className="grid gap-4">
                    <button
                        onClick={() => setActiveTriage('hypothermia.ink.json')}
                        className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-left hover:border-blue-400 transition-colors flex items-start gap-4"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Thermometer size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Hypothermia Triage</h3>
                            <p className="text-sm text-slate-500">Assess and treat cold exposure.</p>
                        </div>
                    </button>

                    {/* Placeholder for others */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl border-dashed flex items-center justify-center text-slate-400 text-sm">
                        More Triage Flows Coming Soon
                    </div>
                </div>
            )}
        </div>
    );
};

export default Health;
