import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RelativeTime } from '@/components/RelativeTime';
import { globeShapes } from '@/lib/geo';
import { depthColor, fmtMag, fmtTime } from '@/lib/scale';
import { distanceKm, getFeed, getQuake, type Quake } from '@/lib/usgs';

type Params = Promise<{ id: string }>;

// Pre-render the week's five strongest quakes at build time; anything else renders on demand and is cached.
export async function generateStaticParams() {
  try {
    const { quakes } = await getFeed('week', '4.5');
    return [...quakes]
      .sort((a, b) => b.mag - a.mag)
      .slice(0, 5)
      .map((q) => ({ id: q.id }));
  } catch {
    return [];
  }
}

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const quake = await getQuake((await params).id);
  if (!quake) return { title: 'Quake not found' };
  return {
    title: `M ${fmtMag(quake.mag)} · ${quake.place}`,
    description: `Magnitude ${fmtMag(quake.mag)} earthquake ${quake.depth.toFixed(0)} km deep, ${fmtTime(quake.time)}.`,
  };
}

export default async function QuakePage({ params }: { params: Params }) {
  const quake = await getQuake((await params).id);
  if (!quake) notFound();
  const now = Date.now();
  const size = 360;
  const g = globeShapes(quake.lon, quake.lat, size);
  const color = depthColor(quake.depth);

  return (
    <main className="detail">
      <Link href="/" className="back">
        ← Atlas
      </Link>
      <div className="detail-grid">
        <svg viewBox={`0 0 ${size} ${size}`} className="globe" role="img" aria-label="Globe centred on the epicentre">
          <defs>
            <radialGradient id="globe" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#1a2c55" />
              <stop offset="1" stopColor="#050913" />
            </radialGradient>
          </defs>
          <path d={g.sphere} fill="url(#globe)" stroke="#22315a" />
          <path d={g.graticule} fill="none" stroke="#ffffff10" />
          <path d={g.land} fill="#2b4178" stroke="#4d68a8" strokeWidth={0.6} />
          {[2, 5, 10].map((deg) => (
            <path key={deg} d={g.circle(deg)} fill="none" stroke={color} strokeOpacity={0.85} strokeWidth={1.2} strokeDasharray="4 4" />
          ))}
          <circle cx={g.point[0]} cy={g.point[1]} r={14} fill={color} fillOpacity={0.25} className="pulse-fill" />
          <circle cx={g.point[0]} cy={g.point[1]} r={5} fill={color} />
        </svg>

        <div>
          <p className="eyebrow">{quake.magType.toUpperCase()} magnitude</p>
          <h1 className="big-mag" style={{ color }}>
            {fmtMag(quake.mag)}
          </h1>
          <h2 className="place-title">{quake.place}</h2>
          <dl className="facts">
            <div>
              <dt>When</dt>
              <dd>
                {fmtTime(quake.time)} (<RelativeTime ms={quake.time} serverNow={now} />)
              </dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>{quake.depth.toFixed(1)} km</dd>
            </div>
            <div>
              <dt>Coordinates</dt>
              <dd>
                {quake.lat.toFixed(3)}°, {quake.lon.toFixed(3)}°
              </dd>
            </div>
            <div>
              <dt>Significance</dt>
              <dd>{quake.sig} / 1000+</dd>
            </div>
            <div>
              <dt>Felt reports</dt>
              <dd>{quake.felt ?? 0}</dd>
            </div>
            <div>
              <dt>PAGER alert</dt>
              <dd className={quake.alert ? `alert ${quake.alert}` : ''}>{quake.alert ?? 'none'}</dd>
            </div>
          </dl>
          <a href={quake.url} target="_blank" rel="noreferrer" className="usgs">
            Open on USGS ↗
          </a>
          <p className="rings">Dashed rings: 2°, 5° and 10° from the epicentre (≈ 220, 555, 1110 km).</p>
        </div>
      </div>

      <section className="card">
        <h2>Nearby activity this week (within 500 km)</h2>
        <Suspense fallback={<div className="list skeleton" />}>
          <Nearby quake={quake} now={now} />
        </Suspense>
      </section>
    </main>
  );
}

async function Nearby({ quake, now }: { quake: Quake; now: number }) {
  const { quakes } = await getFeed('week', '2.5');
  const near = quakes
    .filter((q) => q.id !== quake.id)
    .map((q) => ({ q, km: distanceKm(quake, q) }))
    .filter((x) => x.km < 500)
    .sort((a, b) => a.km - b.km)
    .slice(0, 8);
  if (!near.length) return <p className="empty">No other M2.5+ events within 500 km this week.</p>;
  return (
    <ol className="top-list">
      {near.map(({ q, km }) => (
        <li key={q.id}>
          <Link href={`/quake/${q.id}`}>
            <span className="mag" style={{ borderColor: depthColor(q.depth) }}>
              {fmtMag(q.mag)}
            </span>
            <span className="place">{q.place}</span>
            <span className="meta">
              {km.toFixed(0)} km away · <RelativeTime ms={q.time} serverNow={now} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
