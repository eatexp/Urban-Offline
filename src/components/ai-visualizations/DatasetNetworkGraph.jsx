/**
 * DatasetNetworkGraph - Network visualization of dataset relationships
 * 
 * Shows how datasets connect and relate to each other based on query patterns.
 * 
 * Compliance: .clinerules §6 - Native feel, premium animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BookOpen, Scale, Database, Network } from 'lucide-react';

// Node configurations
const NODE_CONFIG = {
    health: { icon: Activity, color: '#ef4444', label: 'Health' },
    survival: { icon: BookOpen, color: '#f59e0b', label: 'Survival' },
    law: { icon: Scale, color: '#3b82f6', label: 'Legal' },
    guides: { icon: Database, color: '#64748b', label: 'Guides' }
};

/**
 * Dataset Network Graph Component
 */
const DatasetNetworkGraph = ({ 
    activeDatasets = [], 
    queryActivity = [],
    size = 'medium',
    className = '' 
}) => {
    // Simple visualization for now - can be enhanced with D3 or similar
    const datasets = ['health', 'survival', 'law', 'guides'];
    const isActive = (id) => activeDatasets.includes(id);
    
    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-64 h-64'
    };

    return (
        <div className={`glass-card p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Network size={16} className="text-slate-400" />
                <h4 className="text-xs font-semibold text-white">Dataset Network</h4>
            </div>
            
            <div className={`relative ${sizeClasses[size]} mx-auto`}>
                {/* Center hub */}
                <motion.div
                    className="absolute left-1/2 top-1/2 w-12 h-12 -ml-6 -mt-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <span className="text-xs text-white font-medium">Query</span>
                </motion.div>

                {/* Dataset nodes positioned around center */}
                {datasets.map((datasetId, index) => {
                    const config = NODE_CONFIG[datasetId];
                    const Icon = config.icon;
                    const active = isActive(datasetId);
                    const angle = (index * 90) * (Math.PI / 180);
                    const radius = size === 'small' ? 40 : size === 'medium' ? 60 : 80;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={datasetId}
                            className={`
                                absolute w-10 h-10 -ml-5 -mt-5 rounded-full 
                                flex items-center justify-center
                                border-2 transition-all duration-300
                                ${active 
                                    ? 'bg-white/10 border-white/40' 
                                    : 'bg-white/5 border-white/10 opacity-50'
                                }
                            `}
                            style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`
                            }}
                            animate={active ? { 
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                    `0 0 0 0 ${config.color}00`,
                                    `0 0 20px 5px ${config.color}40`,
                                    `0 0 0 0 ${config.color}00`
                                ]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Icon 
                                size={18} 
                                style={{ color: active ? config.color : '#64748b' }} 
                            />
                        </motion.div>
                    );
                })}

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {datasets.map((datasetId, index) => {
                        if (!isActive(datasetId)) return null;
                        
                        const angle = (index * 90) * (Math.PI / 180);
                        const radius = size === 'small' ? 40 : size === 'medium' ? 60 : 80;
                        const x1 = 50;
                        const y1 = 50;
                        const x2 = 50 + (Math.cos(angle) * radius) / (size === 'small' ? 1.5 : size === 'medium' ? 2.5 : 3.5);
                        const y2 = 50 + (Math.sin(angle) * radius) / (size === 'small' ? 1.5 : size === 'medium' ? 2.5 : 3.5);

                        return (
                            <motion.line
                                key={datasetId}
                                x1={`${x1}%`}
                                y1={`${y1}%`}
                                x2={`${x2}%`}
                                y2={`${y2}%`}
                                stroke={NODE_CONFIG[datasetId].color}
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.5 }}
                                transition={{ duration: 1 }}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {datasets.map(datasetId => {
                    const config = NODE_CONFIG[datasetId];
                    const active = isActive(datasetId);
                    return (
                        <div 
                            key={datasetId}
                            className={`flex items-center gap-1 text-[10px] ${active ? 'text-slate-300' : 'text-slate-600'}`}
                        >
                            <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: active ? config.color : '#475569' }}
                            />
                            <span>{config.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DatasetNetworkGraph;