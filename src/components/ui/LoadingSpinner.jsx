import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Consistent loading spinner for async operations
 * @param {string} size - 'sm', 'md', 'lg' (default: 'md')
 * @param {string} label - Screen reader label (default: 'Loading')
 * @param {string} text - Optional visible loading text
 * @param {boolean} centered - Center in container (default: false)
 */
const LoadingSpinner = ({
    size = 'md',
    label = 'Loading',
    text,
    centered = false
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    const iconSize = {
        sm: 16,
        md: 24,
        lg: 32
    };

    const spinner = (
        <div
            className={`flex items-center gap-2 ${centered ? 'justify-center' : ''}`}
            role="status"
            aria-live="polite"
            aria-label={label}
        >
            <Loader
                size={iconSize[size]}
                className={`${sizeClasses[size]} animate-spin text-primary`}
                aria-hidden="true"
            />
            {text && <span className="text-muted text-sm">{text}</span>}
            <span className="sr-only">{label}</span>
        </div>
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center p-8">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
