import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log error to console in development
        console.error('Application Error:', error, errorInfo);

        // In production, you could send this to an error tracking service
        // if (import.meta.env.PROD) {
        //     sendToErrorTracking(error, errorInfo);
        // }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="page-container flex flex-col items-center justify-center text-center" style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
                    <div className="card" style={{ maxWidth: '400px', padding: '2rem' }}>
                        <AlertTriangle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
                        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-muted mb-6">
                            The app encountered an unexpected error. Your data is safe.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-4 text-left" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                                <summary className="cursor-pointer text-muted">Error Details</summary>
                                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', color: 'var(--color-danger)' }}>
                                    {this.state.error.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </details>
                        )}

                        <div className="flex flex-col gap-sm">
                            <button
                                onClick={this.handleReload}
                                className="btn btn-primary flex items-center justify-center gap-sm"
                            >
                                <RefreshCw size={16} />
                                Reload App
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn btn-outline flex items-center justify-center gap-sm"
                            >
                                <Home size={16} />
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
