import { Shield, HardDrive, CheckCircle, AlertTriangle, Navigation, Heart, Tent, Scale, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { Link, useLoaderData } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dataManager } from '../services/dataManager';
import { createLogger } from '../utils/logger';

const log = createLogger('Home');

const Home = () => {
    const { status: initialStatus, activeRegion: initialRegion } = useLoaderData();
    const [status, setStatus] = useState(initialStatus);
    const [activeRegion, setActiveRegion] = useState(initialRegion);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Use semantic ease-out for hover effects if needed via inline style or class
    // const easeOut = "var(--ease-out)"; 

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="home-page space-y-6 animate-slide-up">
            {/* Enhanced Status Section */}
            <section className="animate-scale-in">
                <div className="glass-card relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl transition-all duration-300">
                    {/* Animated background elements */}
                    <div className="absolute top-0 right-0 p-6 opacity-10 animate-emergency-pulse">
                        <Shield size={120} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-30"></div>

                    {status === 'prepared' && activeRegion ? (
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 bg-emergency-green rounded-full animate-emergency-pulse shadow-lg shadow-green-400/50"></div>
                                <span className="text-sm font-bold uppercase tracking-wide text-emergency-green">System Ready</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    {isOnline ? (
                                        <Wifi className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <WifiOff className="w-4 h-4 text-orange-400" />
                                    )}
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                {activeRegion.name} Active
                            </h2>
                            <p className="text-sm text-slate-300 mb-4">Offline assets secured and ready for emergency use.</p>
                            <Link
                                to="/map"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
                            >
                                <Navigation size={16} />
                                Open Emergency Map
                            </Link>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 bg-primary rounded-full animate-emergency-pulse shadow-lg shadow-orange-400/50"></div>
                                <span className="text-sm font-bold uppercase tracking-wide text-primary">Setup Required</span>
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-orange-400">Prepare for Emergencies</h2>
                            <p className="text-sm text-slate-300 mb-4">Download regional data to enable full offline intelligence capabilities.</p>
                            <Link
                                to="/resources"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
                            >
                                <HardDrive size={16} />
                                Download Region Data
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Enhanced AI Assistant Card */}
            <section className="animate-scale-in" style={{ animationDelay: '100ms' }}>
                <Link
                    to="/ai"
                    className="group flex items-center p-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                    <div className="bg-white/20 p-4 rounded-xl mr-5 group-hover:bg-white/30 transition-all duration-300 transform group-hover:scale-110">
                        <Sparkles className="w-8 h-8 text-white animate-emergency-pulse" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">AI Emergency Assistant</h3>
                        <p className="text-sm text-white/90">Get intelligent answers about medical emergencies, survival skills, and legal rights</p>
                    </div>
                    <Navigation className="w-6 h-6 text-white/70 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1" />
                </Link>
            </section>

            {/* Enhanced Core Pillars */}
            <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Modules</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent ml-4"></div>
                </div>
                <div className="grid gap-4">
                    <Link
                        to="/survival"
                        className="group flex items-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-500/20 hover:border-orange-400/40 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl mr-5 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-all duration-300 transform group-hover:scale-110">
                            <Tent className="w-7 h-7 text-orange-400 group-hover:text-orange-300 transition-colors" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-100 mb-1">Survival & Preparedness</h3>
                            <p className="text-sm text-slate-400">Civil unrest " Infrastructure failure " Wilderness survival</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-all">
                            <Navigation className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>

                    <Link
                        to="/health"
                        className="group flex items-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg border border-red-500/20 hover:border-red-400/40 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4 rounded-xl mr-5 group-hover:from-red-500/30 group-hover:to-pink-500/30 transition-all duration-300 transform group-hover:scale-110">
                            <Heart className="w-7 h-7 text-red-400 group-hover:text-red-300 transition-colors" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-100 mb-1">Health & First Aid</h3>
                            <p className="text-sm text-slate-400">Medical emergencies " First aid " Hospital locations</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                            <Navigation className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>

                    <Link
                        to="/law"
                        className="group flex items-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-500/20 hover:border-blue-400/40 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl mr-5 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300 transform group-hover:scale-110">
                            <Scale className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-100 mb-1">Law & Rights</h3>
                            <p className="text-sm text-slate-400">Legal rights " PACE codes " Police encounters</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                            <Navigation className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>
                </div>
            </section>

            {/* Emergency Quick Access */}
            <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-5 border border-red-500/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <h3 className="font-bold text-red-400">Emergency Quick Access</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Immediate access to critical emergency protocols</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="btn btn-emergency btn-sm">
                            <Navigation size={16} />
                            Evacuate Now
                        </button>
                        <button className="btn btn-emergency btn-sm">
                            <Heart size={16} />
                            Medical Alert
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
