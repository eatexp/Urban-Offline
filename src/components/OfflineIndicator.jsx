import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <WifiOff size={18} />
      <span>You are offline. Content may be limited.</span>
      <style>{`
        .offline-indicator {
          background-color: var(--color-warning);
          color: #000;
          padding: var(--spacing-sm);
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;
