const QATAR_ZONES_QUERY = 'https://services.gisqatar.org.qa/server/rest/services/Vector/Zones/FeatureServer/0/query';

/** Resolve an official Qatar administrative zone from a WGS84 map point. */
export async function resolveQatarDeliveryZone(latitude: number, longitude: number): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 24 || latitude > 27 || longitude < 50 || longitude > 52) {
    return null;
  }

  const params = new URLSearchParams({
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'ZONE_NO',
    returnGeometry: 'false',
    f: 'json',
  });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${QATAR_ZONES_QUERY}?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Qatar zone lookup failed (${response.status}).`);
    const result = await response.json() as { error?: { message?: string }; features?: Array<{ attributes?: { ZONE_NO?: number | string } }> };
    if (result.error) throw new Error(result.error.message || 'Qatar zone lookup failed.');
    const zoneNumber = result.features?.[0]?.attributes?.ZONE_NO;
    return zoneNumber == null ? null : String(zoneNumber);
  } finally {
    window.clearTimeout(timeout);
  }
}
