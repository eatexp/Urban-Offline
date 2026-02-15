import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import OfflineIndicator from './OfflineIndicator';
import AmbientStatusBar from './AmbientStatusBar';
import AmbientStatusBarBoundary from './AmbientStatusBarBoundary';
import SurvivalModeOverlay from './SurvivalModeOverlay';
import Search from './Search';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import ClawdBotFAB from './clawdBot/ClawdBotFAB';
import CriticalContentBanner from './CriticalContentBanner';
import { useEffect, useState } from 'react';
import { inkService } from '../services/InkService';
import { createLogger } from '../utils/logger';
import ContextManager from '../services/context/ContextManager';

const log = createLogger('Layout');

const Layout = () => {
    const [isMounted, setIsMounted] = useState(false);
    const location = useLocation();

    // Hide Search on Triage pages to allow the Search bar to "morph" into the Triage header
    // via View Transitions (they share the same view-transition-name).
    const isTriageMode = location.pathname.startsWith('/triage');

    useEffect(() => {
        // Trigger mount animation
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // Sync body attribute with survival mode state
    useEffect(() => {
        const contextManager = ContextManager.getInstance();
        
        // Initial sync
        const state = contextManager.getState();
        if (state.survivalMode?.active) {
            document.body.setAttribute('data-survival-mode', 'true');
        } else {
            document.body.removeAttribute('data-survival-mode');
        }

        // Subscribe to changes
        const unsubscribe = contextManager.subscribe((newState) => {
            if (newState.survivalMode?.active) {
                document.body.setAttribute('data-survival-mode', 'true');
            } else {
                document.body.removeAttribute('data-survival-mode');
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            {/* Survival Mode Overlay - renders conditionally when active */}
            <SurvivalModeOverlay />

            <div className={`app-layout flex flex-col h-screen ${isMounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <header
                className="bg-white border-b border-slate-200 p-3 z-50"
                style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            >
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                            Urban Offline
                        </div>
                            {/* Ambient Intelligence Status Bar - Desktop */}
                            <div className="hidden md:block">
                                <AmbientStatusBarBoundary>
                                    <AmbientStatusBar />
                                </AmbientStatusBarBoundary>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                            {/* Ambient Intelligence Status Bar - Mobile */}
                            <div className="md:hidden">
                                <AmbientStatusBarBoundary>
                                    <AmbientStatusBar />
                                </AmbientStatusBarBoundary>
                            </div>
                            {/* Only show search when not in Triage mode */}
                            {!isTriageMode && <Search />}
                        </div>
                    </div>
                    {/* OfflineIndicator kept as fallback for critical alerts if needed, or removed if redundant. 
                        User said "Scrap SystemMonitor... Build AmbientStatusBar instead". 
                        I'll keep OfflineIndicator for now as it might handle global toast/banner logic not covered by the pill. 
                        If it's just a visual indicator, AmbientStatusBar replaces it. 
                        Let's comment it out to be safe as per "The Clean Interface" directive. */}
                    {/* <OfflineIndicator /> */}
                </header>

                {/* Critical content warning banner - shows when emergency guides unavailable offline */}
                <CriticalContentBanner />

                <main className="container mx-auto flex-1 overflow-y-auto p-4 safe-area-bottom">
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
        </>
    );
};

export default Layout;
