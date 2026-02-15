/**
 * AIModels Page - AI Model Management
 * 
 * Uses the enhanced ModelMarketplaceEnhanced component for a premium,
 * device-adaptive model browsing experience with:
 * - Intelligent device-aware sorting
 * - "Choose Any" functionality with warnings
 * - Premium glass morphism UI
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 */

import React from 'react';
import ModelMarketplaceEnhanced from '../components/ModelMarketplaceEnhanced';

const AIModels = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <ModelMarketplaceEnhanced />
        </div>
    );
};

export default AIModels;
