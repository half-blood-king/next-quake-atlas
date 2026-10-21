'use client';

import { useEffect, useState } from 'react';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function format(ms: number, now: number) {
  const s = Math.round((ms - now) / 1000);
  if (Math.abs(s) < 60) return rtf.format(s, 'second');
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, 'minute');
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, 'hour');
  return rtf.format(Math.round(h / 24), 'day');
}

/**
 * Renders the server's timestamp first (no hydration mismatch), then ticks on
 * the client so "3 minutes ago" stays honest without refetching anything.
 */
export function RelativeTime({ ms, serverNow }: { ms: number; serverNow: number }) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  return <time dateTime={new Date(ms).toISOString()}>{format(ms, now)}</time>;
}
