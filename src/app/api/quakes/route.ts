import { NextResponse, type NextRequest } from 'next/server';
import { getFeed, parseLevel, parsePeriod } from '@/lib/usgs';

/**
 * GET /api/quakes?period=day&level=4.5
 * A compact JSON view of the feed for other clients, with CDN cache headers.
 */
export async function GET(req: NextRequest) {
  const period = parsePeriod(req.nextUrl.searchParams.get('period') ?? undefined);
  const level = parseLevel(req.nextUrl.searchParams.get('level') ?? undefined);
  try {
    const { quakes, generated } = await getFeed(period, level);
    return NextResponse.json(
      {
        period,
        level,
        generated: new Date(generated).toISOString(),
        count: quakes.length,
        quakes: quakes.map(({ id, mag, place, time, lat, lon, depth }) => ({ id, mag, place, time, lat, lon, depth })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
