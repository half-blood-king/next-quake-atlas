import 'server-only';
import { cache } from 'react';

export const PERIODS = { hour: 'Past hour', day: 'Past day', week: 'Past 7 days', month: 'Past 30 days' } as const;
export const LEVELS = { all: 'All', '1.0': 'M1+', '2.5': 'M2.5+', '4.5': 'M4.5+' } as const;
export type Period = keyof typeof PERIODS;
export type Level = keyof typeof LEVELS;

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  felt: number | null;
  tsunami: boolean;
  alert: string | null;
  sig: number;
  magType: string;
  lon: number;
  lat: number;
  depth: number;
}

interface Feature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    url: string;
    felt: number | null;
    tsunami: number;
    alert: string | null;
    sig: number;
    magType: string;
    title: string;
  };
  geometry: { coordinates: [number, number, number] };
}

const BASE = 'https://earthquake.usgs.gov';

function toQuake(f: Feature): Quake {
  const [lon, lat, depth] = f.geometry.coordinates;
  return {
    id: f.id,
    mag: f.properties.mag ?? 0,
    place: f.properties.place ?? 'Unknown location',
    time: f.properties.time,
    url: f.properties.url,
    felt: f.properties.felt,
    tsunami: f.properties.tsunami === 1,
    alert: f.properties.alert,
    sig: f.properties.sig,
    magType: f.properties.magType,
    lon,
    lat,
    depth,
  };
}

export function parsePeriod(v: string | undefined): Period {
  return v && v in PERIODS ? (v as Period) : 'day';
}

export function parseLevel(v: string | undefined): Level {
  return v && v in LEVELS ? (v as Level) : '2.5';
}

/** The 30-day "all" and "M1+" feeds are 10+ MB, so the month view starts at M2.5. */
export function levelsFor(period: Period): Level[] {
  const all = Object.keys(LEVELS) as Level[];
  return period === 'month' ? all.filter((l) => l === '2.5' || l === '4.5') : all;
}

export function fitLevel(period: Period, level: Level): Level {
  return levelsFor(period).includes(level) ? level : '2.5';
}

/**
 * `cache` dedupes calls within one render, so every streamed section below can
 * ask for the feed independently. `revalidate` makes Next's data cache refetch
 * from USGS at most every two minutes across requests.
 */
export const getFeed = cache(async (period: Period, level: Level) => {
  const res = await fetch(`${BASE}/earthquakes/feed/v1.0/summary/${level}_${period}.geojson`, {
    next: { revalidate: 120, tags: ['quakes'] },
  });
  if (!res.ok) throw new Error(`USGS feed responded ${res.status}`);
  const json = (await res.json()) as { metadata: { generated: number }; features: Feature[] };
  return {
    generated: json.metadata.generated,
    quakes: json.features.map(toQuake).sort((a, b) => b.time - a.time),
  };
});

export const getQuake = cache(async (id: string): Promise<Quake | null> => {
  const res = await fetch(`${BASE}/fdsnws/event/1/query?eventid=${encodeURIComponent(id)}&format=geojson`, {
    next: { revalidate: 600 },
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`USGS event responded ${res.status}`);
  return toQuake((await res.json()) as Feature);
});

/** Great-circle distance in km. */
export function distanceKm(a: Pick<Quake, 'lat' | 'lon'>, b: Pick<Quake, 'lat' | 'lon'>) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
