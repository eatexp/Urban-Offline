/**
 * DeviceStatusBar Component
 * 
 * Displays real-time device capability status (Battery, Thermal, RAM).
 */

import React from 'react';
import { Battery, Thermometer, Cpu, Smartphone, Wifi, WifiOff } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion.div JSX access not detected by ESLint
import { motion } from 'framer-motion';

const DeviceStatusBar = ({ profile }) => {
    if (!profile) return null;

    const { hardware, runtime, recommendations } = profile;

    // Helper for status colors
    const getStatusColor = (status) => {
        if (status === 'critical' || status === 'poor') return 'text-red-400';
        if (status === 'warning' || status === 'fair') return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 px-4 py-2 bg-black/20 backdrop-blur-md border-b border-white/5 text-xs font-medium text-slate-400 overflow-x-auto"
        >
            <div className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-blue-400" />
                <span className="text-slate-300">
                    {hardware.gpu.hasWebGPU ? 'AI Ready' : 'CPU Mode'}
                </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
                <Battery size={14} className={getStatusColor(runtime.battery.isLowPower ? 'warning' : 'good')} />
                <span>{Math.round(runtime.battery.level * 100)}%</span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
                <Thermometer size={14} className={getStatusColor(runtime.thermal.state)} />
                <span className="capitalize">{runtime.thermal.state}</span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-400" />
                <span>{Math.round(hardware.memory.total / 1024 / 1024 / 1024)}GB RAM</span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
                {runtime.network.online ? (
                    <Wifi size={14} className="text-green-400" />
                ) : (
                    <WifiOff size={14} className="text-slate-500" />
                )}
                <span>{runtime.network.effectiveType.toUpperCase()}</span>
            </div>

            <div className="ml-auto hidden sm:block">
                <span className="text-slate-500">
                    Rec: <span className="text-slate-300">{recommendations.tier}</span>
                </span>
            </div>
        </motion.div>
    );
};

export default DeviceStatusBar;
