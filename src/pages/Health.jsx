import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Thermometer, HeartPulse, Droplets, AlertCircle } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

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
        <div className="page-container">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <Heart size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Health & First Aid</h1>
                </div>
                <p className="text-sm text-muted">Emergency medical protocols and triage.</p>
            </header>

            <div className="grid gap-4">
                {healthStories.map((route) => {
                    const Icon = getIcon(route.story);
                    return (
                        <Link
                            key={route.story}
                            to={`/triage/${route.story}`}
                            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-left hover:border-red-400 hover:shadow-md transition-all flex items-start gap-4"
                        >
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <Icon size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{getTitle(route.story)}</h3>
                                <p className="text-sm text-slate-500">{getDescription(route.story)}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Health;
