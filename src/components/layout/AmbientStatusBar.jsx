import React, { useState, useEffect, useRef } from 'react';
import { Battery, Wifi, WifiOff, MapPin, Database, ChevronDown, Activity, Satellite, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContextManager from '../../services/context/ContextManager';
import TactileSignatureEngine from '../../services/haptics/TactileSignatureEngine.js';
import SurvivalModeService from '../../services/power/SurvivalModeService';

const AmbientStatusBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [device, setDevice] = useState(ContextManager.getInstance().state.device);
  const [map, setMap] = useState(ContextManager.getInstance().state.map);
  const [survivalMode, setSurvivalMode] = useState(ContextManager.getInstance().state.survivalMode);
  const [system, setSystem] = useState(ContextManager.getInstance().state.system);
  const [showSurvivalPrompt, setShowSurvivalPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const manager = ContextManager.getInstance();

    // Initial sync via direct property (deferred to prevent cascading renders)
    const currentState = manager.state;
    queueMicrotask(() => {
      setDevice(currentState.device);
      setMap(currentState.map);
      setSurvivalMode(currentState.survivalMode);
      setSystem(currentState.system);
    });

    // Subscribe to updates
    const unsubscribe = manager.subscribe((newState) => {
      setDevice(newState.device);
      setMap(newState.map);
      setSurvivalMode(newState.survivalMode);
      setSystem(newState.system);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Auto-prompt for survival mode at critical battery
  useEffect(() => {
    const batteryLevel = device?.battery ? parseInt(device.battery) : 100;
    const survivalModeActive = survivalMode?.active || false;

    // Defer setState to prevent cascading renders
    if (batteryLevel <= 10 && !survivalModeActive && !promptDismissed && !showSurvivalPrompt) {
      queueMicrotask(() => {
        setShowSurvivalPrompt(true);
      });
    }
  }, [device?.battery, survivalMode?.active, promptDismissed, showSurvivalPrompt]);

  // Close popover on outside click
  useEffect(() => {
    if (isOpen) {
      const close = (e) => !e.target.closest('.ambient-status-bar') && setIsOpen(false);
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }
  }, [isOpen]);

  const isOnline = device?.connection !== 'Offline';

  // Filter out 'Unknown' to prevent "Sector: Unknown" display
  const rawSector = map?.activeSector;
  const activeSector = (rawSector && rawSector !== 'Unknown') ? rawSector : null;
  const statusText = activeSector ? `Sector: ${activeSector}` : 'System Online';

  // Helper to safely format coordinates (Array [lng, lat] access)
  const formatCoords = (center) => {
    if (!center || !Array.isArray(center) || center.length < 2) return '--';
    return `${center[1].toFixed(4)}, ${center[0].toFixed(4)}`; // Lat, Lng
  };

  // Helper to format battery (Prevent double %)
  const formatBattery = (val) => {
    if (!val) return '--';
    return val.toString().includes('%') ? val : `${val}%`;
  };

  // Helper to format storage (bytes to GB with color coding)
  // ENHANCED: [Phase 3b] Real storage metrics from navigator.storage.estimate()
  const formatStorage = (storage) => {
    // If storage API unavailable or quota is 0, show unavailable
    if (!storage || storage.quota === 0) {
      return { text: 'N/A', detail: 'Storage API unavailable', color: 'text-slate-500' };
    }

    const availableGB = storage.available / (1024 ** 3); // Convert bytes to GB
    const usedGB = storage.used / (1024 ** 3);
    const quotaGB = storage.quota / (1024 ** 3);

    let color = 'text-emerald-400'; // Healthy (green)
    if (availableGB < 1) {
      color = 'text-red-400'; // Critical (red)
    } else if (availableGB < 5) {
      color = 'text-amber-400'; // Warning (amber)
    }

    return {
      text: `${availableGB.toFixed(1)} GB free`,
      detail: `${usedGB.toFixed(1)} / ${quotaGB.toFixed(1)} GB used`,
      color
    };
  };

  // Check for critical thresholds
  // ENHANCED: [Phase 3b] Critical alert when storage < 1GB
  const batteryLevel = device?.battery ? parseInt(device.battery) : 100;
  const storageAvailableGB = device?.storage?.available ? device.storage.available / (1024 ** 3) : 100;
  const isCriticalBattery = batteryLevel < 20;
  const isCriticalStorage = storageAvailableGB < 1 && device?.storage?.quota > 0; // Only alert if storage API is working
  const hasCriticalAlert = isCriticalBattery || isCriticalStorage;

  // Fire emergency signature on alert transition
  const prevCritical = useRef(false);
  useEffect(() => {
    if (hasCriticalAlert && !prevCritical.current) {
      TactileSignatureEngine.getInstance().fire('alert:emergency');
    }
    prevCritical.current = hasCriticalAlert;
  }, [hasCriticalAlert]);

  const storageInfo = formatStorage(device?.storage);
  const activeCartridge = system?.activeCartridge;

  return (
    <div className="ambient-status-bar relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-live="polite"
        aria-label={`System status: ${statusText}${hasCriticalAlert ? ' - Critical alert' : ''}`}
        className={`
          flex items-center gap-2 px-3 py-1.5 
          bg-slate-900/80 backdrop-blur-md 
          border rounded-full 
          hover:bg-slate-800 transition-all duration-200
          ${isOpen ? 'ring-2 ring-slate-700' : ''}
          ${hasCriticalAlert ? 'border-red-500/50 animate-pulse' : 'border-slate-700/50'}
        `}
      >
        {/* Status Dot */}
        <div className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-500 ${hasCriticalAlert ? 'bg-red-500 shadow-red-500/50 animate-pulse' :
          activeCartridge ? 'bg-cyan-500 shadow-cyan-500/50' :
            isOnline ? 'bg-emerald-500 shadow-emerald-500/20' :
              'bg-amber-500 shadow-amber-500/20'
          }`} />

        {/* Ambient Text (Sans-serif, clean) */}
        <span className="text-xs font-sans font-medium text-slate-300 tracking-wide">
          {activeCartridge ? (
            <span className="flex items-center gap-1.5">
              Sector: {activeCartridge.title.split(',')[0]}
              <Satellite className="w-3 h-3 text-cyan-500" />
            </span>
          ) : statusText}
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="System status details"
          className="absolute top-full right-0 mt-2 w-64 z-50 animate-scale-in origin-top-right"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50">

            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-sans uppercase tracking-widest font-semibold">Status</span>
              <Activity className="w-3 h-3 text-slate-600" />
            </div>

            {/* Critical Battery Prompt */}
            {showSurvivalPrompt && (
              <div className="p-2 border-b border-slate-800 bg-red-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-400">Critical Battery</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">
                  Activate Survival Mode to extend battery life?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await SurvivalModeService.getInstance().activate();
                      setShowSurvivalPrompt(false);
                      setIsOpen(false);
                    }}
                    className="flex-1 px-2 py-1.5 bg-red-900/50 hover:bg-red-900/70 border border-red-800 rounded text-[10px] text-red-300 transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => {
                      setShowSurvivalPrompt(false);
                      setPromptDismissed(true);
                    }}
                    className="flex-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-400 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Telemetry Rows */}
            <div className="p-2 grid gap-1">
              <TelemetryRow
                icon={Battery}
                label="Power"
                value={formatBattery(device?.battery)}
                color={batteryLevel <= 10 ? 'text-red-400' : batteryLevel <= 20 ? 'text-amber-400' : 'text-emerald-400'}
              />
              <TelemetryRow
                icon={MapPin}
                label="Position"
                value={formatCoords(map?.center)}
              />

              {/* Cartridge Status Row */}
              {activeCartridge && (
                <TelemetryRow
                  icon={Satellite}
                  label="Cartridge"
                  value="Active"
                  color="text-cyan-400"
                  detail={activeCartridge.title}
                />
              )}

              {/* Survival Mode Status Row */}
              {survivalMode?.active && (
                <TelemetryRow
                  icon={Zap}
                  label="Survival"
                  value="Active"
                  color="text-amber-400"
                  detail="Blackout Protocol"
                />
              )}

              <TelemetryRow
                icon={isOnline ? Wifi : WifiOff}
                label="Network"
                value={isOnline ? 'Online' : 'Secure'}
                color={isOnline ? 'text-emerald-400' : 'text-amber-400'}
              />
              {/* Storage Row */}
              <TelemetryRow
                icon={Database}
                label="Storage"
                value={storageInfo.text}
                color={storageInfo.color}
                detail={storageInfo.detail}
              />
            </div>

            {/* Quick Actions */}
            <div className="p-2 border-t border-slate-800 grid grid-cols-2 gap-2 bg-slate-950/30">
              <ActionButton label="Map" onClick={() => { setIsOpen(false); navigate('/map'); }} />
              <ActionButton label="Settings" onClick={() => { setIsOpen(false); navigate('/settings'); }} />
            </div>

            {/* Survival Mode Toggle */}
            <div className="p-2 border-t border-slate-800 bg-slate-950/30">
              {survivalMode?.active ? (
                <button
                  onClick={async () => {
                    await SurvivalModeService.getInstance().deactivate();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/50 rounded-lg text-[11px] text-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Deactivate Survival Mode
                </button>
              ) : batteryLevel <= 20 && (
                <button
                  onClick={async () => {
                    await SurvivalModeService.getInstance().activate();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Activate Survival Mode
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components for cleaner render
const TelemetryRow = ({ icon: _IconProp, label, value, color = 'text-slate-200', detail }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
    <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300">
      <_IconProp className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <div className="flex flex-col items-end">
      <span className={`text-xs font-mono ${color}`}>{value}</span>
      {detail && <span className="text-[10px] text-slate-500 font-mono">{detail}</span>}
    </div>
  </div>
);

const ActionButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] text-center font-sans font-medium text-slate-300 transition-colors border border-transparent hover:border-slate-600"
  >
    {label}
  </button>
);

export default AmbientStatusBar;

