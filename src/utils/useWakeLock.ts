import { useEffect, useRef, useState } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  requestLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
}

export function useWakeLock(shouldLock: boolean = false): UseWakeLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const requestLock = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      if (wakeLockRef.current !== null && !wakeLockRef.current.released) {
        return true;
      }
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsLocked(true);

      wakeLockRef.current.addEventListener('release', () => {
        setIsLocked(false);
        wakeLockRef.current = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsLocked(false);
      return false;
    }
  };

  const releaseLock = async () => {
    try {
      if (wakeLockRef.current !== null) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setIsLocked(false);
    } catch (err) {
      console.warn('Wake Lock release failed:', err);
    }
  };

  // Re-acquire lock on tab visibility change if still requested
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldLock) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldLock]);

  // Request or release lock when shouldLock parameter changes
  useEffect(() => {
    if (shouldLock) {
      requestLock();
    } else {
      releaseLock();
    }

    return () => {
      releaseLock();
    };
  }, [shouldLock]);

  return { isSupported, isLocked, requestLock, releaseLock };
}

