import { Shield, Book, Map, HardDrive, CheckCircle, AlertTriangle, Navigation, Heart, Tent, Scale } from 'lucide-react';
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
        <div className="page-container space-y-6">
            {/* Status Section */}
            <section>
                <div className="glass-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={100} />
                    </div>

                    {status === 'prepared' && activeRegion ? (
                        <div>
                            <div className="status-pill success mb-2">
                                <CheckCircle size={14} />
                                <span>System Ready</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1">{activeRegion.name} Active</h2>
                            <p className="text-xs text-muted mb-3">Offline assets secured.</p>
                            <Link to="/map" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                                <Navigation size={14} />
                                Open Map
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <div className="status-pill warning mb-2">
                                <AlertTriangle size={14} />
                                <span>Setup Required</span>
                            </div>
                            <p className="text-xs text-muted mb-3">Download a region to enable offline intelligence.</p>
                            <Link to="/resources" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                                <HardDrive size={14} />
                                Download Region
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Core Pillars */}
            <h2 className="section-header">Emergency Modules</h2>
            <div className="flex flex-col gap-md">
                <Link to="/health" className="module-card">
                    <div className="module-card-icon red">
                        <Heart size={24} />
                    </div>
                    <div className="module-card-content">
                        <h3>Health & First Aid</h3>
                        <p>Medical guides, Hospitals, ICD-11</p>
                    </div>
                </Link>

                <Link to="/survival" className="module-card">
                    <div className="module-card-icon orange">
                        <Tent size={24} />
                    </div>
                    <div className="module-card-content">
                        <h3>Survival & Prep</h3>
                        <p>Flood zones, Water, Shelter</p>
                    </div>
                </Link>

                <Link to="/law" className="module-card">
                    <div className="module-card-icon blue">
                        <Scale size={24} />
                    </div>
                    <div className="module-card-content">
                        <h3>Law & Rights</h3>
                        <p>PACE Codes, Legislation</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
