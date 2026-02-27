/**
 * ModelMarketplaceClean - Clean, minimal AI Model Store
 * 
 * Features:
 * - Device-adaptive model sorting
 * - Clean, muted visual design
 * - Performance indicators without flashy animations
 * - iOS/Android parity
 * 
 * Compliance: .clinerules §1 - Device-aware model selection
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, Trash2, Check, Loader2, Cpu, Battery, HardDrive
} from 'lucide-react';
import { AIModelManager } from '../services/ai/AIModelManager';
import DeviceCapabilityProfiler from '../services/ai/DeviceCapabilityProfiler';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';
import { createLogger } from '../utils/logger';

const log = createLogger('ModelMarketplaceClean');

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Device Info Bar - Clean, text-only display
 */
const DeviceInfoBar = ({ profile }) => {
  if (!profile) return null;

  const { recommendations, hardware, runtime } = profile;

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
      <div className="flex items-center gap-1.5">
        <Cpu size={14} />
        <span>{recommendations.tier} tier</span>
      </div>
      {runtime.battery && (
        <div className="flex items-center gap-1.5">
          <Battery size={14} />
          <span>{Math.round(runtime.battery.level * 100)}%</span>
        </div>
      )}
      {hardware.storage?.available && (
        <div className="flex items-center gap-1.5">
          <HardDrive size={14} />
          <span>{Math.round(hardware.storage.available / 1024 / 1024 / 1024)}GB free</span>
        </div>
      )}
    </div>
  );
};

/**
 * Performance Indicator - Simple text badge
 */
