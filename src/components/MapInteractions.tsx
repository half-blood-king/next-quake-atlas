'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  mag: number;
  place: string;
  depth: number;
  time: number;
}

/**
 * Client island. The SVG content arrives as server-rendered children; this
 * component only adds hover tooltips and click-through via event delegation.
 */
export function MapInteractions({
  points,
  width,
  height,
  children,
}: {
  points: MapPoint[];
  width: number;
  height: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<MapPoint | null>(null);
  const byId = new Map(points.map((p) => [p.id, p]));

  const find = (target: EventTarget) => {
    const id = (target as Element).closest('[data-id]')?.getAttribute('data-id');
    return id ? byId.get(id) ?? null : null;
  };

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="map"
        onMouseOver={(e) => setHover(find(e.target))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const p = find(e.target);
          if (p) router.push(`/quake/${p.id}`);
        }}
      >
        {children}
        {hover && <circle cx={hover.x} cy={hover.y} r={14} fill="none" stroke="#fff" strokeOpacity={0.8} />}
      </svg>
      {hover && (
        <div
          className="tooltip"
          style={{ left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%` }}
        >
          <b>M {hover.mag.toFixed(1)}</b>
          <span>{hover.place}</span>
          <small>
            {hover.depth.toFixed(0)} km deep · {new Date(hover.time).toISOString().slice(11, 16)} UTC
          </small>
          <Link href={`/quake/${hover.id}`}>Details →</Link>
        </div>
      )}
    </div>
  );
}
