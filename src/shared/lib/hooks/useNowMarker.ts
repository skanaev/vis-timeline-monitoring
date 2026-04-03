import { useEffect, useState } from 'react';
import { TIMELINE_NOW_MARKER_INTERVAL_MS } from '../../config/timeline';

export const useNowMarker = (updateIntervalMs = TIMELINE_NOW_MARKER_INTERVAL_MS): Date => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, updateIntervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [updateIntervalMs]);

  return now;
};
