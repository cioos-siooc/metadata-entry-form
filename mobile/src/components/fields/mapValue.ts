/**
 * The spatial extent data contract, matched to the web app exactly.
 *
 * Two shapes share one `map` object and the rules are not obvious:
 *
 *   Rectangle — writes north/south/east/west and clears `polygon` to "".
 *   Polygon   — writes the "lat,lon lat,lon …" string AND the derived bbox.
 *
 * Only one shape exists at a time. Coordinates are rounded to 4 decimals and
 * stored as numbers, which is what `limitDecimals` does in MapSelect.jsx.
 *
 * The ring closes by re-appending the FIRST point, because `polygonIsValid`
 * compares the first and last coordinate strings and rejects the polygon
 * outright if they differ — a polygon that fails to close silently blocks
 * submission with a "Spatial information is missing" error that points nowhere.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapValue {
  north?: number | string;
  south?: number | string;
  east?: number | string;
  west?: number | string;
  polygon?: string;
  description?: { en: string; fr: string };
}

/** 4 decimals, as a number. Mirrors MapSelect's limitDecimals. */
export const limitDecimals = (value: number): number =>
  Number(Number.parseFloat(String(value)).toFixed(4));

/** Stored polygon string → points. Returns [] for anything unusable. */
export function parsePolygon(polygon: unknown): LatLng[] {
  if (typeof polygon !== "string" || polygon.trim() === "") return [];

  const points: LatLng[] = [];
  for (const pair of polygon.trim().split(/\s+/)) {
    const [lat, lon] = pair.split(",");
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return [];
    points.push({ latitude, longitude });
  }
  return points;
}

/**
 * Points → the stored string, closing the ring.
 *
 * Takes the open ring (what a map gives you) and appends the first point, so
 * callers never have to remember to close it themselves.
 */
export function formatPolygon(points: LatLng[]): string {
  if (points.length === 0) return "";
  const coords = points.map(
    (point) => `${limitDecimals(point.latitude)},${limitDecimals(point.longitude)}`,
  );
  return [...coords, coords[0]].join(" ");
}

/** Strips the duplicated closing point, for editing. */
export function openRing(points: LatLng[]): LatLng[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return first.latitude === last.latitude && first.longitude === last.longitude
    ? points.slice(0, -1)
    : points;
}

/** The bounding box a set of points sits in. */
export function boundsFromPoints(points: LatLng[]): Bounds | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  return {
    north: limitDecimals(Math.max(...lats)),
    south: limitDecimals(Math.min(...lats)),
    east: limitDecimals(Math.max(...lons)),
    west: limitDecimals(Math.min(...lons)),
  };
}

/** Reads a stored bbox, if it is complete and numeric. */
export function boundsFromMap(map: MapValue | undefined): Bounds | null {
  if (!map) return null;
  const north = Number.parseFloat(String(map.north));
  const south = Number.parseFloat(String(map.south));
  const east = Number.parseFloat(String(map.east));
  const west = Number.parseFloat(String(map.west));
  if ([north, south, east, west].some((n) => Number.isNaN(n))) return null;
  return { north, south, east, west };
}

/** The four corners of a bbox, for drawing it as a closed shape. */
export function boundsToCorners(bounds: Bounds): LatLng[] {
  return [
    { latitude: bounds.north, longitude: bounds.west },
    { latitude: bounds.north, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.west },
  ];
}

/** A rectangle from two opposite corners, in any order. */
export function boundsFromCorners(a: LatLng, b: LatLng): Bounds {
  return {
    north: limitDecimals(Math.max(a.latitude, b.latitude)),
    south: limitDecimals(Math.min(a.latitude, b.latitude)),
    east: limitDecimals(Math.max(a.longitude, b.longitude)),
    west: limitDecimals(Math.min(a.longitude, b.longitude)),
  };
}

/**
 * The record patch for a rectangle. Clears `polygon` — the two are mutually
 * exclusive, and leaving a stale polygon behind would make the map show one
 * shape while the record described another.
 */
export function rectanglePatch(map: MapValue, bounds: Bounds): MapValue {
  return { ...map, ...bounds, polygon: "" };
}

/** The record patch for a polygon: the string plus its derived bbox. */
export function polygonPatch(map: MapValue, points: LatLng[]): MapValue {
  const open = openRing(points);
  if (open.length < 3) return { ...map, polygon: "" };
  const bounds = boundsFromPoints(open);
  return { ...map, polygon: formatPolygon(open), ...(bounds ?? {}) };
}

/** A viewport that comfortably contains `bounds`. */
export function regionForBounds(bounds: Bounds) {
  const latitudeDelta = Math.max(0.05, Math.abs(bounds.north - bounds.south) * 1.4);
  const longitudeDelta = Math.max(0.05, Math.abs(bounds.east - bounds.west) * 1.4);
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
