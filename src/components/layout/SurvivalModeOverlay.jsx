/**
 * SurvivalModeOverlay
 * 
 * A minimal, high-contrast UI overlay that displays when Survival Mode
 * (Blackout Protocol) is active. Provides battery status, current model
 * information, and manual exit functionality.
 * 
 * Visual Design:
 * - Sticky header at top of screen
 * - Dark background with amber/red accent
 * - Battery level with color coding
 * - Exit button with confirmation
 */

import React, { useState, useEffect } from 'react';
import { Zap, Battery, BatteryCharging, X, AlertTriangle, Cpu } from 'lucide-react';
import ContextManager from '../../services/context/ContextManager';
import SurvivalModeService from '../../services/power/SurvivalModeService';
import TransformersEngine from '../../services/ai/TransformersEngine';

/**
 * SurvivalModeOverlay Component
 * Renders when Survival Mode is active
 */
const SurvivalModeOverlay = () => {
  const [isActive, setIsActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  const contextManager = ContextManager.getInstance();

  useEffect(() => {
    // Initial state sync (deferred to prevent cascading renders)
    const state = contextManager.getState();
    const newActive = state.survivalMode?.active || false;
    const newBattery = parseInt(state.device?.battery) || 100;
    const newCharging = state.device?.charging || false;

    // Check if any state actually needs updating
    if (isActive !== newActive || batteryLevel !== newBattery || isCharging !== newCharging) {
      queueMicrotask(() => {
        setIsActive(newActive);
        setBatteryLevel(newBattery);
        setIsCharging(newCharging);
      });
    }

    // Get current model
    const model = TransformersEngine.getInstance().getCurrentModel();
    if ((model?.id !== currentModel?.id) || (!model && currentModel) || (model && !currentModel)) {
      queueMicrotask(() => {
        setCurrentModel(model);
      });
    }

    // Subscribe to context changes
    const unsubscribe = contextManager.subscribe((newState) => {
      setIsActive(newState.survivalMode?.active || false);
      setBatteryLevel(parseInt(newState.device?.battery) || 100);
      setIsCharging(newState.device?.charging || false);

      // Update model when it changes
      const newModel = TransformersEngine.getInstance().getCurrentModel();
      setCurrentModel(current => {
        if (!newModel && !current) return current;
        if (!newModel || !current) return newModel;
        if (newModel.id !== current.id) return newModel;
        return current;
      });
    });

    return () => unsubscribe();
  }, [contextManager, isActive, batteryLevel, isCharging, currentModel]);

  // Don't render if survival mode is not active
  if (!isActive) return null;

  /**
   * Get battery color based on level
   */
  const getBatteryColor = () => {
    if (batteryLevel <= 10) return 'text-red-400';
    if (batteryLevel <= 20) return 'text-amber-400';
    return 'text-emerald-400';
  };

  /**
   * Handle exit button click
   */
  const handleExitClick = () => {
    setShowConfirmExit(true);
  };

  /**
   * Handle confirm exit
   */
  const handleConfirmExit = async () => {
    try {
      await SurvivalModeService.getInstance().deactivate();
      setShowConfirmExit(false);
    } catch (error) {
      console.error('Failed to exit survival mode:', error);
    }
  };

  /**
   * Handle cancel exit
   */
  const handleCancelExit = () => {
    setShowConfirmExit(false);
  };

  // Determine battery icon component to use
  const BatteryIconComponent = isCharging ? BatteryCharging : Battery;
  const batteryColor = getBatteryColor();

  return (
    <>
      {/* Main Survival Mode Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-950 border-b border-amber-900/50 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-950/50 border border-amber-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-400 tracking-wide">
                  SURVIVAL MODE
                </h2>
                <p className="text-[10px] text-amber-600 uppercase tracking-wider">
                  Blackout Protocol Active
                </p>
              </div>
            </div>

            {/* Center: Battery & Model Info */}
            <div className="hidden sm:flex items-center gap-6">
              {/* Battery Level */}
              <div className="flex items-center gap-2">
                <BatteryIconComponent className={`w-4 h-4 ${batteryColor}`} />
                <span className={`text-sm font-mono font-bold ${batteryColor}`}>
                  {batteryLevel}%
                </span>
                {isCharging && (
                  <span className="text-[10px] text-emerald-400">Charging</span>
                )}
              </div>

              {/* Current Model */}
              {currentModel && (
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">
                    {currentModel.name}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Exit Button */}
            <button
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-400 hover:text-slate-300 transition-colors"
              aria-label="Exit Survival Mode"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Exit</span>
            </button>
          </div>

          {/* Mobile: Battery & Model (shown only on small screens) */}
          <div className="sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <BatteryIconComponent className={`w-4 h-4 ${batteryColor}`} />
              <span className={`text-sm font-mono font-bold ${batteryColor}`}>
                {batteryLevel}%
              </span>
              {isCharging && (
                <span className="text-[10px] text-emerald-400">Charging</span>
              )}
            </div>
            {currentModel && (
              <span className="text-xs text-slate-500">
                {currentModel.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-[72px] sm:h-[56px]" />

      {/* Exit Confirmation Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-200 text-center mb-2">
              Exit Survival Mode?
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-400 text-center mb-6">
              Exiting Survival Mode will restore full power consumption, including
              haptics, audio, and your previous AI model. Battery life may decrease
              significantly.
            </p>

            {/* Battery Info */}
            <div className="bg-slate-950 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Battery</span>
                <span className={`text-sm font-mono font-bold ${batteryColor}`}>
                  {batteryLevel}%
                </span>
              </div>
              {batteryLevel <= 20 && (
                <p className="text-xs text-amber-500 mt-1">
                  Warning: Battery level is low
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Stay in Survival Mode
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2.5 bg-amber-900/50 hover:bg-amber-900/70 border border-amber-800 text-amber-300 rounded-lg text-sm font-medium transition-colors"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurvivalModeOverlay;