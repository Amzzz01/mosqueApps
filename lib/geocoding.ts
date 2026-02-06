import { Coordinates } from '@/types/kariah';

// Nominatim API (free, OpenStreetMap-based geocoding)
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

export interface GeocodingResult {
  success: boolean;
  coordinates: Coordinates | null;
  displayName?: string;
  error?: string;
}

/**
 * Geocode an address to coordinates using Nominatim API
 * @param address - Full address string
 * @returns Geocoding result with coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim().length < 5) {
    return {
      success: false,
      coordinates: null,
      error: 'Alamat terlalu pendek'
    };
  }

  try {
    // Add Malaysia to improve accuracy
    const searchQuery = `${address}, Malaysia`;
    
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '1',
      countrycodes: 'my', // Restrict to Malaysia
      addressdetails: '1'
    });

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        'User-Agent': 'MasjidAlFalahApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        success: false,
        coordinates: null,
        error: 'Alamat tidak dijumpai'
      };
    }

    const result = data[0];
    
    return {
      success: true,
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      },
      displayName: result.display_name
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      coordinates: null,
      error: 'Gagal mendapatkan koordinat alamat'
    };
  }
}

/**
 * Reverse geocode coordinates to address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1'
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'User-Agent': 'MasjidAlFalahApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data.display_name || null;

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Validate if coordinates are within Malaysia bounds
 * @param coordinates - Coordinates to validate
 * @returns True if within Malaysia
 */
export function isWithinMalaysia(coordinates: Coordinates): boolean {
  // Malaysia bounds (approximate)
  const MALAYSIA_BOUNDS = {
    north: 7.5,
    south: 0.8,
    east: 119.5,
    west: 99.5
  };

  return (
    coordinates.lat >= MALAYSIA_BOUNDS.south &&
    coordinates.lat <= MALAYSIA_BOUNDS.north &&
    coordinates.lng >= MALAYSIA_BOUNDS.west &&
    coordinates.lng <= MALAYSIA_BOUNDS.east
  );
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}