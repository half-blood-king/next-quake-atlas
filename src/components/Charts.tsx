import { DEPTH_BANDS, depthColor } from '@/lib/scale';
import type { Quake } from '@/lib/usgs';

/** Magnitude histogram in 0.5 bins, stacked by depth band. Pure SVG, rendered on the server. */
export function MagnitudeHistogram({ quakes }: { quakes: Quake[] }) {
  const W = 460;
  const H = 200;
  const pad = { l: 34, r: 8, t: 10, b: 26 };
  const bins = Array.from({ length: 18 }, (_, i) => ({ from: i * 0.5, counts: [0, 0, 0] }));
  for (const q of quakes) {
    const bin = bins[Math.min(bins.length - 1, Math.max(0, Math.floor(q.mag / 0.5)))];
    bin.counts[DEPTH_BANDS.findIndex((b) => q.depth < b.max)]++;
  }
  const used = bins.filter((b, i) => i >= bins.findIndex((x) => x.counts.some(Boolean)));
  const lastUsed = used.findLastIndex((b) => b.counts.some(Boolean));
  const shown = used.slice(0, lastUsed + 1);
  const max = Math.max(1, ...shown.map((b) => b.counts.reduce((a, c) => a + c, 0)));
  const bw = (W - pad.l - pad.r) / Math.max(shown.length, 1);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const ticks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Magnitude histogram">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ffffff12" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="tick">
            {t}
          </text>
        </g>
      ))}
      {shown.map((b, i) => {
        let acc = 0;
        return (
          <g key={b.from}>
            {b.counts.map((c, k) => {
              if (!c) return null;
              const y0 = y(acc);
              acc += c;
              return (
                <rect
                  key={k}
                  x={pad.l + i * bw + 1}
                  width={bw - 2}
                  y={y(acc)}
                  height={y0 - y(acc)}
                  fill={DEPTH_BANDS[k].color}
                  rx={1.5}
                >
                  <title>{`M${b.from}–${b.from + 0.5}: ${c} ${DEPTH_BANDS[k].label.toLowerCase()}`}</title>
                </rect>
              );
            })}
            {i % 2 === 0 && (
              <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="tick">
                {b.from}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Depth vs magnitude scatter with an inverted depth axis, like a cross-section of the crust. */
export function DepthScatter({ quakes }: { quakes: Quake[] }) {
  const W = 460;
  const H = 200;
  const pad = { l: 40, r: 10, t: 10, b: 26 };
  const maxDepth = Math.max(100, ...quakes.map((q) => q.depth));
  const maxMag = Math.max(5, ...quakes.map((q) => q.mag));
  const minMag = Math.min(0, ...quakes.map((q) => q.mag));
  const x = (m: number) => pad.l + ((m - minMag) / (maxMag - minMag)) * (W - pad.l - pad.r);
  const y = (d: number) => pad.t + (Math.max(d, 0) / maxDepth) * (H - pad.t - pad.b);
  const depthTicks = [0, Math.round(maxDepth / 2 / 50) * 50, Math.round(maxDepth / 50) * 50];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Depth versus magnitude">
      <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} fill="url(#crust)" />
      <defs>
        <linearGradient id="crust" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fbbf2408" />
          <stop offset="1" stopColor="#8b5cf622" />
        </linearGradient>
      </defs>
      {depthTicks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ffffff10" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="tick">
            {t}km
          </text>
        </g>
      ))}
      {Array.from({ length: Math.floor(maxMag) - Math.ceil(minMag) + 1 }, (_, i) => Math.ceil(minMag) + i).map((m) => (
        <text key={m} x={x(m)} y={H - 8} textAnchor="middle" className="tick">
          M{m}
        </text>
      ))}
      {quakes.map((q) => (
        <circle key={q.id} cx={x(q.mag)} cy={y(q.depth)} r={2.2} fill={depthColor(q.depth)} fillOpacity={0.7} />
      ))}
    </svg>
  );
}

/** 24 one-hour buckets (or 7 days) showing how activity is spread over the window. */
export function Timeline({ quakes, now, hours }: { quakes: Quake[]; now: number; hours: number }) {
  const W = 940;
  const H = 70;
  const buckets = hours <= 1 ? 12 : hours <= 24 ? 24 : 28;
  const span = (hours * 3600_000) / buckets;
  const counts = new Array(buckets).fill(0);
  for (const q of quakes) {
    const idx = buckets - 1 - Math.floor((now - q.time) / span);
    if (idx >= 0 && idx < buckets) counts[idx]++;
  }
  const max = Math.max(1, ...counts);
  const bw = W / buckets;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart timeline" preserveAspectRatio="none" role="img" aria-label="Activity timeline">
      {counts.map((c, i) => (
        <rect key={i} x={i * bw + 1.5} width={bw - 3} y={H - (c / max) * (H - 4)} height={(c / max) * (H - 4)} rx={2} fill="#38bdf8" fillOpacity={0.25 + (i / buckets) * 0.6}>
          <title>{`${c} events`}</title>
        </rect>
      ))}
    </svg>
  );
}
