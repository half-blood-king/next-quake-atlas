import 'server-only';
import { geoCircle, geoEqualEarth, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import type { FeatureCollection, MultiPolygon } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import land110 from 'world-atlas/land-110m.json';

const topo = land110 as unknown as Topology;
const land = feature(topo, topo.objects.land) as unknown as FeatureCollection<MultiPolygon>;

export const MAP_W = 960;
export const MAP_H = 470;

const world = geoEqualEarth().fitExtent(
  [
    [8, 8],
    [MAP_W - 8, MAP_H - 8],
  ],
  { type: 'Sphere' },
);
const worldPath = geoPath(world);

// Heavy path strings are computed once per server process and never shipped as JS.
export const worldShapes = {
  sphere: worldPath({ type: 'Sphere' }) ?? '',
  graticule: worldPath(geoGraticule10()) ?? '',
  land: worldPath(land) ?? '',
};

export function projectWorld(lon: number, lat: number): [number, number] {
  return world([lon, lat]) ?? [0, 0];
}

/** A globe rotated so (lon, lat) faces the viewer. Rendered per request on the server. */
export function globeShapes(lon: number, lat: number, size: number) {
  const proj = geoOrthographic()
    .rotate([-lon, -lat])
    .fitExtent(
      [
        [4, 4],
        [size - 4, size - 4],
      ],
      { type: 'Sphere' },
    );
  const path = geoPath(proj);
  return {
    sphere: path({ type: 'Sphere' }) ?? '',
    graticule: path(geoGraticule10()) ?? '',
    land: path(land) ?? '',
    point: proj([lon, lat]) ?? [size / 2, size / 2],
    circle: (radiusDeg: number) => path(geoCircle().center([lon, lat]).radius(radiusDeg)()) ?? '',
  };
}
