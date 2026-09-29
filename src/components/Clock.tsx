import { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../utils/debounce';

interface Props {
  showClock: boolean;
  showDate: boolean;
  clock24h: boolean;
}

export function Clock({ showClock, showDate, clock24h }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 1000);
    // Background tabs throttle intervals to ~1/min anyway; resync on return
    // so the clock is never stale after a hidden stretch.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  if (!showClock && !showDate) return null;

  return (
    <div className="clock-widget">
      {showClock && (
        <span className="clock-time" suppressHydrationWarning>
          {formatTime(now, clock24h)}
        </span>
      )}
      {showDate && <span className="clock-date">{formatDate(now)}</span>}
    </div>
  );
}
