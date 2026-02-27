/* eslint-disable react-refresh/only-export-components -- Multiple exports (HOC, async wrapper, loading state) are intentional in this file */
/**
 * RouteErrorBoundary.jsx - Error boundary wrapper for routes
 * 
 * Catches errors in route components and provides recovery options.
 * Includes automatic retry and graceful fallbacks.
 * 
 * Compliance: .clinerules §6 - Error handling at architectural boundaries
 */

import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, WifiOff } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Route-level error boundary component
 * Catches errors from React Router routes
 */
export function RouteErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();

    // Handle different error types
    let errorMessage = 'An unexpected error occurred';
    let errorTitle = 'Something went wrong';
    let isOfflineError = false;

    if (isRouteErrorResponse(error)) {
        // Router-specific errors (404, etc.)
        switch (error.status) {
            case 404:
                errorTitle = 'Page Not Found';
                errorMessage = "The page you're looking for doesn't exist.";
                break;
            case 500:
                errorTitle = 'Server Error';
                errorMessage = 'Something went wrong on our end.';
                break;
            default:
                errorTitle = `Error ${error.status}`;
                errorMessage = error.statusText || errorMessage;
        }
    } else if (error instanceof Error) {
        // JavaScript errors
        errorMessage = error.message;

        // Check for offline/network errors
        if (error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('offline') ||
            !navigator.onLine) {
            isOfflineError = true;
            errorTitle = 'You\'re Offline';
            errorMessage = 'Please check your internet connection and try again.';
        }
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    const handleRetry = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        navigate('/', { replace: true });
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const getSeverityColor = () => {
        if (isOfflineError) return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    };

    const colors = getSeverityColor();
    const Icon = isOfflineError ? WifiOff : AlertTriangle;

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
                    <Icon className="w-10 h-10" style={{ color: colors.text }} />
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">
                        {errorTitle}
                    </h1>
                    <p className="text-slate-400 leading-relaxed">
                        {errorMessage}
                    </p>
                </div>

                {/* Error Details (development only) */}
                {import.meta.env.DEV && error instanceof Error && (
                    <div className="rounded-xl p-4 overflow-x-auto bg-slate-900/50 border border-white/5">
                        <p className="text-xs font-mono text-red-400">
                            {error.toString()}
                        </p>
                        {error.stack && (
                            <pre className="text-xs font-mono mt-3 whitespace-pre-wrap text-slate-500 max-h-32 overflow-y-auto">
                                {error.stack}
                            </pre>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all text-sm font-semibold shadow-lg shadow-blue-500/25"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleGoBack}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors text-sm"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </button>
                        <button
                            onClick={handleGoHome}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-colors text-sm"
                        >
                            <Home size={16} />
                            Home
                        </button>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-xs text-center text-slate-600">
                    If this keeps happening, try clearing the app cache or checking your connection.
                </p>
            </div>
        </div>
    );
}

/**
 * Async route wrapper with loading and error states
 */
export function AsyncRoute({ children, fallback }) {
    return (
        <React.Suspense fallback={fallback || <RouteLoading />}>
            {children}
        </React.Suspense>
    );
}

/**
 * Loading state for async routes
 */
function RouteLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
            </div>
        </div>
    );
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary(Component, options = {}) {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={options.fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default RouteErrorBoundary;