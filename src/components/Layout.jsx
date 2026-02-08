import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import OfflineIndicator from './OfflineIndicator';
import Search from './Search';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import ClawdBotFAB from './clawdBot/ClawdBotFAB';
import CriticalContentBanner from './CriticalContentBanner';
import { useEffect, useState } from 'react';
import { inkService } from '../services/InkService';
import { createLogger } from '../utils/logger';

const log = createLogger('Layout');

const Layout = () => {
    const [isMounted, setIsMounted] = useState(false);
    const location = useLocation();

    // Hide Search on Triage pages to allow the Search bar to "morph" into the Triage header
    // via View Transitions (they share the same view-transition-name).
    const isTriageMode = location.pathname.startsWith('/triage');

    useEffect(() => {
        // Trigger mount animation
        setIsMounted(true);

        // Preload critical emergency stories for offline availability
        // This runs in background, doesn't block initial render
        inkService.preloadCriticalStories()
            .then(result => {
                if (result.loaded > 0) {
                    log.info(`Preloaded ${result.loaded} critical stories for offline use`);
                }
            })
            .catch(err => log.warn('Failed to preload critical stories', err));
    }, []);

    // =============================================================================
    // VERIFIED: [NativeUX] LAYOUT_SAFE_AREA_CONSISTENCY
    // =============================================================================
    // Implementation: Header uses padding-top with max() to account for iOS status
    //   bar and Dynamic Island. Value is max(12px, env(safe-area-inset-top)) to
    //   ensure minimum padding on devices without notches while respecting safe areas.
    // Main content uses pt-safe class for consistent spacing across iOS/Android.
    // =============================================================================

    return (
        <div className={`app-layout flex flex-col h-screen ${isMounted ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Skip to main content - accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-orange-500 focus:text-white focus:font-bold focus:text-sm"
            >
                Skip to main content
            </a>

            <header
                className="bg-slate-900/95 backdrop-blur-lg p-3 shadow-lg z-50 border-b border-slate-800"
                style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
                role="banner"
            >
                <div className="container mx-auto flex items-center justify-between">
                    <div className="font-bold text-primary text-sm tracking-tighter flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-emergency-pulse" aria-hidden="true"></div>
                        URBAN OFFLINE
                    </div>
                    {/* Only show search when not in Triage mode */}
                    {!isTriageMode && <Search />}
                </div>
                <OfflineIndicator />
            </header>

            {/* Critical content warning banner - shows when emergency guides unavailable offline */}
            <CriticalContentBanner />

            <main id="main-content" className="container mx-auto flex-1 overflow-y-auto p-4 safe-area-bottom" role="main">
                <div className="animate-slide-up">
                    <Outlet />
                </div>
            </main>

            {/* Smart AI Download Prompt - shows when conditions are favorable */}
            <SmartDownloadPrompt />

            <Navbar />

            {/* clawdBot Floating Action Button */}
            <ClawdBotFAB />
        </div>
    );
};

export default Layout;
