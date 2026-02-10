import { RouterProvider } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { router } from './router';

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

function App() {
    // Initialize Android hardware back button handling
    useAndroidBackButton();

    return (
        <ErrorBoundary showDetails={import.meta.env.DEV}>
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
}

export default App;


