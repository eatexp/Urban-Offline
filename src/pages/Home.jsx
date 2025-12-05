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
        <div className="home-page space-y-6">
            {/* Status Section */}
            <section>
                <div className="glass-card relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-lg">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={100} />
                    </div>

                    {status === 'prepared' && activeRegion ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-green-400">
                                <CheckCircle size={18} />
                                <span className="text-sm font-bold uppercase">System Ready</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1">{activeRegion.name} Active</h2>
                            <p className="text-xs text-slate-300 mb-3">Offline assets secured.</p>
                            <Link to="/map" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <Navigation size={14} />
                                Open Map
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-orange-400">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold uppercase">Setup Required</span>
                            </div>
                            <p className="text-xs text-slate-300 mb-3">Download a region to enable offline intelligence.</p>
                            <Link to="/resources" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <HardDrive size={14} />
                                Download Region
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Core Pillars */}
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Modules</h2>
            <div className="grid gap-4">
                <Link to="/health" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-red-100 hover:border-red-300 transition-all group">
                    <div className="bg-red-50 p-3 rounded-lg mr-4 group-hover:bg-red-100 transition-colors">
                        <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Health & First Aid</h3>
                        <p className="text-xs text-slate-500">Medical guides, Hospitals, ICD-11</p>
                    </div>
                </Link>

                <Link to="/survival" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-orange-100 hover:border-orange-300 transition-all group">
                    <div className="bg-orange-50 p-3 rounded-lg mr-4 group-hover:bg-orange-100 transition-colors">
                        <Tent className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Survival & Prep</h3>
                        <p className="text-xs text-slate-500">Flood zones, Water, Shelter</p>
                    </div>
                </Link>

                <Link to="/law" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 transition-all group">
                    <div className="bg-blue-50 p-3 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                        <Scale className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Law & Rights</h3>
                        <p className="text-xs text-slate-500">PACE Codes, Legislation</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
