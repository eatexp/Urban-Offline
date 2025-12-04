import { Shield, Book, Map, HardDrive, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dataManager } from '../services/dataManager';

const Home = () => {
    const [status, setStatus] = useState('loading');
    const [activeRegion, setActiveRegion] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const regions = await dataManager.getInstalledRegions();
                // In a real app, we'd check geolocation here to find the "active" region.
                // For now, we just pick the first installed one, or null.
                if (regions.length > 0) {
                    setStatus('prepared');
                    setActiveRegion(regions[0]);
                } else {
                    setStatus('not-prepared');
                }
            } catch (error) {
                console.error('Error checking status:', error);
                setStatus('not-prepared');
            }
        };

        checkStatus();
    }, []);

    return (
        <div className="home-page">
            <header className="header flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold tracking-tight">URBAN OFFLINE</h1>
                    <p className="text-xs text-muted font-mono uppercase">Intelligence System</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${status === 'prepared' ? 'bg-green-500/20 text-success' : 'bg-orange-500/20 text-primary'}`}>
                    {status === 'prepared' ? 'ONLINE' : 'STANDBY'}
                </div>
            </header>

            <section className="mb-6">
                <div className="glass-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={120} />
                    </div>

                    {status === 'prepared' && activeRegion ? (
                        <div>
                            <div className="flex items-center gap-sm mb-2 text-success">
                                <CheckCircle size={18} />
                                <span className="text-sm font-bold uppercase">System Ready</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{activeRegion.name}</h2>
                            <p className="text-sm text-muted mb-4">Offline assets secured. Map tiles and emergency places available.</p>
                            <div className="flex gap-sm">
                                <Link to="/map" className="btn btn-primary text-xs py-2">
                                    <Navigation size={16} />
                                    Open Map
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-sm mb-2 text-primary">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold uppercase">Setup Required</span>
                            </div>
                            <h2 className="text-xl font-bold mb-2">No Region Active</h2>
                            <p className="text-sm text-muted mb-4">Download a region to enable offline intelligence.</p>
                            <Link to="/resources" className="btn btn-primary text-xs py-2">
                                <HardDrive size={16} />
                                Download Region
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <div className="grid-menu">
                <Link to="/guides" className="menu-card glass-card hover:bg-slate-800/50 transition-colors">
                    <Book size={32} className="text-accent" />
                    <h3 className="mt-2">Survival Guides</h3>
                    <p>Medical & Tactical</p>
                </Link>
                <Link to="/resources" className="menu-card glass-card hover:bg-slate-800/50 transition-colors">
                    <HardDrive size={32} className="text-primary" />
                    <h3 className="mt-2">Data Manager</h3>
                    <p>Regions & Storage</p>
                </Link>
            </div>
        </div>
    );
};

export default Home;
