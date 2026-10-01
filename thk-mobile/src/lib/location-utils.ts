import { resolveQatarDeliveryZone } from './delivery-zone';

export interface ParsedLocation {
  latitude: number | null;
  longitude: number | null;
  zone: string | null;
  googleMapsUrl: string;
  isValid: boolean;
}

/**
 * Safely parses Google Maps URLs, short links, or raw coordinate strings
 * without throwing errors or crashing.
 */
export async function parseGoogleMapsUrl(input: string): Promise<ParsedLocation> {
  const text = String(input || '').trim();

  if (!text) {
    return {
      latitude: null,
      longitude: null,
      zone: null,
      googleMapsUrl: '',
      isValid: false,
    };
  }

  // Common Google Maps coordinate patterns
  const patterns = [
    //@25.285432,51.531012
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    //?q=25.285432,51.531012 or &query=25.285432,51.531012 or &ll=...
    /[?&](?:q|query|ll|location)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    //!3d25.285432!4d51.531012 (Google Maps Embed/Place URLs)
    /!3d(-?\d+(?:\.\d+)?)[^\d!]*!4d(-?\d+(?:\.\d+)?)/,
    //25.285432, 51.531012 (Direct lat, lng coordinate text)
    /(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/,
  ];

  let lat: number | null = null;
  let lng: number | null = null;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const parsedLat = parseFloat(match[1]);
      const parsedLng = parseFloat(match[2]);

      if (
        Number.isFinite(parsedLat) &&
        Number.isFinite(parsedLng) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLng >= -180 &&
        parsedLng <= 180
      ) {
        lat = parsedLat;
        lng = parsedLng;
        break;
      }
    }
  }

  if (lat !== null && lng !== null) {
    let zone: string | null = null;
    try {
      zone = await resolveQatarDeliveryZone(lat, lng);
    } catch {
      zone = null;
    }

    const formattedUrl = text.startsWith('http')
      ? text
      : `https://www.google.com/maps?q=${lat},${lng}`;

    return {
      latitude: lat,
      longitude: lng,
      zone,
      googleMapsUrl: formattedUrl,
      isValid: true,
    };
  }

  return {
    latitude: null,
    longitude: null,
    zone: null,
    googleMapsUrl: text,
    isValid: false,
  };
}

/**
 * Builds a valid Google Maps directions/location link.
 */
export function getGoogleMapsLink(
  latitude?: number | null,
  longitude?: number | null,
  fallbackSearch?: string
): string {
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  if (fallbackSearch) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fallbackSearch
    )}`;
  }

  return 'https://www.google.com/maps';
}
