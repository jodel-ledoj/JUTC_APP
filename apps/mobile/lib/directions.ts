const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export interface LatLng { latitude: number; longitude: number; }

// Decode Google Maps encoded polyline to coordinates
function decodePolyline(encoded: string): LatLng[] {
  const result: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result2 = 0;
    do { b = encoded.charCodeAt(index++) - 63; result2 |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result2 & 1) ? ~(result2 >> 1) : (result2 >> 1));
    lat += dlat;
    shift = 0; result2 = 0;
    do { b = encoded.charCodeAt(index++) - 63; result2 |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result2 & 1) ? ~(result2 >> 1) : (result2 >> 1));
    lng += dlng;
    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return result;
}

// Cache to avoid repeated API calls for same route
const routeCache = new Map<string, LatLng[]>();

export async function getDirectionsPolyline(
  origin: LatLng,
  destination: LatLng,
  waypoints?: LatLng[],
): Promise<LatLng[]> {
  const cacheKey = `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`;
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey)!;

  const wp = waypoints?.length
    ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}`
    : '';

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${wp}&mode=driving&key=${GOOGLE_MAPS_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.routes.length > 0) {
      const points = data.routes[0].overview_polyline.points;
      const decoded = decodePolyline(points);
      routeCache.set(cacheKey, decoded);
      return decoded;
    }
  } catch (_) {}

  // Fallback to straight-line coords if API fails
  const fallback = [origin, ...(waypoints ?? []), destination];
  return fallback;
}
