import { useEffect, useState, useCallback } from 'react';
import { flush, queueSize, OFFLINE_QUEUE_CHANGED_EVENT } from './offlineQueue';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(queueSize());
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!navigator.onLine || queueSize() === 0) return;
    setSyncing(true);
    try {
      await flush();
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); sync(); };
    const onOffline = () => setIsOnline(false);
    const onQueueChanged = () => setPending(queueSize());

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onQueueChanged);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onQueueChanged);
    };
  }, [sync]);

  return { isOnline, pending, syncing, syncNow: sync };
}
