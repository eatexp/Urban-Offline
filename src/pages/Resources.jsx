
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

    return (
        <div className="page-container">
            <header className="mb-6">
                <h1 className="text-xl font-bold mb-4">Offline Resources</h1>

                {/* Storage Card */}
                <div className="storage-card mb-6">
                    <div className="storage-icon">
                        <HardDrive size={24} />
                    </div>
                    <div className="storage-info">
                        <p className="label">Storage Used</p>
                        <p className="value">
                            {storage.used} <span>/ {storage.total} MB</span>
                        </p>
                    </div>
                </div>

                {/* Debug Actions */}
                <div className="dev-tools-card">
                    <h2>Developer Tools</h2>
                    <button
                        onClick={handleSeedData}
                        className="btn-dev"
                    >
                        <Database size={16} />
                        Seed Test Data (Health/Survival/Law)
                    </button>
                    <p>
                        Injects dummy data into IndexedDB for search testing.
                    </p>
                </div>
            </header>

            <section className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="section-header" style={{ marginBottom: 0 }}>Available Regions</h2>
                    <button onClick={handleSortByLocation} className="text-link flex items-center gap-sm text-sm">
                        <MapPin size={14} />
                        Sort by Nearby
                    </button>
                </div>

                <div className="flex flex-col gap-md">
                    {loading ? (
                        <div className="text-center p-8 text-muted">Loading regions...</div>
                    ) : (
                        regions.map(region => (
                            <div key={region.id} className="region-card">
                                {region.isInstalled && (
                                    <div className="region-card-installed-badge">
                                        <CheckCircle size={14} />
                                        <span>Installed</span>
                                    </div>
                                )}

                                <div className="region-card-body">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3>{region.name}</h3>
                                            <div className="coordinates">
                                                <MapPin size={12} />
                                                <span>{region.coordinates.join(', ')}</span>
                                                {userLocation && (
                                                    <span className="text-primary font-medium ml-1">
                                                        ({Math.round(calculateDistance(userLocation.latitude, userLocation.longitude, region.coordinates[0], region.coordinates[1]))} km)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="size-badge">
                                            {region.size}
                                        </div>
                                    </div>

                                    <p className="description">{region.description}</p>

                                    <div className="module-tags">
                                        {region.modules.map(mod => (
                                            <span key={mod} className="module-tag">
                                                {mod.replace('-', ' ')}
                                            </span>
                                        ))}
                                    </div>

                                    {region.isInstalled ? (
                                        <button
                                            onClick={() => handleAction(region.id, 'uninstall')}
                                            disabled={processing === region.id}
                                            className="btn-delete"
                                        >
                                            {processing === region.id ? <Loader size={16} className="spin" /> : <Trash2 size={16} />}
                                            Offload Region
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            {processing === region.id && progress[region.id] !== undefined ? (
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{ width: progress[region.id] + '%' }}
                                                    />
                                                    <div className="progress-bar-text">
                                                        Downloading {progress[region.id]}%
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(region.id, 'install')}
                                                    disabled={processing === region.id}
                                                    className="btn-download"
                                                >
                                                    {processing === region.id ? <Loader size={16} className="spin" /> : <Download size={16} />}
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
