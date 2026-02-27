import React from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

/**
 * Error boundary for MiniMapCard
 * Prevents a single broken map card from crashing the entire chat thread
 */
class MiniMapCardBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[MiniMapCardBoundary] Map card failed:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            const { query } = this.props;

            return (
                <div className="w-full rounded-lg bg-slate-950 border border-amber-900/30 mt-3 mb-1 p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-amber-400 font-mono">
                                ⚠️ Map card failed to render
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                                Location: <span className="font-mono">{query || 'Unknown'}</span>
                            </p>
                            <button
                                onClick={this.handleRetry}
                                className="mt-3 flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MiniMapCardBoundary;
