import { RouterProvider } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AIGeneratingProvider } from './contexts/AIGeneratingContext';
import { router } from './router';
import { isNativeMobile } from './utils/platform';
import BatteryManager from './services/power/BatteryManager';
import { usePremiumNativeFeel } from './hooks/useNativeFeel';

// Android hardware back button handling
// Uses Capacitor App plugin if available, falls back gracefully on web
const useAndroidBackButton = () => {
    const lastBackPress = useRef(0);

    useEffect(() => {
        let cleanup = null;

        const setupBackButton = async () => {
            try {
                // Dynamic import to avoid errors if Capacitor is not available
                const { App } = await import('@capacitor/app');

                const handleBackButton = ({ canGoBack }) => {
                    const now = Date.now();

                    if (canGoBack) {
                        // Navigate back through history
                        window.history.back();
                        return;
                    }

                    // At root - show "press again to exit" or exit
                    if (now - lastBackPress.current < 2000) {
                        // Exit app on second press within 2 seconds
                        App.exitApp();
                    } else {
                        // Show toast on first press
                        lastBackPress.current = now;

                        // Dispatch toast event for UI to show
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('show-exit-toast', {
                                detail: { message: 'Press back again to exit' }
                            }));
                        }

                        // Auto-hide toast after 2 seconds
                        setTimeout(() => {
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('hide-exit-toast'));
                            }
                        }, 2000);
                    }
                };

                App.addListener('backButton', handleBackButton);
                cleanup = () => App.removeAllListeners();
            } catch (_e) {
                // Capacitor not available - app is running in web browser
                // No back button handling needed
                console.debug('Capacitor App plugin not available, skipping back button handler');
            }
        };

        setupBackButton();

        return () => {
            if (cleanup) cleanup();
        };
    }, []);
};

// Status Bar customization for immersive "Tactical Dark" theme
const useStatusBar = () => {
    useEffect(() => {
        const configureStatusBar = async () => {
            // Only run on native mobile (iOS/Android)
            if (!isNativeMobile()) return;

            try {
                const { StatusBar, Style } = await import('@capacitor/status-bar');

                // 1. Overlay webview (content goes under status bar) - Critical for "edge-to-edge"
                await StatusBar.setOverlaysWebView({ overlay: true });

                // 2. Set style to Dark (Light text)
                await StatusBar.setStyle({ style: Style.Dark });

                // 3. Set background to transparent
                // Android specific, but good practice to be explicit
                await StatusBar.setBackgroundColor({ color: '#00000000' });

                console.debug('StatusBar configured for Tactical Dark theme');
            } catch (_err) {
                console.warn('Failed to configure Status Bar:', _err);
            }
        };

        configureStatusBar();
    }, []);
};

// Initialize BatteryManager for power monitoring
const useBatteryManager = () => {
    useEffect(() => {
        const initBattery = async () => {
            try {
                const batteryManager = BatteryManager.getInstance();
                await batteryManager.initialize();
            } catch (_err) {
                console.warn('Failed to initialize BatteryManager:', _err);
            }
        };

        initBattery();

        // Cleanup on unmount
        return () => {
            try {
                BatteryManager.getInstance().stop();
            } catch (_err) {
                // Ignore cleanup errors
            }
        };
    }, []);
};

function App() {
    // Initialize premium native feel (iOS/Android optimizations)
    usePremiumNativeFeel();

    // Initialize Android hardware back button handling
    useAndroidBackButton();

    // Initialize Status Bar configuration (transparent/dark for native)
    useStatusBar();

    // Initialize BatteryManager for power monitoring
    useBatteryManager();

    return (
        <ErrorBoundary showDetails={import.meta.env.DEV}>
            <AIGeneratingProvider>
                <RouterProvider router={router} />
            </AIGeneratingProvider>
        </ErrorBoundary>
    );
}

export default App;


