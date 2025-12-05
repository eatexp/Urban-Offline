
import { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, MapPin, Globe, Loader, CheckCircle, Database } from 'lucide-react';
import { dataManager } from '../services/dataManager';
import { ContentImporter } from '../services/ContentImporter';

const Resources = () => {
    const [regions, setRegions] = useState([]);
    const [storage, setStorage] = useState({ used: 0, total: 500 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [progress, setProgress] = useState({});
    const [userLocation, setUserLocation] = useState(null);

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

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSortByLocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });

            const sorted = [...regions].sort((a, b) => {
                const distA = calculateDistance(latitude, longitude, a.coordinates[0], a.coordinates[1]);
                const distB = calculateDistance(latitude, longitude, b.coordinates[0], b.coordinates[1]);
                return distA - distB;
            });
            setRegions(sorted);
        }, (err) => {
            console.error('Geolocation error:', err);
        });
    };

    const handleAction = async (id, action) => {
        setProcessing(id);
        try {
            if (action === 'install') {
                await dataManager.installRegion(id, (percent) => {
                    setProgress(prev => ({ ...prev, [id]: percent }));
                });
            } else {
                await dataManager.uninstallRegion(id);
                setProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[id];
                    return newProgress;
                });
            }
            await loadData();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setProcessing(null);
            if (action === 'install') {
                setTimeout(() => {
                    setProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[id];
                        return newProgress;
                    });
                }, 1000);
            }
        }
    };

    const handleSeedData = async () => {
        try {
            await ContentImporter.importHealthContent({
                id: 'wiki-cpr',
                title: 'Cardiopulmonary resuscitation',
                summary: 'Emergency procedure that combines chest compressions...',
                content: 'Full CPR content here...',
                tags: ['first-aid', 'emergency']
            });

            await ContentImporter.importSurvivalContent({
                id: 'flood-zone-1',
                title: 'Thames Flood Zone',
                searchableText: 'Flood risk area for Greater London...',
                description: 'High risk area'
            });

            await ContentImporter.importLawContent({
                id: 'pace-code-a',
                title: 'PACE Code A',
                fullText: 'Code of Practice for the exercise by: police officers of statutory powers of stop and search.',
                summary: 'Stop and Search powers'
            });

            alert('Debug data seeded successfully!');
        } catch (e) {
            console.error(e);
            alert('Seeding failed: ' + e.message);
        }
    };

    const getUsageColor = (percentage) => {
        if (percentage > 90) return 'var(--color-danger)';
        if (percentage > 70) return 'var(--color-warning)';
        return 'var(--color-success)';
    };

    const usagePercentage = (storage.used / storage.total) * 100;

    return (
        <div className="page-container p-4 pb-20">
            <header className="mb-6">
                <h1 className="text-xl font-bold mb-4 text-slate-800">Offline Resources</h1>

                {/* Storage Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-slate-100 text-slate-600">
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Storage Used</p>
                            <p className="font-bold text-slate-900 font-mono text-lg">
                                {storage.used} <span className="text-sm text-slate-400">/ {storage.total} MB</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Debug Actions */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Developer Tools</h2>
                    <button
                        onClick={handleSeedData}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Database size={16} />
                        Seed Test Data (Health/Survival/Law)
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        Injects dummy data into IndexedDB for search testing.
                    </p>
                </div>
            </header>

            <section className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Regions</h2>
                    <button onClick={handleSortByLocation} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                        <MapPin size={14} />
                        Sort by Nearby
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center p-8 text-slate-400">Loading regions...</div>
                    ) : (
                        regions.map(region => (
                            <div key={region.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {region.isInstalled && (
                                    <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center gap-2">
                                        <CheckCircle size={14} className="text-green-600" />
                                        <span className="text-xs font-bold text-green-700 uppercase">Installed</span>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{region.name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                <MapPin size={12} />
                                                <span>{region.coordinates.join(', ')}</span>
                                                {userLocation && (
                                                    <span className="text-blue-600 font-medium ml-1">
                                                        ({Math.round(calculateDistance(userLocation.latitude, userLocation.longitude, region.coordinates[0], region.coordinates[1]))} km)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-medium text-slate-600">
                                            {region.size}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 mb-4">{region.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {region.modules.map(mod => (
                                            <span key={mod} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200 capitalize">
                                                {mod.replace('-', ' ')}
                                            </span>
                                        ))}
                                    </div>

                                    {region.isInstalled ? (
                                        <button
                                            onClick={() => handleAction(region.id, 'uninstall')}
                                            disabled={processing === region.id}
                                            className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {processing === region.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            Offload Region
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            {processing === region.id && progress[region.id] !== undefined ? (
                                                <div className="w-full bg-slate-100 rounded-lg h-10 relative overflow-hidden">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: progress[region.id] + '%' }}
                                                    />
                                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold text-white z-10">
                                                        Downloading {progress[region.id]}%
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(region.id, 'install')}
                                                    disabled={processing === region.id}
                                                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    {processing === region.id ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                                    Download Region
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default Resources;
