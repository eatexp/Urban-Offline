import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div
            className="offline-indicator"
            role="status"
            aria-live="polite"
            aria-label="Network status: offline"
        >
            <WifiOff size={20} aria-hidden="true" />
            <span>You are currently offline</span>
        </div>
    );
};

export default OfflineIndicator;
