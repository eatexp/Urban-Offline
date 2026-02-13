import { Shield, Library, Navigation, Heart, Tent, Scale, Sparkles, Wifi, WifiOff, Brain, Download } from 'lucide-react';
import { Link, useLoaderData, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, memo } from 'react';
import { AIModelManager } from '../services/ai/AIModelManager';
import { triggerHaptic } from '../utils/haptics';
import EmergencyCommandBar from '../components/EmergencyCommandBar';

// TODO: [Performance] HOME_COMPONENT_MEMOIZATION - IMPLEMENTED 2026-02-08
// Wrapped component with React.memo() and extracted EmergencyQuickAccess to prevent
// unnecessary re-renders when online/offline status changes. Status cards memoized.

const Home = memo(() => {
    const { status: initialStatus, activeRegion: initialRegion } = useLoaderData();
    const status = initialStatus;
    const activeRegion = initialRegion;
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [aiModelCount, setAiModelCount] = useState(0);
    const navigate = useNavigate();

    // TODO: [Performance] HOME_COMPONENT_MEMOIZATION
    // What's wrong: Home component re-renders on every online/offline toggle,
    //   causing expensive re-computation of all child components.
    // Why it matters: Home is the main landing page, frequent re-renders hurt UX.
    // How to fix:
    //   1. Wrap with React.memo()
    //   2. Use useMemo for status cards and emergency modules
    //   3. Extract EmergencyQuickAccess to separate memoized component
    // Priority: P2 | Effort: S (30 min) | Impact: Medium
    // =============================================================================

    // =============================================================================
    // VERIFIED: [NativeUX] EMERGENCY_BUTTON_HAPTIC_FEEDBACK
    // =============================================================================
    // Implementation: Uses shared triggerHaptic() utility from ../utils/haptics.js
    //   for consistent haptic feedback across all emergency buttons.
    // =============================================================================

    /**
     * Handle emergency button press with haptic feedback and navigation
     * @param {string} route - The route to navigate to
     */
    const handleEmergencyPress = (route) => {
        triggerHaptic('heavy');
        navigate(route);
    };

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

    // Check AI model count
    useEffect(() => {
        const checkAI = async () => {
            try {
                await AIModelManager.init();
                const installed = await AIModelManager.getInstalledModels();
                setAiModelCount(installed.length);
            } catch (_e) {
                // AI unavailable - leave at 0
            }
        };
        checkAI();
    }, []);

    // Memoize status card content to prevent re-computation on re-renders
    const statusCardContent = useMemo(() => {
        return status === 'prepared' && activeRegion ? {
            badge: { text: 'System Ready', color: 'text-emergency-green' },
            title: `${activeRegion.name} Active`,
            subtitle: 'Offline assets secured and ready for emergency use.',
            link: { to: '/map', text: 'Open Emergency Map' }
        } : {
            badge: { text: 'Setup Required', color: 'text-primary' },
            title: 'Prepare for Emergencies',
            subtitle: 'Download regional data to enable full offline intelligence capabilities.',
            link: { to: '/library', text: 'Open Library' }
        };
    }, [status, activeRegion]);

    return (
        <div className="home-page space-y-6 animate-slide-up">
            {/* Emergency Command Bar - Hero Element for instant access */}
            <EmergencyCommandBar />

            {/* Enhanced Status Section */}
            <section className="animate-scale-in">
                <div className="glass-card relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl transition-all duration-300">
                    {/* Animated background elements */}
                    <div className="absolute top-0 right-0 p-6 opacity-10 animate-emergency-pulse">
                        <Shield size={120} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-30"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-3 h-3 rounded-full animate-emergency-pulse shadow-lg ${status === 'prepared' && activeRegion ? 'bg-emergency-green shadow-green-400/50' : 'bg-primary shadow-orange-400/50'}`}></div>
                            <span className={`text-sm font-bold uppercase tracking-wide ${statusCardContent.badge.color}`}>{statusCardContent.badge.text}</span>
                            <div className="flex items-center gap-1 ml-auto">
                                {isOnline ? (
                                    <Wifi className="w-4 h-4 text-green-400" />
                                ) : (
                                    <WifiOff className="w-4 h-4 text-orange-400" />
                                )}
                            </div>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${status === 'prepared' && activeRegion ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'text-orange-400'}`}>
                            {statusCardContent.title}
                        </h2>
                        <p className="text-sm text-slate-300 mb-4">{statusCardContent.subtitle}</p>
                        <Link
                            to={statusCardContent.link.to}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform ${status === 'prepared' && activeRegion ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'}`}
                        >
                            <Navigation size={16} />
                            {statusCardContent.link.text}
                        </Link>
                    </div>
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

                {/* AI Model Status Badge */}
                <Link
                    to="/ai-models"
                    className="group flex items-center justify-between mt-2 px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/20 hover:border-purple-400/30 hover:bg-white/[0.07] transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Brain size={16} className="text-purple-400" />
                        <span className="text-sm text-slate-300">
                            {aiModelCount > 0
                                ? `${aiModelCount} model${aiModelCount !== 1 ? 's' : ''} installed`
                                : 'No AI models installed'
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-purple-400 group-hover:text-purple-300">
                        {aiModelCount === 0 ? (
                            <>
                                <Download size={12} />
                                Download
                            </>
                        ) : (
                            <>
                                Manage
                                <Navigation size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </div>
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
                        <button
                            className="btn btn-emergency btn-sm"
                            onClick={() => handleEmergencyPress('/protocol/evacuate-now')}
                        >
                            <Navigation size={16} />
                            Evacuate Now
                        </button>
                        <button
                            className="btn btn-emergency btn-sm"
                            onClick={() => handleEmergencyPress('/triage/health/cpr.ink.json')}
                        >
                            <Heart size={16} />
                            Medical Alert
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
});

export default Home;
