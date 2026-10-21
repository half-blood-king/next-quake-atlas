# Quake Atlas

A live map of global earthquake activity. Data comes from the USGS real-time feed and is rendered **on the server** with React Server Components. The map, charts and globe ship as plain SVG, with almost no client JavaScript.

![stack](https://img.shields.io/badge/Next.js-15%20App%20Router-black) ![stack](https://img.shields.io/badge/React-19%20RSC-61dafb) ![stack](https://img.shields.io/badge/d3--geo-server%20side-f68e56)

## What it shows

| Concept | Where |
| --- | --- |
| **Server Components doing heavy work**: d3-geo projections, TopoJSON decoding and every SVG path are computed on the server, so the browser gets markup instead of a charting library | `src/lib/geo.ts`, `src/components/WorldMap.tsx`, `src/components/Charts.tsx` |
| **Streaming with Suspense**: the header is sent immediately and stats, map, charts and lists each stream in as their own boundary | `src/app/page.tsx` |
| **Request dedupe + data cache**: `React.cache` shares one fetch across sections, and `fetch(..., { next: { revalidate: 120 } })` caches USGS responses between requests | `src/lib/usgs.ts` |
| **Client islands**: only hover tooltips and relative timestamps hydrate. The map SVG is passed in as server-rendered `children` | `src/components/MapInteractions.tsx`, `src/components/RelativeTime.tsx` |
| **ISR + `generateStaticParams`**: the week's five strongest quakes are pre-rendered at build time, other IDs render on demand and are cached for 10 minutes | `src/app/quake/[id]/page.tsx` |
| **Dynamic metadata, `notFound()`, `error.tsx`, `loading.tsx`** | `src/app/**` |
| **Route Handler** with CDN cache headers: `GET /api/quakes?period=day&level=4.5` | `src/app/api/quakes/route.ts` |
| **`server-only` guard** so data and geo modules can never be bundled for the client | `src/lib/*.ts` |

## Features

- Equal Earth world map with quakes sized by magnitude, colored by depth, and pulsing if they happened in the last 3 hours
- Filter by window (hour / day / week / 30 days) and minimum magnitude, all URL-driven. The 30-day view starts at M2.5 to keep the payload small
- Magnitude histogram stacked by depth band, depth-vs-magnitude cross-section, activity timeline
- Detail page with an orthographic globe rotated to face the epicentre, distance rings, and nearby events from the past week (haversine distance)

## Run it

```bash
npm install
npm run dev
```

No API keys needed. The USGS feed is public.
