/**
 * CategoryGrid — Visual Content Discovery Grid
 *
 * Displays content categories as rich cards with:
 * - Category icons and colors
 * - Installed pack counts per category
 * - Quick filtering capabilities
 * - Visual appeal for content browsing
 * 
 * Compliance: .clinerules §6 - Uses shared category configuration
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getAllCategories, getCategoryConfig } from '../config/categories';

const styles = `
.category-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}

@media (min-width: 640px) {
    .category-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1024px) {
    .category-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

.category-card {
    position: relative;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.08));
    background: var(--color-bg-secondary, rgba(15, 23, 42, 0.6));
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.category-card::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.category-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.category-card:hover::before {
    opacity: 1;
}

.category-card.active {
    border-width: 2px;
}

.category-card__icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.05);
    transition: transform 0.3s ease;
}

.category-card:hover .category-card__icon-wrapper {
    transform: scale(1.05);
}

.category-card__icon {
    width: 24px;
    height: 24px;
}

.category-card__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #f1f5f9);
    margin: 0 0 4px;
    line-height: 1.3;
}

.category-card__count {
    font-size: 12px;
    color: var(--color-text-muted, #64748b);
    margin: 0 0 8px;
}

.category-card__description {
    font-size: 11px;
    color: var(--color-text-secondary, #94a3b8);
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.category-card__arrow {
    position: absolute;
    top: 16px;
    right: 16px;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s ease;
}

.category-card:hover .category-card__arrow {
    opacity: 1;
    transform: translateX(0);
}

/* Compact variant for tighter spaces */
.category-grid--compact {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.category-grid--compact .category-card {
    padding: 12px;
    border-radius: 12px;
}

.category-grid--compact .category-card__icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    margin-bottom: 8px;
}

.category-grid--compact .category-card__icon {
    width: 20px;
    height: 20px;
}

.category-grid--compact .category-card__name {
    font-size: 12px;
}

.category-grid--compact .category-card__description {
    display: none;
}

/* Horizontal scroll variant for mobile */
.category-grid--horizontal {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.category-grid--horizontal::-webkit-scrollbar {
    display: none;
}

.category-grid--horizontal .category-card {
    flex-shrink: 0;
    width: 160px;
}
`;

/**
 * Category Grid Component
 *
 * @param {Object} props
 * @param {Array} props.packs - Array of content packs with category info
 * @param {Array} props.models - Array of AI models
 * @param {string} props.activeCategory - Currently selected category ID
 * @param {Function} props.onCategorySelect - Callback when category is clicked
 * @param {string} props.variant - 'default' | 'compact' | 'horizontal'
 * @param {boolean} props.showCounts - Whether to show pack counts
 */
const CategoryGrid = ({
    packs = [],
    models = [],
    activeCategory = null,
    onCategorySelect,
    variant = 'default',
    showCounts = true
}) => {
    // Get categories from shared config
    const categories = getAllCategories();

    // Count packs per category
    const categoryCounts = packs.reduce((acc, pack) => {
        const config = getCategoryConfig(pack.category);
        const categoryId = config.id;
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
    }, {});

    // Add AI models count
    categoryCounts.ai = models.filter(m => m.isInstalled).length;

    const gridClass = variant === 'compact' ? 'category-grid--compact' :
                      variant === 'horizontal' ? 'category-grid--horizontal' : '';

    return (
        <>
            <style>{styles}</style>
            <div className={`category-grid ${gridClass}`}>
                {categories.map((category) => {
                    const Icon = category.icon;
                    const count = categoryCounts[category.id] || 0;
                    const isActive = activeCategory === category.id;
                    const isEmpty = count === 0 && category.id !== 'ai';

                    return (
                        <div
                            key={category.id}
                            className={`category-card ${isActive ? 'active' : ''}`}
                            style={{
                                background: isActive ? category.bgGradient : undefined,
                                borderColor: isActive ? category.borderColor : undefined,
                                opacity: isEmpty ? 0.6 : 1
                            }}
                            onClick={() => onCategorySelect?.(category.id)}
                        >
                            <div
                                className="category-card__icon-wrapper"
                                style={{ background: category.bgGradient }}
                            >
                                <Icon
                                    className="category-card__icon"
                                    style={{ color: category.color }}
                                />
                            </div>
                            <h3 className="category-card__name">{category.name}</h3>
                            {showCounts && (
                                <p className="category-card__count">
                                    {count > 0 ? `${count} installed` : 'No content'}
                                </p>
                            )}
                            {variant !== 'compact' && (
                                <p className="category-card__description">
                                    {category.description}
                                </p>
                            )}
                            <ChevronRight
                                className="category-card__arrow"
                                size={16}
                                style={{ color: category.color }}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default CategoryGrid;