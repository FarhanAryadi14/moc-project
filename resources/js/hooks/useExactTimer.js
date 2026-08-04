import { useState, useEffect } from 'react';

/**
 * Custom hook for Date.now-based countdown timer.
 * Eliminates browser tab throttling/drift by recalculating delta from system timestamp.
 */
export function useExactTimer(targetTimestampMs, onExpire) {
  const calculateTime = () => {
    if (!targetTimestampMs) return { remainingSec: 0, formatted: '00:00', isExpired: true };

    const now = Date.now();
    const diffMs = targetTimestampMs - now;
    const remainingSec = Math.max(0, Math.floor(diffMs / 1000));

    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return {
      remainingSec,
      formatted,
      isExpired: remainingSec === 0,
    };
  };

  const [timeState, setTimeState] = useState(calculateTime);

  useEffect(() => {
    if (!targetTimestampMs) return;

    // Tick every 1 second
    const interval = setInterval(() => {
      const updated = calculateTime();
      setTimeState(updated);

      if (updated.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestampMs]);

  return timeState;
}
