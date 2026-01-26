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
                <div
                    className="min-h-screen flex items-center justify-center p-4 animate-fade-in"
                    style={{ background: 'var(--color-bg-primary)' }}
                >
                    <div
                        className="card max-w-md w-full p-6"
                        style={{ background: 'var(--color-bg-secondary)' }}
                    >
                        {/* Icon */}
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
                        </div>

                        {/* Title */}
                        <h1
                            className="text-xl font-bold text-center mb-2"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            Something went wrong
                        </h1>

                        {/* Description */}
                        <p
                            className="text-center mb-6"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            We encountered an unexpected error. Don't worry - your downloaded content is safe.
                        </p>

                        {/* Error Details (optional) */}
                        {showDetails && this.state.error && (
                            <div
                                className="rounded-lg p-3 mb-6 overflow-x-auto"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border-primary)'
                                }}
                            >
                                <p
                                    className="text-xs font-mono"
                                    style={{ color: 'var(--color-danger)' }}
                                >
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre
                                        className="text-xs font-mono mt-2 whitespace-pre-wrap"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        {this.state.errorInfo.componentStack?.slice(0, 500)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary btn-lg w-full"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="btn btn-secondary btn-lg w-full"
                            >
                                <Home className="w-5 h-5" />
                                Go to Home
                            </button>

                            <button
                                onClick={this.handleReload}
                                className="w-full text-center text-sm py-2 transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >
                                Reload the app
                            </button>
                        </div>

                        {/* Help Text */}
                        <p
                            className="text-xs text-center mt-6"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
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
                <div
                    className="card card-emergency p-4 text-center animate-fade-in"
                >
                    <AlertTriangle
                        className="w-6 h-6 mx-auto mb-2"
                        style={{ color: 'var(--color-danger)' }}
                    />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {message}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-3 text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
                        style={{ color: 'var(--color-danger)' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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
