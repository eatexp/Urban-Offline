import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isVisible, setIsVisible] = useState(!navigator.onLine);
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            // Show "back online" message briefly
            setShowOnlineMessage(true);
            setIsOffline(false);

            // Hide after 2 seconds
            setTimeout(() => {
                setIsVisible(false);
                setShowOnlineMessage(false);
            }, 2000);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setIsVisible(true);
            setShowOnlineMessage(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium"
            style={{
                background: isOffline
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))'
                    : 'linear-gradient(90deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95))',
                color: 'white',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: isOffline
                    ? 'slide-down var(--duration-normal) var(--ease-out)'
                    : 'slide-down var(--duration-normal) var(--ease-out)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
        >
            {isOffline ? (
                <>
                    <WifiOff size={18} />
                    <span>You are currently offline</span>
                </>
            ) : showOnlineMessage ? (
                <>
                    <Wifi size={18} />
                    <span>Back online</span>
                </>
            ) : null}
        </div>
    );
};

export default OfflineIndicator;
