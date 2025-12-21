import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({ errorInfo });

        // In production, you might want to log to an error reporting service
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const { fallback, showDetails = false } = this.props;

            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold text-slate-900 text-center mb-2">
                            Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="text-slate-500 text-center mb-6">
                            We encountered an unexpected error. Don't worry - your downloaded content is safe.
                        </p>

                        {/* Error Details (optional) */}
                        {showDetails && this.state.error && (
                            <div className="bg-slate-50 rounded-lg p-3 mb-6 overflow-x-auto">
                                <p className="text-xs font-mono text-slate-600">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs font-mono text-slate-400 mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack?.slice(0, 500)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go to Home
                            </button>

                            <button
                                onClick={this.handleReload}
                                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
                            >
                                Reload the app
                            </button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-slate-400 text-center mt-6">
                            If this keeps happening, try clearing the app cache.
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
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('CompactErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const { message = 'This section failed to load' } = this.props;

            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-700">{message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-2 text-sm text-red-600 hover:underline flex items-center justify-center gap-1 mx-auto"
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

