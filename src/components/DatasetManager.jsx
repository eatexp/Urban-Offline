/**
 * DatasetManager.jsx — The Patchbay / Cartridge Dock
 *
 * Grid of Data Cartridges with Mounted/Available sections.
 * Each cartridge represents a dataset/region that can be mounted
 * into the AI brain for offline reasoning.
 *
 * Refinery Standard:
 *   - Error handling: visual toast on failure (no silent console.error)
 *   - Haptics: wired through Cartridge component handlers
 */

import { useState, useEffect, useCallback } from 'react';
import { HardDrive, AlertTriangle, X } from 'lucide-react';
import Cartridge from './Cartridge';
import { dataManager } from '../services/dataManager';
import { useAIGenerating } from '../contexts/AIGeneratingContext';
import './Cartridge.css';

const DatasetManager = () => {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [error, setError] = useState(null);
    const { isGenerating } = useAIGenerating();

    const loadDatasets = useCallback(async () => {
        try {
            const data = await dataManager.getAvailableRegions();
            setDatasets(data);
        } catch (err) {
            console.error('Failed to load datasets:', err);
            setError('Failed to scan cartridge dock. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDatasets();
    }, [loadDatasets]);

    const handleInstall = useCallback(async (id) => {
        setProcessing(id);
        setError(null);
        try {
            await dataManager.installRegion(id);
            await loadDatasets();
        } catch (err) {
            console.error('Install failed:', err);
            setError(`Failed to load cartridge. ${err.name === 'OfflineError' ? 'Device is offline.' : 'Try again.'}`);
        } finally {
            setProcessing(null);
        }
    }, [loadDatasets]);

    const handleUninstall = useCallback(async (id) => {
        setProcessing(id);
        setError(null);
        try {
            await dataManager.uninstallRegion(id);
            await loadDatasets();
        } catch (err) {
            console.error('Uninstall failed:', err);
            setError('Failed to eject cartridge. Try again.');
        } finally {
            setProcessing(null);
        }
    }, [loadDatasets]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-slate-500">
                <HardDrive className="animate-pulse mr-2" size={20} />
                <span className="text-sm tracking-wider uppercase">Scanning cartridge dock...</span>
            </div>
        );
    }

    const mounted = datasets.filter(d => d.isInstalled);
    const available = datasets.filter(d => !d.isInstalled);

    return (
        <div className="dataset-manager">
            {/* Error toast */}
            {error && (
                <div className="cartridge-error-toast" role="alert">
                    <AlertTriangle size={16} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px',
                            minWidth: '44px',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Mounted cartridges */}
            {mounted.length > 0 && (
                <section>
                    <div className="cartridge-dock__header">
                        <h3 className="cartridge-dock__title">Mounted</h3>
                        <div className="cartridge-dock__divider" />
                        <span className="cartridge-dock__count">{mounted.length} active</span>
                    </div>
                    <div className="cartridge-grid">
                        {mounted.map((dataset) => (
                            <Cartridge
                                key={dataset.id}
                                dataset={dataset}
                                onInstall={handleInstall}
                                onUninstall={handleUninstall}
                                processing={processing}
                                isRefining={isGenerating}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Available cartridges */}
            {available.length > 0 && (
                <section style={{ marginTop: mounted.length > 0 ? 'var(--space-6)' : 0 }}>
                    <div className="cartridge-dock__header">
                        <h3 className="cartridge-dock__title">Available</h3>
                        <div className="cartridge-dock__divider" />
                        <span className="cartridge-dock__count">{available.length} ready</span>
                    </div>
                    <div className="cartridge-grid">
                        {available.map((dataset) => (
                            <Cartridge
                                key={dataset.id}
                                dataset={dataset}
                                onInstall={handleInstall}
                                onUninstall={handleUninstall}
                                processing={processing}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {datasets.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <HardDrive className="text-slate-600 mb-3" size={36} strokeWidth={1.5} />
                    <p className="text-sm text-slate-500">No cartridges available</p>
                    <p className="text-xs text-slate-600 mt-1">Connect to load data cartridges</p>
                </div>
            )}
        </div>
    );
};

export default DatasetManager;
