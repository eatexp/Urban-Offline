/**
 * IntentClassificationViz - Intent detection confidence visualization
 * 
 * Shows confidence scores for different intent classifications.
 * 
 * Compliance: .clinerules §6 - Native feel, premium animations
 */

import React from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion } from 'framer-motion';
import { Brain, Activity, BookOpen, Scale, Database, Target } from 'lucide-react';

// Intent configurations
const INTENT_CONFIG = {
    medical: { icon: Activity, color: '#ef4444', label: 'Medical' },
    survival: { icon: BookOpen, color: '#f59e0b', label: 'Survival' },
    legal: { icon: Scale, color: '#3b82f6', label: 'Legal' },
    general: { icon: Database, color: '#64748b', label: 'General' }
};

/**
 * Intent Classification Visualization
 */
const IntentClassificationViz = ({
    classifications = [],
    selectedIntent = null,
    confidence = 0,
    className = ''
}) => {
    // Default classifications if none provided
    const intents = classifications.length > 0 ? classifications : [
        { intent: 'medical', confidence: 0.3 },
        { intent: 'survival', confidence: 0.2 },
        { intent: 'legal', confidence: 0.1 },
        { intent: 'general', confidence: 0.4 }
    ];

    // Sort by confidence
    const sortedIntents = [...intents].sort((a, b) => b.confidence - a.confidence);

    return (
        <div className={`glass-card p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-slate-400" />
                <h4 className="text-xs font-semibold text-white">Intent Detection</h4>
            </div>

            {/* Confidence bars */}
            <div className="space-y-2">
                {sortedIntents.map(({ intent, confidence: intentConfidence }, index) => {
                    const config = INTENT_CONFIG[intent] || INTENT_CONFIG.general;
                    const Icon = config.icon;
                    const isSelected = selectedIntent === intent;
                    const isTop = index === 0;

                    return (
                        <motion.div
                            key={intent}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                                flex items-center gap-2 p-2 rounded-lg
                                ${isSelected ? 'bg-white/10' : 'bg-white/5'}
                                ${isTop ? 'ring-1 ring-white/20' : ''}
                            `}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${config.color}20` }}
                            >
                                <Icon size={16} style={{ color: config.color }} />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs ${isTop ? 'text-white font-medium' : 'text-slate-400'}`}>
                                        {config.label}
                                    </span>
                                    <span className={`text-xs ${isTop ? 'text-white' : 'text-slate-500'}`}>
                                        {Math.round(intentConfidence * 100)}%
                                    </span>
                                </div>

                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${intentConfidence * 100}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: config.color }}
                                    />
                                </div>
                            </div>

                            {isTop && (
                                <Target size={14} className="text-emerald-400" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Overall confidence */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Overall confidence</span>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence * 100}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                    <span className="text-xs text-white font-medium">
                        {Math.round(confidence * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IntentClassificationViz;