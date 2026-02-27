import React from 'react';
import {
    AlertTriangle, RefreshCw, Home, ChevronRight,
    HardDrive, Brain, Wifi, FileX, Shield, BatteryWarning,
    Thermometer, AlertCircle, RotateCcw, ArrowRight
} from 'lucide-react';
import { ErrorRecovery } from '../../utils/errorRecovery';

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI with recovery options instead of crashing.
 * 
 * Enhanced with error recovery strategies for actionable error handling.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            recoveryStrategy: null
        };
        this.recovery = ErrorRecovery.getInstance();
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Get recovery strategy
        const strategy = this.recovery.getRecoveryStrategy(error);

        this.setState({
            errorInfo,
            recoveryStrategy: strategy
        });

        // Log to error reporting service in production
        if (!import.meta.env.DEV) {
            // logErrorToService(error, errorInfo, strategy);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            recoveryStrategy: null
        });
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, recoveryStrategy: null });
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    handleRecoveryAction = async (action) => {
        try {
            await action.handler(this.state.recoveryStrategy?.context);

            // If successful, reset the error state
            if (action.id !== 'dismiss') {
                this.handleReset();
            }
        } catch (err) {
            console.error('Recovery action failed:', err);
        }
    };

    getIconForError = (iconName) => {
        const icons = {
            'storage': HardDrive,
            'brain': Brain,
            'wifi': Wifi,
            'file-x': FileX,
            'shield': Shield,
            'battery-warning': BatteryWarning,
            'thermometer': Thermometer,
            'alert-circle': AlertCircle,
            'alert-triangle': AlertTriangle,
            'download': RotateCcw,
            'clock': RotateCcw,
            'archive': FileX
        };
        return icons[iconName] || AlertTriangle;
    };

    getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' };
            case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' };
            case 'info': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' };
            default: return { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' };
        }
    };

    render() {
        if (this.state.hasError) {
            const { fallback, showDetails = false } = this.props;
            const { recoveryStrategy, error, errorInfo } = this.state;

            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Get error details from recovery strategy or use defaults
            const title = recoveryStrategy?.title || 'Something went wrong';
            const message = recoveryStrategy?.message || 'We encountered an unexpected error. Don\'t worry - your downloaded content is safe.';
            const actions = recoveryStrategy?.actions || [];
            const severity = recoveryStrategy?.severity || 'error';
            const iconName = recoveryStrategy?.icon || 'alert-triangle';

            const ErrorIcon = this.getIconForError(iconName);
            const colors = this.getSeverityColor(severity);

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 animate-fade-in">
                    <div className="glass-card max-w-md w-full p-6 space-y-6">
                        {/* Icon */}
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                            style={{
                                background: colors.bg,
                                border: `1px solid ${colors.border}`
                            }}
                        >
                            <ErrorIcon
                                className="w-10 h-10"
                                style={{ color: colors.text }}
                            />
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold text-white">
                                {title}
                            </h1>
                            <p className="text-slate-400 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Error Details (optional, development only) */}
                        {showDetails && error && (
                            <div className="rounded-xl p-4 overflow-x-auto bg-slate-900/50 border border-white/5">
                                <p className="text-xs font-mono text-red-400">
                                    {error.toString()}
                                </p>
                                {errorInfo && (
                                    <pre className="text-xs font-mono mt-3 whitespace-pre-wrap text-slate-500">
                                        {errorInfo.componentStack?.slice(0, 500)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Recovery Actions */}
                        {actions.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                    What you can do:
                                </p>
                                <div className="space-y-2">
                                    {actions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={() => this.handleRecoveryAction(action)}
                                            className={`
                                                w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl
                                                text-sm font-semibold transition-all duration-200
                                                ${action.primary
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                }
                                            `}
                                        >
                                            {action.primary && <ArrowRight size={16} />}
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Default Actions */}
                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm font-medium"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors text-sm"
                                >
                                    <Home size={16} />
                                    Home
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors text-sm"
                                >
                                    <RotateCcw size={16} />
                                    Reload
                                </button>
                            </div>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-center text-slate-600">
                            If this keeps happening, try clearing the app cache or contacting support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Compact error boundary for smaller components
 */
export class CompactErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, recoveryStrategy: null };
        this.recovery = ErrorRecovery.getInstance();
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('CompactErrorBoundary caught:', error, errorInfo);
        const strategy = this.recovery.getRecoveryStrategy(error);
        this.setState({ recoveryStrategy: strategy });
    }

    render() {
        if (this.state.hasError) {
            const { message = 'This section failed to load', onRetry } = this.props;
            const { recoveryStrategy } = this.state;

            const severity = recoveryStrategy?.severity || 'error';
            const getColors = () => {
                switch (severity) {
                    case 'critical': return 'border-red-500/30 bg-red-500/10 text-red-400';
                    case 'error': return 'border-red-500/20 bg-red-500/5 text-red-400';
                    case 'warning': return 'border-amber-500/20 bg-amber-500/5 text-amber-400';
                    case 'info': return 'border-blue-500/20 bg-blue-500/5 text-blue-400';
                    default: return 'border-slate-500/20 bg-slate-500/5 text-slate-400';
                }
            };

            return (
                <div className={`rounded-xl p-4 text-center border ${getColors()} animate-fade-in`}>
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">
                        {recoveryStrategy?.message || message}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, recoveryStrategy: null });
                            onRetry?.();
                        }}
                        className="mt-3 text-sm flex items-center justify-center gap-1 mx-auto hover:underline transition-all"
                    >
                        Retry <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;