import { Shield, HardDrive, CheckCircle, AlertTriangle, Navigation, Heart, Tent, Scale, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dataManager } from '../services/dataManager';
import { createLogger } from '../utils/logger';

const log = createLogger('Home');

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
                log.error('Error checking status', error);
                setStatus('not-prepared');
            }
        };

        checkStatus();
    }, []);

    return (
        <div className="home-page space-y-6">
            {/* Status Section */}
            <section>
                <div className="glass-card relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-white/5">
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
                            <Link to="/map" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg">
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
                            <Link to="/resources" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg">
                                <HardDrive size={14} />
                                Download Region
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* AI Assistant Card */}
            <Link 
                to="/ai" 
                className="flex items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg text-white hover:shadow-xl transition-all"
            >
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold">AI Assistant</h3>
                    <p className="text-sm text-white/80">Ask questions about emergencies</p>
                </div>
                <Navigation className="w-5 h-5 text-white/60" />
            </Link>

            {/* Core Pillars */}
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Modules</h2>
            <div className="grid gap-5">
                <Link to="/health" className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-red-100 hover:border-red-300 hover:shadow-lg transition-all group">
                    <div className="bg-red-50 p-3 rounded-xl mr-4 group-hover:bg-red-100 transition-colors">
                        <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Health & First Aid</h3>
                        <p className="text-xs text-slate-500">Medical guides, Hospitals, ICD-11</p>
                    </div>
                </Link>

                <Link to="/law" className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all group">
                    <div className="bg-blue-50 p-3 rounded-xl mr-4 group-hover:bg-blue-100 transition-colors">
                        <Scale className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Law & Rights</h3>
                        <p className="text-xs text-slate-500">PACE Codes, Legislation</p>
                    </div>
                </Link>

                <Link to="/survival" className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all group">
                    <div className="bg-orange-50 p-3 rounded-xl mr-4 group-hover:bg-orange-100 transition-colors">
                        <Tent className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Survival & Prep</h3>
                        <p className="text-xs text-slate-500">Flood zones, Water, Shelter</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
