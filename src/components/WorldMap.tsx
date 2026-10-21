import { MAP_H, MAP_W, projectWorld, worldShapes } from '@/lib/geo';
import { depthColor, magRadius } from '@/lib/scale';
import type { Quake } from '@/lib/usgs';
import { MapInteractions, type MapPoint } from './MapInteractions';

/**
 * Server component: projection, land outlines and every circle are computed
 * here. The client island only receives a compact point list for hover tooltips.
 */
export function WorldMap({ quakes, now }: { quakes: Quake[]; now: number }) {
  // Draw small/old first so big and recent quakes sit on top.
  const ordered = [...quakes].sort((a, b) => a.mag - b.mag);
  const points: MapPoint[] = ordered.map((q) => {
    const [x, y] = projectWorld(q.lon, q.lat);
    return { id: q.id, x, y, mag: q.mag, place: q.place, depth: q.depth, time: q.time };
  });

  return (
    <MapInteractions points={points} width={MAP_W} height={MAP_H}>
      <defs>
        <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#0f1d3a" />
          <stop offset="1" stopColor="#060b18" />
        </radialGradient>
      </defs>
      <path d={worldShapes.sphere} fill="url(#ocean)" stroke="#1e2b4d" />
      <path d={worldShapes.graticule} fill="none" stroke="#ffffff0d" />
      <path d={worldShapes.land} fill="#1a2747" stroke="#2c3d66" strokeWidth={0.5} />
      <g>
        {points.map((p) => {
          const recent = now - p.time < 3 * 3600_000;
          const color = depthColor(p.depth);
          const r = magRadius(p.mag);
          return (
            <g key={p.id} data-id={p.id}>
              {recent && p.mag >= 2.5 && <circle className="pulse" cx={p.x} cy={p.y} r={r} stroke={color} />}
              <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={0.55} stroke={color} strokeWidth={0.8} />
            </g>
          );
        })}
      </g>
    </MapInteractions>
  );
}
