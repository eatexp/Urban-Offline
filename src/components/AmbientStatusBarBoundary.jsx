import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Error boundary for AmbientStatusBar
 * Ensures the status bar never takes down the entire layout
 */
class AmbientStatusBarBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[AmbientStatusBarBoundary] Status bar failed:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full hover:bg-slate-800 transition-colors"
                    aria-label="Status bar unavailable, tap to retry"
                >
                    <WifiOff className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-sans font-medium text-slate-400">
                        📡 Status unavailable
                    </span>
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                </button>
            );
        }

        return this.props.children;
    }
}

export default AmbientStatusBarBoundary;
