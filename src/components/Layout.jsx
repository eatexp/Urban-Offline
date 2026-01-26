import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import OfflineIndicator from './OfflineIndicator';
import Search from './Search';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { useEffect, useState } from 'react';

const Layout = () => {
    const [isMounted, setIsMounted] = useState(false);
    const location = useLocation();

    // Hide Search on Triage pages to allow the Search bar to "morph" into the Triage header
    // via View Transitions (they share the same view-transition-name).
    const isTriageMode = location.pathname.startsWith('/triage');

    useEffect(() => {
        // Trigger mount animation
        setIsMounted(true);
    }, []);

    return (
        <div className={`app-layout flex flex-col h-screen ${isMounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <header className="bg-slate-900/95 backdrop-blur-lg p-3 shadow-lg z-50 border-b border-slate-800">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="font-bold text-primary text-sm tracking-tighter flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-emergency-pulse"></div>
                        URBAN OFFLINE
                    </div>
                    {/* Only show search when not in Triage mode */}
                    {!isTriageMode && <Search />}
                </div>
                <OfflineIndicator />
            </header>

            <main className="container mx-auto flex-1 overflow-y-auto p-4 safe-area-bottom">
                <div className="animate-slide-up">
                    <Outlet />
                </div>
            </main>

            {/* Smart AI Download Prompt - shows when conditions are favorable */}
            <SmartDownloadPrompt />

            <Navbar />
        </div>
    );
};

export default Layout;
