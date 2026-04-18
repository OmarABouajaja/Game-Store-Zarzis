/**
 * CacheManager — Simplified.
 * With skipWaiting: true in the workbox config, the new service worker
 * activates immediately. This component just listens for controllerchange
 * and reloads, no manual "Update" button needed.
 */
import { useEffect } from 'react';

const CacheManager = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // When a new SW takes over, reload for fresh content
      const handleControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null; // No visible UI needed
};

export default CacheManager;