const PerformanceIndicator = ({ level, warning }) => {
  const styles = {
    optimal: { text: 'Best match', class: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    compatible: { text: 'Compatible', class: 'text-slate-600 bg-slate-50 border-slate-200' },
    warning: { text: 'May be slow', class: 'text-amber-600 bg-amber-50 border-amber-200' },
    incompatible: { text: 'Not recommended', class: 'text-red-600 bg-red-50 border-red-200' }
  };

  const config = styles[level] || styles.compatible;

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.class}`}>
        {config.text}
      </span>
      {warning && (
        <p className="text-xs text-slate-500">{warning}</p>
      )}
    </div>
  );
};

/**
 * Simple Progress Bar
 */
const ProgressBar = ({ progress, status }) => (
  <div className="flex items-center gap-3 flex-1">
    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-slate-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
    <span className="text-xs text-slate-500 min-w-[3rem] text-right">
      {status || `${Math.round(progress)}%`}
    </span>
  </div>
);

// =============================================================================
// MODEL CARD COMPONENT
// =============================================================================

const ModelCard = ({
  model,
  deviceProfile,
  isInstalled,
  isActive,
  isDownloading,
  downloadProgress,
  downloadStatus,
  resumeInfo,
  onDownload,
  onResume,
  onSelect,
  onDelete,
  index: _index
}) => {
  const [performanceInfo, setPerformanceInfo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Analyze device compatibility
  useEffect(() => {
    const analyze = async () => {
      const warning = await DeviceCapabilityProfiler.getPerformanceWarning(model);
      const isOptimal = await DeviceCapabilityProfiler.isOptimalForDevice(model);
      const canRun = await DeviceCapabilityProfiler.canRunOnDevice(model);

      let level = 'compatible';
      if (isOptimal) level = 'optimal';
      else if (!canRun) level = 'incompatible';
      else if (warning.warning) level = 'warning';

      setPerformanceInfo({
        level,
        warning: warning.warning,
        canRun: warning.canRun
      });
    };

    analyze();
  }, [model, deviceProfile]);

  const handleDownload = () => onDownload(model.id);
  const handleSelect = () => onSelect(model.id);

  const handleDelete = () => {
    onDelete(model.id);
    setShowDeleteConfirm(false);
  };

  const isRecommended = performanceInfo?.level === 'optimal';
  const isIncompatible = performanceInfo?.level === 'incompatible';

  return (
    <div className={`
      p-4 rounded-lg border transition-colors
      ${isActive
        ? 'bg-indigo-50 border-indigo-300'
        : 'bg-white border-slate-200 hover:border-slate-300'
      }
      ${isRecommended ? 'border-l-4 border-l-emerald-400' : ''}
      ${isIncompatible ? 'opacity-50' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{model.name}</h3>
            {model.tier === 'pro' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Pro
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{model.description}</p>
        </div>
        <div className="text-xs text-slate-400 ml-4">
          {model.sizeDisplay}
        </div>
      </div>

      {/* Performance Badge */}
      {performanceInfo && (
        <div className="mb-3">
          <PerformanceIndicator
            level={performanceInfo.level}
            warning={performanceInfo.warning}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isDownloading ? (
          <div className="flex items-center gap-3 flex-1 py-2">
            <Loader2 size={16} className="animate-spin text-slate-400" />
            <ProgressBar progress={downloadProgress} status={downloadStatus} />
          </div>
        ) : resumeInfo?.canResume ? (
          <button
            onClick={() => onResume(model.id)}
            className="flex-1 py-2 px-4 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100"
          >
            Resume ({Math.round(resumeInfo.progress)}%)
          </button>
        ) : isInstalled ? (
          <>
            <button
              onClick={handleSelect}
              disabled={isActive || isIncompatible}
              className={`
                flex-1 py-2 px-4 rounded-lg text-sm font-medium border
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isIncompatible
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {isActive ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check size={14} /> Active
                </span>
              ) : (
                'Use Model'
              )}
            </button>

            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isActive}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleDownload}
            disabled={isIncompatible}
            className={`
              flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2
              ${isIncompatible
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-800 text-white hover:bg-slate-700'
              }
            `}
          >
            <Download size={16} />
            {isIncompatible ? 'Not Compatible' : 'Download'}
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN MARKETPLACE COMPONENT
// =============================================================================

const ModelMarketplaceClean = () => {

  // State
  const [models, setModels] = useState([]);
  const [installedModels, setInstalledModels] = useState(new Set());
  const [activeModel, setActiveModel] = useState(null);
  const [downloadingModel, setDownloadingModel] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [resumeInfoMap, setResumeInfoMap] = useState(new Map());
  const [storageUsed, setStorageUsed] = useState({ bytes: 0, display: '0 MB' });
  const [filter, setFilter] = useState('recommended');
  const [deviceProfile, setDeviceProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Get device capabilities
        const profile = await DeviceCapabilityProfiler.getProfile();
        setDeviceProfile(profile);

        // Initialize AI manager
        await AIModelManager.init();

        // Get all models
        const allModels = await AIModelManager.getAvailableModels();

        // Sort by device compatibility
        const sortedModels = sortModelsByDevice(allModels, profile);
        setModels(sortedModels);

        // Track installed models
        const installed = new Set(
          allModels.filter(m => m.isInstalled).map(m => m.id)
        );
        setInstalledModels(installed);

        // Get current active model
        setActiveModel(AIModelManager.getCurrentModel());

        // Get storage usage
        const usage = await AIModelManager.getStorageUsage();
        setStorageUsed(usage);

        // Check for resume info
        await checkResumeInfo(allModels);

      } catch (error) {
        log.error('Failed to initialize marketplace', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Sort models by device compatibility
  const sortModelsByDevice = (models, profile) => {
    if (!profile) return models;

    const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };
    const deviceTier = tierPriority[profile.recommendations.tier] || 1;

    return [...models].sort((a, b) => {
      // Best match first
      const aTier = tierPriority[a.tier] || 1;
      const bTier = tierPriority[b.tier] || 1;

      const aDiff = Math.abs(aTier - deviceTier);
      const bDiff = Math.abs(bTier - deviceTier);

      if (aDiff !== bDiff) return aDiff - bDiff;

      // Then by size (smaller first)
      return a.size - b.size;
    });
  };

  // Check resume info for all models
  const checkResumeInfo = async (models) => {
    const resumeMap = new Map();

    for (const model of models) {
      try {
        const resumeInfo = await AIModelManager.getResumeInfo(model.id);
        if (resumeInfo?.canResume) {
          resumeMap.set(model.id, resumeInfo);
        }
      } catch (_error) {
        // Ignore
      }
    }

    setResumeInfoMap(resumeMap);
  };

  // Handle download
  const handleDownload = async (modelId) => {
    setDownloadingModel(modelId);
    setDownloadProgress(0);
    setDownloadStatus('');

    const result = await AIModelManager.downloadModel(modelId, (progress, message) => {
      setDownloadProgress(progress);
      setDownloadStatus(message);
    });

    if (result.success) {
      setInstalledModels(prev => new Set([...prev, modelId]));
      setResumeInfoMap(prev => {
        const next = new Map(prev);
        next.delete(modelId);
        return next;
      });

      const usage = await AIModelManager.getStorageUsage();
      setStorageUsed(usage);
    }

    setDownloadingModel(null);
  };

  // Handle resume
  const handleResume = async (modelId) => {
    await handleDownload(modelId);
  };

  // Handle select
  const handleSelect = async (modelId) => {
    const result = await AIModelManager.loadModel(modelId, () => { });

    if (result.success) {
      setActiveModel(modelId);
    }
  };

  // Handle delete
  const handleDelete = async (modelId) => {
    const result = await AIModelManager.deleteModel(modelId);

    if (result.success) {
      setInstalledModels(prev => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });

      if (activeModel === modelId) {
        setActiveModel(null);
      }

      const usage = await AIModelManager.getStorageUsage();
      setStorageUsed(usage);
    }
  };

  // Filter models
  const filteredModels = useMemo(() => {
    let filtered = models;

    if (filter === 'installed') {
      filtered = models.filter(m => installedModels.has(m.id));
    } else if (filter === 'recommended') {
      // Show models matching device tier or below
      const tierPriority = { 'essential': 0, 'standard': 1, 'advanced': 2, 'pro': 3 };
      const deviceTier = tierPriority[deviceProfile?.recommendations?.tier] || 1;
      filtered = models.filter(m => {
        const modelTier = tierPriority[m.tier] || 1;
        return modelTier <= deviceTier + 1;
      });
    } else if (filter === 'all') {
      filtered = models;
    }

    return filtered;
  }, [models, filter, installedModels, deviceProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Analyzing device...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-slate-900">AI Models</h1>
          <span className="text-sm text-slate-500">
            {storageUsed.display} used
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Download AI models that run offline on your device.
        </p>
      </div>

      {/* Device Status */}
      <div className="mb-6">
        <DeviceInfoBar profile={deviceProfile} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { id: 'recommended', label: 'Recommended' },
          { id: 'all', label: 'All' },
          { id: 'installed', label: 'Installed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${filter === tab.id
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {tab.label}
            {tab.id === 'installed' && installedModels.size > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">
                ({installedModels.size})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Model List */}
      <div className="space-y-3">
        {filteredModels.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 mb-2">
              {filter === 'installed' ? 'No models installed' : 'No models match'}
            </p>
            <p className="text-sm text-slate-400">
              {filter === 'installed'
                ? 'Download models to use AI features'
                : 'Try a different filter'
              }
            </p>
          </div>
        ) : (
          filteredModels.map((model, index) => (
            <ModelCard
              key={model.id}
              model={model}
              deviceProfile={deviceProfile}
              isInstalled={installedModels.has(model.id)}
              isActive={activeModel === model.id}
              isDownloading={downloadingModel === model.id}
              downloadProgress={downloadingModel === model.id ? downloadProgress : 0}
              downloadStatus={downloadingModel === model.id ? downloadStatus : ''}
              resumeInfo={resumeInfoMap.get(model.id)}
              onDownload={handleDownload}
              onResume={handleResume}
              onSelect={handleSelect}
              onDelete={handleDelete}
              index={index}
            />
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500 leading-relaxed">
          All AI models run locally on your device. Your conversations never leave your phone.
          Models are sorted by compatibility with your device specifications.
        </p>
      </div>
    </div>
  );
};

export default ModelMarketplaceClean;