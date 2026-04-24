import { api } from '../lib/api';

// Matches the Go `POI` + `POIDetail` structs in backend/internal/poi/poi.go.
export interface POI {
  id: number;
  name: string;
  category: string;
  price_level?: number;
  distance?: number;
  lat?: number;
  lng?: number;
  rating?: number;
  image_url?: string;
}

interface NearbyInput {
  lat: number;
  lng: number;
  /** Search radius in meters; defaults to 500. */
  radius?: number;
  /** Optional category filter (e.g. "coffee", "shopping"). */
  category?: string;
}

// GET /pois?lat=…&lng=…&radius=… — returns { pois: POI[] }
// The Go handler returns an array under the `pois` key or a bare array
// depending on db state; we normalise both.
export async function fetchNearbyPois(input: NearbyInput): Promise<POI[]> {
  const params: Record<string, string | number> = {
    lat: input.lat,
    lng: input.lng,
    radius: input.radius ?? 500,
  };
  if (input.category) params.category = input.category;

  const { data } = await api.get('/pois', { params });
  if (Array.isArray(data)) return data as POI[];
  return (data?.pois as POI[]) ?? [];
}
