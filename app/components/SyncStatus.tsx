'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { syncPendingOperations, getPendingOperations } from '@/lib/sync';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkPending = async () => {
    try {
      const pending = await getPendingOperations();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error checking pending operations:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPendingOperations();
      await checkPending();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="card p-3 sm:p-4 shadow-xl">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-emerald-400" />
              {pendingCount > 0 ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {pendingCount} operatie{pendingCount !== 1 ? 's' : ''} wachten
                    </p>
                    <p className="text-xs text-slate-400">Op synchronisatie</p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-secondary p-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-200">Gesynchroniseerd</p>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Offline</p>
                <p className="text-xs text-slate-400">Wijzigingen worden lokaal opgeslagen</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
