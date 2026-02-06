import { Coordinates, GeoJSONPolygon } from '@/types/kariah';

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point - The point to check (lat, lng)
 * @param polygon - GeoJSON polygon
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(
  point: Coordinates,
  polygon: GeoJSONPolygon
): boolean {
  if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
    return false;
  }

  // Get the outer ring (first coordinate array)
  const ring = polygon.coordinates[0];
  
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; // longitude
    const yi = ring[i][1]; // latitude
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Find which kawasan a point belongs to
 * @param point - Coordinates to check
 * @param kawasanList - Array of kawasan with boundaries
 * @returns Kawasan ID if found, null otherwise
 */
export function findKawasanByPoint(
  point: Coordinates,
  kawasanList: Array<{ id: string; boundaries: GeoJSONPolygon | null }>
): string | null {
  for (const kawasan of kawasanList) {
    if (kawasan.boundaries && isPointInPolygon(point, kawasan.boundaries)) {
      return kawasan.id;
    }
  }
  return null;
}

/**
 * Convert Leaflet LatLng array to GeoJSON Polygon
 * @param latlngs - Array of {lat, lng} from Leaflet
 * @returns GeoJSON Polygon
 */
export function leafletToGeoJSON(
  latlngs: Array<{ lat: number; lng: number }>
): GeoJSONPolygon {
  // GeoJSON uses [lng, lat] order, opposite of Leaflet
  const coordinates = latlngs.map((point) => [point.lng, point.lat]);
  
  // Close the polygon by adding first point at the end if not already closed
  if (
    coordinates.length > 0 &&
    (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1])
  ) {
    coordinates.push(coordinates[0]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
}

/**
 * Convert GeoJSON Polygon to Leaflet LatLng array
 * @param polygon - GeoJSON Polygon
 * @returns Array of {lat, lng}
 */
export function geoJSONToLeaflet(
  polygon: GeoJSONPolygon
): Array<{ lat: number; lng: number }> {
  if (!polygon.coordinates || polygon.coordinates.length === 0) {
    return [];
  }

  const ring = polygon.coordinates[0];
  return ring.map((coord) => ({
    lat: coord[1],
    lng: coord[0]
  }));
}

/**
 * Calculate the center point of a polygon
 * @param polygon - GeoJSON Polygon
 * @returns Center coordinates
 */
export function getPolygonCenter(polygon: GeoJSONPolygon): Coordinates | null {
  if (!polygon.coordinates || polygon.coordinates.length === 0) {
    return null;
  }

  const ring = polygon.coordinates[0];
  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  for (const coord of ring) {
    lngSum += coord[0];
    latSum += coord[1];
    count++;
  }

  return {
    lat: latSum / count,
    lng: lngSum / count
  };
}

/**
 * Calculate the area of a polygon in square kilometers
 * @param polygon - GeoJSON Polygon
 * @returns Area in square kilometers
 */
export function calculatePolygonArea(polygon: GeoJSONPolygon): number {
  if (!polygon.coordinates || polygon.coordinates.length === 0) {
    return 0;
  }

  const ring = polygon.coordinates[0];
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    area += lng1 * lat2 - lng2 * lat1;
  }

  // Convert to square kilometers (approximate)
  const areaInDegrees = Math.abs(area) / 2;
  const areaInKm2 = areaInDegrees * 12321; // Approximate conversion factor
  
  return areaInKm2;
}