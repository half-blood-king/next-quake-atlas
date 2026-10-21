import Link from 'next/link';
import { Suspense } from 'react';
import { DepthScatter, MagnitudeHistogram, Timeline } from '@/components/Charts';
import { RelativeTime } from '@/components/RelativeTime';
import { WorldMap } from '@/components/WorldMap';
import { DEPTH_BANDS, depthColor, fmtMag } from '@/lib/scale';
import { getFeed, LEVELS, parseLevel, parsePeriod, PERIODS, type Level, type Period } from '@/lib/usgs';

type Search = Promise<{ period?: string; level?: string }>;

const HOURS: Record<Period, number> = { hour: 1, day: 24, week: 168 };

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const level = parseLevel(sp.level);
  const now = Date.now();

  return (
    <main>
      <header className="top">
        <div>
          <h1>
            Quake<span>Atlas</span>
          </h1>
          <p className="sub">Live seismic activity from the USGS feed, rendered entirely on the server.</p>
        </div>
        <nav className="filters">
          <div className="seg">
            {(Object.keys(PERIODS) as Period[]).map((p) => (
              <Link key={p} href={`/?period=${p}&level=${level}`} className={p === period ? 'on' : ''} scroll={false}>
                {PERIODS[p]}
              </Link>
            ))}
          </div>
          <div className="seg">
            {(Object.keys(LEVELS) as Level[]).map((l) => (
              <Link key={l} href={`/?period=${period}&level=${l}`} className={l === level ? 'on' : ''} scroll={false}>
                {LEVELS[l]}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Each boundary streams in on its own; the shell above is sent immediately. */}
      <Suspense key={`stats-${period}-${level}`} fallback={<div className="stats skeleton" />}>
        <Stats period={period} level={level} now={now} />
      </Suspense>

      <section className="card map-card">
        <Suspense key={`map-${period}-${level}`} fallback={<div className="map skeleton" />}>
          <MapSection period={period} level={level} now={now} />
        </Suspense>
        <div className="legend">
          {DEPTH_BANDS.map((b) => (
            <span key={b.label}>
              <i style={{ background: b.color }} /> {b.label}
            </span>
          ))}
          <span className="pulse-key">◯ pulsing = last 3 h</span>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Magnitude distribution</h2>
          <Suspense fallback={<div className="chart skeleton" />}>
            <Histogram period={period} level={level} />
          </Suspense>
        </section>
        <section className="card">
          <h2>Depth vs magnitude</h2>
          <Suspense fallback={<div className="chart skeleton" />}>
            <Scatter period={period} level={level} />
          </Suspense>
        </section>
      </div>

      <section className="card">
        <h2>Activity over {PERIODS[period].toLowerCase()}</h2>
        <Suspense fallback={<div className="timeline skeleton" />}>
          <TimelineSection period={period} level={level} now={now} />
        </Suspense>
      </section>

      <section className="card">
        <h2>Strongest events</h2>
        <Suspense fallback={<div className="list skeleton" />}>
          <TopList period={period} level={level} now={now} />
        </Suspense>
      </section>
    </main>
  );
}

type SectionProps = { period: Period; level: Level; now: number };

async function Stats({ period, level, now }: SectionProps) {
  const { quakes, generated } = await getFeed(period, level);
  const strongest = quakes.reduce<(typeof quakes)[number] | null>((a, q) => (!a || q.mag > a.mag ? q : a), null);
  const felt = quakes.filter((q) => q.felt).length;
  const tsunami = quakes.filter((q) => q.tsunami).length;
  const avgDepth = quakes.length ? quakes.reduce((s, q) => s + q.depth, 0) / quakes.length : 0;

  return (
    <div className="stats">
      <div>
        <span>Events</span>
        <b>{quakes.length.toLocaleString()}</b>
        <small>
          feed updated <RelativeTime ms={generated} serverNow={now} />
        </small>
      </div>
      <div>
        <span>Strongest</span>
        <b>{strongest ? `M ${fmtMag(strongest.mag)}` : '–'}</b>
        <small>{strongest?.place ?? 'quiet period'}</small>
      </div>
      <div>
        <span>Felt reports</span>
        <b>{felt}</b>
        <small>events people reported feeling</small>
      </div>
      <div>
        <span>Avg depth</span>
        <b>{avgDepth.toFixed(0)} km</b>
        <small>{tsunami ? `${tsunami} with tsunami flag` : 'no tsunami flags'}</small>
      </div>
    </div>
  );
}

async function MapSection({ period, level, now }: SectionProps) {
  const { quakes } = await getFeed(period, level);
  return <WorldMap quakes={quakes} now={now} />;
}

async function Histogram({ period, level }: Omit<SectionProps, 'now'>) {
  const { quakes } = await getFeed(period, level);
  return <MagnitudeHistogram quakes={quakes} />;
}

async function Scatter({ period, level }: Omit<SectionProps, 'now'>) {
  const { quakes } = await getFeed(period, level);
  return <DepthScatter quakes={quakes} />;
}

async function TimelineSection({ period, level, now }: SectionProps) {
  const { quakes } = await getFeed(period, level);
  return <Timeline quakes={quakes} now={now} hours={HOURS[period]} />;
}

async function TopList({ period, level, now }: SectionProps) {
  const { quakes } = await getFeed(period, level);
  const top = [...quakes].sort((a, b) => b.mag - a.mag).slice(0, 10);
  if (!top.length) return <p className="empty">No events in this window.</p>;
  return (
    <ol className="top-list">
      {top.map((q) => (
        <li key={q.id}>
          <Link href={`/quake/${q.id}`}>
            <span className="mag" style={{ borderColor: depthColor(q.depth) }}>
              {fmtMag(q.mag)}
            </span>
            <span className="place">{q.place}</span>
            <span className="meta">
              {q.depth.toFixed(0)} km · <RelativeTime ms={q.time} serverNow={now} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
