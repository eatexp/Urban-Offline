/**
 * DevDashboard - Development Monitoring Dashboard
 *
 * A dedicated view for monitoring app health, performance, and quality.
 * Accessible via clawdBot or direct navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Database,
  Search,
  Map,
  Brain,
  TrendingUp,

  Clock,
  Layout
} from 'lucide-react';
import { clawdBot } from '../../services/clawdBot';
import {
  DatasetNetworkGraph,
  IntentClassificationViz,
  // DatasetActivityIndicator
} from '../ai-visualizations';

/**
 * DevDashboard Component
 */
const DevDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Data states
  const [validationData, setValidationData] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [suggestionsData, setSuggestionsData] = useState(null);

  // Run all checks
  const runAllChecks = useCallback(async () => {
    setLoading(true);

    try {
      // Run validation
      const validation = await clawdBot.ask('validate app');
      if (validation.success) {
        setValidationData(validation.result);
      }

      // Run offline coverage
      const coverage = await clawdBot.ask('check offline coverage');
      if (coverage.success) {
        setCoverageData(coverage.result);
      }

      // Run performance check
      const perf = await clawdBot.ask('monitor performance');
      if (perf.success) {
        setPerformanceData(perf.result);
      }

      // Get suggestions
      const suggestions = await clawdBot.ask('suggest improvements');
      if (suggestions.success) {
        setSuggestionsData(suggestions.result);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dev dashboard check failed:', error);
    }

    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    queueMicrotask(() => {
      runAllChecks();
    });
  }, [runAllChecks]);

  // Calculate overall health score
  const calculateHealthScore = () => {
    let score = 100;

    if (validationData?.summary) {
      const { passed, failed, warnings } = validationData.summary;
      const total = passed + failed + warnings;
      if (total > 0) {
        score = Math.round(((passed + warnings * 0.5) / total) * 100);
      }
    }

    if (coverageData?.coverage !== undefined) {
      score = Math.round((score + coverageData.coverage) / 2);
    }

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const healthColor = healthScore >= 90 ? 'text-green-400' : healthScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const healthIcon = healthScore >= 90 ? CheckCircle : healthScore >= 70 ? AlertTriangle : XCircle;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'coverage', label: 'Offline Coverage', icon: Database },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'suggestions', label: 'Suggestions', icon: Zap },
    { id: 'visualizations', label: 'Visualizations', icon: Layout }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary-400" />
              clawdBot Dev Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Monitor app health, performance, and quality metrics
            </p>
          </div>
          <button
            onClick={runAllChecks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 
                       disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Health Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Health Score</p>
                <p className={`text-3xl font-bold ${healthColor}`}>
                  {healthScore}%
                </p>
              </div>
              {React.createElement(healthIcon, {
                className: `w-12 h-12 ${healthColor}`
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Offline Coverage</p>
                <p className="text-3xl font-bold text-blue-400">
                  {coverageData?.coverage ?? '--'}%
                </p>
              </div>
              <Database className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Validation Checks</p>
                <p className="text-3xl font-bold text-purple-400">
                  {validationData?.summary?.passed ?? '--'}
                  <span className="text-lg text-slate-500">/
                    {validationData?.summary
                      ? validationData.summary.passed + validationData.summary.failed + validationData.summary.warnings
                      : '--'}
                  </span>
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Suggestions</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {suggestionsData?.suggestions?.length ?? '--'}
                </p>
              </div>
              <Zap className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        </div>

        {lastUpdate && (
          <p className="text-slate-500 text-sm mt-2 text-right">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <OverviewTab
            validation={validationData}
            coverage={coverageData}
            performance={performanceData}
            suggestions={suggestionsData}
          />
        )}
        {activeTab === 'validation' && <ValidationTab data={validationData} />}
        {activeTab === 'coverage' && <CoverageTab data={coverageData} />}
        {activeTab === 'performance' && <PerformanceTab data={performanceData} />}
        {activeTab === 'suggestions' && <SuggestionsTab data={suggestionsData} />}
        {activeTab === 'visualizations' && <VisualizationsTab />}
      </div>
    </div>
  );
};

/**
 * Overview Tab
 */
const OverviewTab = ({ validation, coverage, performance, suggestions }) => {
  const checks = [
    { name: 'Storage', icon: Database, data: validation?.checks?.storage },
    { name: 'Search', icon: Search, data: validation?.checks?.search },
    { name: 'AI Models', icon: Brain, data: validation?.checks?.ai },
    { name: 'Maps', icon: Map, data: validation?.checks?.maps },
    { name: 'Triage', icon: Activity, data: validation?.checks?.triage }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Component Status */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          Component Status
        </h3>
        <div className="space-y-3">
          {checks.map(check => (
            <div key={check.name} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <check.icon className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{check.name}</span>
              </div>
              {check.data ? (
                <StatusBadge status={check.data.status} />
              ) : (
                <span className="text-slate-500 text-sm">Checking...</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          Quick Stats
        </h3>
        <div className="space-y-4">
          {performance?.metrics?.startup && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Startup Time</span>
                <span className="text-white">
                  {performance.metrics.startup.loadComplete}ms
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full"
                  style={{
                    width: `${Math.min(100, (3000 / performance.metrics.startup.loadComplete) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {performance?.metrics?.search && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Search Avg</span>
                <span className="text-white">
                  {performance.metrics.search.averageTime}ms
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{
                    width: `${Math.min(100, (500 / parseFloat(performance.metrics.search.averageTime)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {coverage && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Offline Coverage</span>
                <span className="text-white">{coverage.coverage}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${coverage.coverage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Suggestions */}
      {suggestions?.suggestions?.length > 0 && (
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Top Priority Improvements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.suggestions.slice(0, 3).map((s, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${s.priority === 'high'
                  ? 'bg-red-950/30 border-red-800'
                  : s.priority === 'medium'
                    ? 'bg-yellow-950/30 border-yellow-800'
                    : 'bg-slate-800 border-slate-700'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${s.priority === 'high'
                    ? 'bg-red-900 text-red-200'
                    : s.priority === 'medium'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-slate-700 text-slate-300'
                    }`}>
                    {s.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{s.category}</span>
                </div>
                <h4 className="font-medium text-white mb-1">{s.title}</h4>
                <p className="text-sm text-slate-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Validation Tab
 */
const ValidationTab = ({ data }) => {
  if (!data) return <div className="text-slate-500">Loading validation data...</div>;

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <h3 className="text-lg font-semibold mb-4">Detailed Validation Results</h3>
      <div className="space-y-4">
        {Object.entries(data.checks).map(([name, check]) => (
          <div key={name} className="p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium capitalize">{name}</h4>
              <StatusBadge status={check.status} />
            </div>
            <p className="text-slate-400 text-sm">{check.details}</p>
            {check.offlineReady !== undefined && (
              <p className="text-xs text-slate-500 mt-2">
                Offline ready: {check.offlineReady ? 'Yes' : 'No'}
              </p>
            )}
            {check.regionsInstalled !== undefined && (
              <p className="text-xs text-slate-500 mt-2">
                Regions: {check.regionsInstalled}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Coverage Tab
 */
const CoverageTab = ({ data }) => {
  if (!data) return <div className="text-slate-500">Loading coverage data...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Offline Coverage Analysis</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={data.coverage >= 80 ? '#4ade80' : data.coverage >= 50 ? '#facc15' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${data.coverage * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{data.coverage}%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400">
              {data.coverage === 100
                ? 'All critical paths work offline'
                : data.coverage >= 80
                  ? 'Most functionality works offline'
                  : 'Some features require internet'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Status: {data.online ? 'Online' : 'Offline mode'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(data.tests).map(([name, test]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusBadge status={test.status} />
                <span className="capitalize">{name}</span>
              </div>
              <span className="text-sm text-slate-400">{test.details}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Performance Tab
 */
const PerformanceTab = ({ data }) => {
  if (!data) return <div className="text-slate-500">Loading performance data...</div>;

  const formatValue = (val) => {
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  };

  return (
    <div className="space-y-4">
      {Object.entries(data.metrics).map(([category, metrics]) => (
        <div key={category} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
            {category === 'startup' && <Clock className="w-5 h-5 text-blue-400" />}
            {category === 'search' && <Search className="w-5 h-5 text-green-400" />}
            {category === 'storage' && <Database className="w-5 h-5 text-purple-400" />}
            {category === 'memory' && <Activity className="w-5 h-5 text-yellow-400" />}
            {category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="p-3 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-lg font-mono text-white">{formatValue(value)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Suggestions Tab
 */
const SuggestionsTab = ({ data }) => {
  if (!data) return <div className="text-slate-500">Loading suggestions...</div>;

  if (data.suggestions.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">All Good!</h3>
        <p className="text-slate-400">No immediate improvements needed. The app is running well.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.suggestions.map((suggestion, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border ${suggestion.priority === 'high'
            ? 'bg-red-950/20 border-red-800'
            : suggestion.priority === 'medium'
              ? 'bg-yellow-950/20 border-yellow-800'
              : 'bg-slate-900 border-slate-800'
            }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded font-medium ${suggestion.priority === 'high'
                  ? 'bg-red-900 text-red-200'
                  : suggestion.priority === 'medium'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-slate-700 text-slate-300'
                  }`}>
                  {suggestion.priority.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 uppercase">{suggestion.category}</span>
              </div>
              <h4 className="text-lg font-semibold text-white">{suggestion.title}</h4>
            </div>
            {suggestion.priority === 'high' ? (
              <XCircle className="w-6 h-6 text-red-400" />
            ) : suggestion.priority === 'medium' ? (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            ) : (
              <CheckCircle className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <p className="text-slate-300 mb-3">{suggestion.description}</p>
          {suggestion.action && (
            <div className="flex items-center gap-2 text-sm text-primary-400 bg-primary-950/30 p-3 rounded-lg">
              <Zap className="w-4 h-4" />
              <span>{suggestion.action}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const styles = {
    passed: 'bg-green-900/50 text-green-400 border-green-800',
    warning: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    failed: 'bg-red-900/50 text-red-400 border-red-800'
  };

  const icons = {
    passed: CheckCircle,
    warning: AlertTriangle,
    failed: XCircle
  };

  const Icon = icons[status] || AlertTriangle;

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${styles[status] || styles.warning}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

/**
 * Visualizations Tab
 */
const VisualizationsTab = () => {
  const [activeDatasets, _setActiveDatasets] = React.useState(['health', 'survival']);
  const [queryActivity, setQueryActivity] = React.useState([]);
  const [intent, setIntent] = React.useState(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  // Simulate query
  const simulateQuery = (datasetId) => {
    setQueryActivity(prev => [...prev.slice(-19), {
      datasetId,
      timestamp: Date.now(),
      hits: Math.floor(Math.random() * 5) + 1
    }]);
  };

  // Simulate intent analysis
  const simulateIntent = () => {
    setAnalyzing(true);
    setIntent(null);
    setTimeout(() => {
      setAnalyzing(false);
      const intents = [
        { type: 'medical', confidence: 0.95, label: 'Medical Emergency' },
        { type: 'survival', confidence: 0.88, label: 'Survival Skill' },
        { type: 'legal', confidence: 0.92, label: 'Legal Inquiry' }
      ];
      setIntent(intents[Math.floor(Math.random() * intents.length)]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Network Graph */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Dataset Network Graph</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {['health', 'survival', 'law', 'guides'].map(id => (
              <button
                key={id}
                onClick={() => simulateQuery(id)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm text-slate-300 transition-colors"
              >
                Ping {id}
              </button>
            ))}
          </div>
          <div className="h-[320px] bg-slate-950 rounded-lg overflow-hidden relative">
            {/* Force dark mode for component */}
            <DatasetNetworkGraph
              activeDatasets={activeDatasets}
              queryActivity={queryActivity}
              size="medium"
            />
          </div>
        </div>

        {/* Intent Classification */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Intent Classification</h3>
          <div className="mb-4">
            <button
              onClick={simulateIntent}
              disabled={analyzing}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-lg text-white text-sm"
            >
              {analyzing ? 'Analyzing...' : 'Simulate Analysis'}
            </button>
          </div>
          <div className="h-[200px] flex items-center justify-center p-4 bg-slate-950 rounded-lg">
            <IntentClassificationViz
              intent={intent}
              isAnalyzing={analyzing}
            />
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4 text-white">Activity Indicator</h3>
          <div className="p-4 bg-slate-950 rounded-lg">
            {/* <DatasetActivityIndicator
              activeDatasets={activeDatasets}
              lastQuery={queryActivity[queryActivity.length - 1]}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevDashboard;
