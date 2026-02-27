/**
 * EmptyState - Unified empty state component
 * 
 * Provides consistent empty state styling across the app with:
 * - Icon display with configurable background
 * - Title and description text
 * - Optional action button
 * - Multiple size variants
 * 
 * Compliance: .clinerules §6 - Consistent UI patterns
 */

import React from 'react';

const sizeConfig = {
    sm: {
        iconSize: 32,
        iconBgSize: 56,
        titleSize: 'text-sm',
        descSize: 'text-xs',
        padding: 'py-6 px-4'
    },
    md: {
        iconSize: 40,
        iconBgSize: 72,
        titleSize: 'text-base',
        descSize: 'text-sm',
        padding: 'py-8 px-6'
    },
    lg: {
        iconSize: 48,
        iconBgSize: 88,
        titleSize: 'text-lg',
        descSize: 'text-sm',
        padding: 'py-12 px-8'
    }
};

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {Component} props.icon - Lucide icon component
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {Function} props.action - Optional action button config { label, onClick, icon }
 * @param {string} props.variant - 'default' | 'card' | 'inline'
 * @param {string} props.className - Additional CSS classes
 */
const EmptyState = ({
    icon: Icon,
    title,
    description,
    size = 'md',
    action = null,
    variant = 'default',
    className = ''
}) => {
    const config = sizeConfig[size];
    
    const baseClasses = `
        flex flex-col items-center justify-center text-center
        ${variant === 'card' ? 'bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)]' : ''}
        ${config.padding}
        ${className}
    `;

    return (
        <div className={baseClasses}>
            {/* Icon */}
            <div 
                className="rounded-full flex items-center justify-center mb-4 bg-[var(--color-bg-secondary)]"
                style={{ width: config.iconBgSize, height: config.iconBgSize }}
            >
                {Icon && (
                    <Icon 
                        className="text-[var(--color-text-muted)] opacity-50" 
                        size={config.iconSize} 
                    />
                )}
            </div>

            {/* Title */}
            <h3 className={`${config.titleSize} font-semibold text-[var(--color-text-primary)] mb-1`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className={`${config.descSize} text-[var(--color-text-muted)] max-w-xs`}>
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm font-medium transition-colors border border-[var(--color-border-primary)] flex items-center gap-2"
                >
                    {action.icon && <action.icon size={16} />}
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;