export const DEPTH_BANDS = [
  { max: 70, label: 'Shallow < 70 km', color: '#fbbf24' },
  { max: 300, label: 'Intermediate 70–300 km', color: '#f43f5e' },
  { max: Infinity, label: 'Deep > 300 km', color: '#8b5cf6' },
];

export function depthColor(depth: number) {
  return DEPTH_BANDS.find((b) => depth < b.max)!.color;
}

/** Energy grows ~32× per magnitude unit; this keeps circles readable while preserving order. */
export function magRadius(mag: number) {
  return Math.max(1.2, 1.15 ** Math.max(mag, 0) * 2.2 + (mag > 5 ? (mag - 5) * 3 : 0));
}

export function fmtMag(mag: number) {
  return mag.toFixed(1);
}

export function fmtTime(ms: number) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(ms) + ' UTC';
}
