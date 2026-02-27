/**
 * CriticalContentBanner - Displays warning when critical emergency content is unavailable offline
 * 
 * Listens for 'critical-content-warning' events from InkService and displays
 * a prominent but dismissible banner alerting users that life-safety guides
 * (CPR, Choking, Bleeding) are not cached and won't work offline.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Wifi } from 'lucide-react';

const CriticalContentBanner = () => {
    const [warning, setWarning] = useState(null);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleWarning = (event) => {
            setWarning(event.detail);
            setIsDismissed(false);
        };

        window.addEventListener('critical-content-warning', handleWarning);

        return () => {
            window.removeEventListener('critical-content-warning', handleWarning);
        };
    }, []);

    if (!warning || isDismissed) {
        return null;
    }

    return (
        <div
            className="critical-content-banner animate-slide-down"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-sm border-b border-red-500/50">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">
                        {warning.message}
                    </p>
                    <p className="text-white/80 text-xs mt-1">
                        {warning.subMessage}
                    </p>

                    {/* Connect button when offline */}
                    {!navigator.onLine && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
                            <Wifi size={14} />
                            <span>Connect to download critical guides</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsDismissed(true)}
                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Dismiss warning"
                >
                    <X size={18} className="text-white/80" />
                </button>
            </div>
        </div>
    );
};

export default CriticalContentBanner;
