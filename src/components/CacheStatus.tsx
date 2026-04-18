import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface CacheStatusProps {
  className?: string;
}

/**
 * CacheStatus - Shows a temporary banner ONLY on connectivity transitions.
 * - When going offline: Shows persistent red "Offline" banner
 * - When coming back online: Shows green "Back Online" for 3 seconds then disappears
 * - Does NOT show anything on normal page load when already online
 */
const CacheStatus = ({ className = '' }: CacheStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    // Only show banner on actual transitions, not on initial load
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setBannerType('online');
      setShowBanner(true);
      // Auto-hide "Back Online" banner after 3 seconds
      hideTimeout = setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBannerType('offline');
      setShowBanner(true);
      // Keep offline banner visible (don't auto-hide)
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, []);

  // Don't render anything if no transition happened
  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-2 ${
        bannerType === 'online'
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      } ${className}`}
    >
      {bannerType === 'online' ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline</span>
        </>
      )}
    </div>
  );
};

export default CacheStatus;
