import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, HardDrive, MapPin, Loader, CheckCircle, Database, Globe, ChevronRight } from 'lucide-react';
import { dataManager } from '../services/dataManager';
import { ContentImporter } from '../services/ContentImporter';
import { createLogger } from '../utils/logger';

const log = createLogger('Resources');

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
            log.error('Failed to load resources', error);
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
            log.error('Geolocation error', err);
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
            log.error('Action failed', error);
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
            log.error('Seeding failed', e);
            alert('Seeding failed: ' + e.message);
        }
    };

    return (
        <div className="page-container p-4 pb-20 animate-slide-up">
            <header className="page-header animate-fade-in">
                <div className="page-header-row">
                    <div className="page-header-icon page-header-icon-info">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <h1 className="page-header-title">Offline Resources</h1>
                </div>
                <p className="page-header-description">
                    Download regional data for offline emergency access.
                </p>
            </header>

            {/* Browse Content Link */}
            <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <Link
                    to="/browse"
                    className="card card-link hover:shadow-xl mb-6"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-info), var(--color-accent-blue))',
                        borderColor: 'transparent'
                    }}
                >
                    <div
                        className="card-link-icon"
                        style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                    >
                        <Globe className="w-6 h-6" style={{ color: 'white' }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'white' }}>Browse Online Content</p>
                        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Download articles for offline use</p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                </Link>
            </section>

            {/* Storage Card */}
            <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="card p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="p-3 rounded-full"
                            style={{ background: 'var(--color-bg-tertiary)' }}
                        >
                            <HardDrive size={24} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div>
                            <p
                                className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Storage Used
                            </p>
                            <p className="font-bold font-mono text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                {storage.used} <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>/ {storage.total} MB</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Developer Tools */}
            <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <div
                    className="card p-4 mb-6"
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        borderStyle: 'dashed'
                    }}
                >
                    <h2 className="section-header mb-3">Developer Tools</h2>
                    <button
                        onClick={handleSeedData}
                        className="btn btn-secondary btn-md w-full sm:w-auto"
                    >
                        <Database size={16} />
                        Seed Test Data (Health/Survival/Law)
                    </button>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        Injects dummy data into IndexedDB for search testing.
                    </p>
                </div>
            </section>

            {/* Available Regions */}
            <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="section-header mb-0">Available Regions</h2>
                    <button
                        onClick={handleSortByLocation}
                        className="text-xs font-medium flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--color-info)' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        <MapPin size={14} />
                        Sort by Nearby
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div
                            className="text-center p-8 animate-fade-in"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <div
                                className="animate-spin w-8 h-8 rounded-full mx-auto mb-4"
                                style={{
                                    borderWidth: '3px',
                                    borderColor: 'var(--color-border-primary)',
                                    borderTopColor: 'var(--color-primary-500)'
                                }}
                            ></div>
                            Loading regions...
                        </div>
                    ) : (
                        regions.map((region, index) => (
                            <div
                                key={region.id}
                                className="card overflow-hidden animate-scale-in"
                                style={{ animationDelay: `${index * 50 + 250}ms` }}
                            >
                                {region.isInstalled && (
                                    <div
                                        className="px-4 py-2 flex items-center gap-2"
                                        style={{
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
                                        }}
                                    >
                                        <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                                        <span
                                            className="text-xs font-bold uppercase"
                                            style={{ color: 'var(--color-success)' }}
                                        >
                                            Installed
                                        </span>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3
                                                className="text-lg font-bold"
                                                style={{ color: 'var(--color-text-primary)' }}
                                            >
                                                {region.name}
                                            </h3>
                                            <div
                                                className="flex items-center gap-1 text-xs mt-1"
                                                style={{ color: 'var(--color-text-muted)' }}
                                            >
                                                <MapPin size={12} />
                                                <span>{region.coordinates.join(', ')}</span>
                                                {userLocation && (
                                                    <span className="font-medium ml-1" style={{ color: 'var(--color-info)' }}>
                                                        ({Math.round(calculateDistance(userLocation.latitude, userLocation.longitude, region.coordinates[0], region.coordinates[1]))} km)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className="px-2 py-1 rounded text-xs font-mono font-medium"
                                            style={{
                                                background: 'var(--color-bg-tertiary)',
                                                color: 'var(--color-text-muted)'
                                            }}
                                        >
                                            {region.size}
                                        </div>
                                    </div>

                                    <p
                                        className="text-sm mb-4"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        {region.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {region.modules.map(mod => (
                                            <span
                                                key={mod}
                                                className="text-xs px-2 py-1 rounded capitalize"
                                                style={{
                                                    background: 'var(--color-bg-tertiary)',
                                                    color: 'var(--color-text-muted)',
                                                    border: '1px solid var(--color-border-primary)'
                                                }}
                                            >
                                                {mod.replace('-', ' ')}
                                            </span>
                                        ))}
                                    </div>

                                    {region.isInstalled ? (
                                        <button
                                            onClick={() => handleAction(region.id, 'uninstall')}
                                            disabled={processing === region.id}
                                            className="w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: 'var(--color-danger)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)'
                                            }}
                                        >
                                            {processing === region.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            Offload Region
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            {processing === region.id && progress[region.id] !== undefined ? (
                                                <div
                                                    className="w-full rounded-lg h-10 relative overflow-hidden"
                                                    style={{ background: 'var(--color-bg-tertiary)' }}
                                                >
                                                    <div
                                                        className="absolute top-0 left-0 h-full transition-all"
                                                        style={{
                                                            width: progress[region.id] + '%',
                                                            background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))',
                                                            transition: 'width 300ms var(--ease-out)'
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold z-10"
                                                        style={{ color: 'white' }}
                                                    >
                                                        Downloading {progress[region.id]}%
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(region.id, 'install')}
                                                    disabled={processing === region.id}
                                                    className="btn btn-primary btn-md w-full"
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
