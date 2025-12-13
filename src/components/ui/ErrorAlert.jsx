import React from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

/**
 * Consistent error/warning/info alert component
 * @param {string} type - 'error', 'warning', 'info' (default: 'error')
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {function} onDismiss - Optional dismiss callback
 * @param {function} onRetry - Optional retry callback
 */
const ErrorAlert = ({
    type = 'error',
    title,
    message,
    onDismiss,
    onRetry
}) => {
    const config = {
        error: {
            icon: AlertCircle,
            bgClass: 'bg-red-900/20 border-red-800',
            textClass: 'text-red-400',
            titleClass: 'text-red-300'
        },
        warning: {
            icon: AlertTriangle,
            bgClass: 'bg-yellow-900/20 border-yellow-800',
            textClass: 'text-yellow-400',
            titleClass: 'text-yellow-300'
        },
        info: {
            icon: Info,
            bgClass: 'bg-blue-900/20 border-blue-800',
            textClass: 'text-blue-400',
            titleClass: 'text-blue-300'
        }
    };

    const { icon: Icon, bgClass, textClass, titleClass } = config[type];

    return (
        <div
            className={`p-4 rounded-lg border ${bgClass} flex items-start gap-3`}
            role="alert"
            aria-live="assertive"
        >
            <Icon className={`flex-shrink-0 mt-0.5 ${textClass}`} size={20} aria-hidden="true" />
            <div className="flex-1">
                {title && <p className={`font-semibold ${titleClass}`}>{title}</p>}
                {message && <p className={`text-sm ${textClass}`}>{message}</p>}
                {(onRetry || onDismiss) && (
                    <div className="mt-3 flex gap-2">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className={`text-sm font-medium ${titleClass} hover:underline`}
                            >
                                Try again
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className={`text-sm font-medium ${textClass} hover:underline`}
                            >
                                Dismiss
                            </button>
                        )}
                    </div>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className={`${textClass} hover:opacity-80`}
                    aria-label="Dismiss alert"
                >
                    <XCircle size={18} aria-hidden="true" />
                </button>
            )}
        </div>
    );
};

export default ErrorAlert;
