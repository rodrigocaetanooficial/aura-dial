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
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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
