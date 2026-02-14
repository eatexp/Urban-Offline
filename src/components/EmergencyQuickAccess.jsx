import React, { memo } from 'react';
import { Navigation, Heart } from 'lucide-react';

const EmergencyQuickAccess = memo(({ onEmergencyPress }) => {
    return (
        <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-5 border border-red-500/30">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h3 className="font-bold text-red-400">Emergency Quick Access</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">Immediate access to critical emergency protocols</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        className="btn btn-emergency btn-sm"
                        onClick={() => onEmergencyPress('/protocol/evacuate-now')}
                    >
                        <Navigation size={16} />
                        Evacuate Now
                    </button>
                    <button
                        className="btn btn-emergency btn-sm"
                        onClick={() => onEmergencyPress('/triage/health/cpr.ink.json')}
                    >
                        <Heart size={16} />
                        Medical Alert
                    </button>
                </div>
            </div>
        </section>
    );
});

export default EmergencyQuickAccess;
