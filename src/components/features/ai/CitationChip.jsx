/**
 * CitationChip.jsx — Interactive Source Citation Pill
 *
 * Pill-shaped button showing a source's category icon and title.
 * Tapping opens SourcePreviewSheet instead of navigating away.
 *
 * Refinery Standard:
 *   - Haptic: light on tap
 *   - Category color: medical=red, survival=orange, legal=purple
 * 
 * Compliance: .clinerules §6 - Uses shared category configuration
 */

import React from 'react';
import { getCategoryConfig } from '../../../config/categories';
import { triggerHaptic } from '../../../utils/haptics';

const CitationChip = React.memo(({ source, onPreview }) => {
    // Use shared category configuration for consistent styling
    const categoryConfig = getCategoryConfig(source.category);
    const Icon = categoryConfig.icon;

    const handleClick = async () => {
        await triggerHaptic('light');
        onPreview(source);
    };

    return (
        <button
            className={`citation-chip ${categoryConfig.chipClass}`}
            onClick={handleClick}
            aria-label={`View source: ${source.title}`}
            style={{
                '--category-color': categoryConfig.color,
                '--category-bg': categoryConfig.bgGradient
            }}
        >
            <Icon className="citation-chip__icon" />
            <span className="citation-chip__title">{source.title}</span>
        </button>
    );
});

CitationChip.displayName = 'CitationChip';

export default CitationChip;