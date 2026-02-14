/**
 * CitationChip.jsx — Interactive Source Citation Pill
 *
 * Pill-shaped button showing a source's category icon and title.
 * Tapping opens SourcePreviewSheet instead of navigating away.
 *
 * Refinery Standard:
 *   - Haptic: light on tap
 *   - Category color: medical=red, survival=orange, legal=purple
 */

import React from 'react';
import { Heart, Tent, Scale, BookOpen } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

const CATEGORY_MAP = {
    medical: { icon: Heart, className: 'citation-chip--medical' },
    health: { icon: Heart, className: 'citation-chip--medical' },
    survival: { icon: Tent, className: 'citation-chip--survival' },
    emergency: { icon: Tent, className: 'citation-chip--survival' },
    law: { icon: Scale, className: 'citation-chip--legal' },
    legal: { icon: Scale, className: 'citation-chip--legal' },
};

function getCategory(source) {
    const cat = (source.category || '').toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
        if (cat.includes(key)) return value;
    }
    return { icon: BookOpen, className: 'citation-chip--general' };
}

const CitationChip = React.memo(({ source, onPreview }) => {
    const { icon: Icon, className: catClass } = getCategory(source);

    const handleClick = async () => {
        await triggerHaptic('light');
        onPreview(source);
    };

    return (
        <button
            className={`citation-chip ${catClass}`}
            onClick={handleClick}
            aria-label={`View source: ${source.title}`}
        >
            <Icon className="citation-chip__icon" />
            <span className="citation-chip__title">{source.title}</span>
        </button>
    );
});

CitationChip.displayName = 'CitationChip';

export default CitationChip;
