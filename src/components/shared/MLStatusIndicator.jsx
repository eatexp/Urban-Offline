import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

/**
 * MLStatusIndicator - Shows the current status of the ML intent classifier
 * 
 * Status states:
 * - 'loading': ML model is being loaded
 * - 'ready': ML model is ready (indicator hidden)
 * - 'failed': ML model failed, using keyword fallback
 */
const MLStatusIndicator = () => {
    const [status, setStatus] = useState('loading');
    const [mode, setMode] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            setStatus(e.detail.status);
            if (e.detail.mode) {
                setMode(e.detail.mode);
            }
        };

        window.addEventListener('intent-classifier-status', handler);
        return () => window.removeEventListener('intent-classifier-status', handler);
    }, []);

    // Hide when ML is ready
    if (status === 'ready' && mode !== 'offline') {
        return null;
    }

    // Failed or offline mode - show degraded indicator
    if (status === 'failed' || mode === 'offline') {
        return (
            <div
                className="flex items-center gap-1 px-2 py-0.5 text-xs text-amber-500 bg-amber-500/10 rounded-full"
                title="ML model unavailable - using keyword matching for emergency detection"
            >
                <AlertCircle size={10} />
                <span>Keyword mode</span>
            </div>
        );
    }

    // Loading state
    return (
        <div
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 bg-slate-700/50 rounded-full animate-pulse"
            title="Loading AI model for better emergency detection..."
        >
            <Sparkles size={10} />
            <span>AI loading...</span>
        </div>
    );
};

export default React.memo(MLStatusIndicator);
