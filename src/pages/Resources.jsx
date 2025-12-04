import { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, MapPin, Globe, Loader, CheckCircle } from 'lucide-react';
import { dataManager } from '../services/dataManager';

const Resources = () => {
    const [regions, setRegions] = useState([]);
    const [storage, setStorage] = useState({ used: 0, total: 500 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const loadData = async () => {
        try {
            const [regionsData, storageData] = await Promise.all([
                dataManager.getAvailableRegions(),
                dataManager.getStorageUsage()
            ]);
            setRegions(regionsData);
            setStorage(storageData);
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (id, action) => {
        setProcessing(id);
        try {
            if (action === 'install') {
                await dataManager.installRegion(id);
            } else {
                await dataManager.uninstallRegion(id);
            }
            await loadData();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setProcessing(null);
        }
    };

    const getUsageColor = (percentage) => {
        if (percentage > 90) return 'var(--color-danger)';
        if (percentage > 70) return 'var(--color-warning)';
        return 'var(--color-success)';
    };

    const usagePercentage = (storage.used / storage.total) * 100;

    return (
        <div className="page-container">
            <header className="mb-4">
                <h1 className="text-lg mb-2">Offline Resources</h1>
                <div className="glass-card flex items-center justify-between">
                    <div className="flex items-center gap-md">
                        <div className="p-2 rounded-full bg-slate-700">
                            <HardDrive size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">Storage Used</p>
                            <p className="font-bold font-mono">{storage.used} MB <span className="text-muted">/ {storage.total} MB</span></p>
                        </div>
                    </div>
                    <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                        {/* Simple Circular Progress Placeholder */}
                        <svg width="80" height="80" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke={getUsageColor(usagePercentage)}
                                strokeWidth="8"
                                strokeDasharray={`${usagePercentage * 2.51} 251`}
                                transform="rotate(-90 50 50)"
                                strokeLinecap="round"
                            />
                            <text x="50" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{Math.round(usagePercentage)}%</text>
                        </svg>
                    </div>
                </div>
            </header>

            <section className="mb-4">
                <h2 className="text-sm text-muted mb-2 uppercase tracking-wider">Available Regions</h2>
                <div className="flex flex-col gap-md">
                    {loading ? (
                        <div className="text-center p-4 text-muted">Loading regions...</div>
                    ) : (
                        regions.map(region => (
                            <div key={region.id} className="card relative overflow-hidden">
                                {region.isInstalled && (
                                    <div className="absolute top-0 right-0 p-1 bg-green-500/20 rounded-bl-lg">
                                        <CheckCircle size={16} className="text-success" />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg">{region.name}</h3>
                                        <div className="flex items-center gap-sm text-xs text-muted mt-1">
                                            <MapPin size={12} />
                                            <span>{region.coordinates.join(', ')}</span>
                                        </div>
                                    </div>
                                    <span className="badge font-mono">{region.size}</span>
                                </div>
                                <p className="text-sm text-muted mb-4">{region.description}</p>

                                <div className="flex gap-sm flex-wrap mb-4">
                                    {region.modules.map(mod => (
                                        <span key={mod} className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 border border-slate-600">
                                            {mod.replace('-', ' ')}
                                        </span>
                                    ))}
                                </div>

                                {region.isInstalled ? (
                                    <button
                                        onClick={() => handleAction(region.id, 'uninstall')}
                                        disabled={processing === region.id}
                                        className="btn btn-danger-outline w-full"
                                    >
                                        {processing === region.id ? <Loader className="spin" /> : <Trash2 size={18} />}
                                        <span>Offload Region</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAction(region.id, 'install')}
                                        disabled={processing === region.id}
                                        className="btn btn-primary w-full"
                                    >
                                        {processing === region.id ? <Loader className="spin" /> : <Download size={18} />}
                                        <span>Download Region</span>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-sm text-muted mb-2 uppercase tracking-wider">Global Resources</h2>
                <div className="card flex items-center justify-between">
                    <div className="flex items-center gap-md">
                        <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm">Global Survival Guide</h3>
                            <p className="text-xs text-muted">WHO & WikiDoc Aligned</p>
                        </div>
                    </div>
                    <button className="btn btn-outline text-xs py-1 px-3">
                        Update
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Resources;
