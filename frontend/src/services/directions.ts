// Wrapper around the Go backend's /directions endpoint plus a local fallback
// that hits Mapbox Directions directly with the public pk token. We prefer the
// backend because it also returns the optimal station exit; if the backend
// errors out we still get a drawable line from Mapbox.

import { api } from '../lib/api';

export interface BackendDirections {
  distance_meters: number;
  duration_seconds: number;
  optimal_exit?: {
    id: number;
    station_id: number;
    exit_number: string;
    description?: string;
    latitude: number;
    longitude: number;
  } | null;
  exit_instruction?: string;
}

export interface RouteGeometry {
  /** GeoJSON LineString ([lng, lat] pairs). */
  coordinates: [number, number][];
  distance_m: number;
  duration_s: number;
}

interface Coord {
  latitude: number;
  longitude: number;
}

export async function getBackendDirections(
  from: Coord,
  to: Coord,
): Promise<BackendDirections | null> {
  try {
    const { data } = await api.get<BackendDirections>('/directions', {
      params: {
        from_lat: from.latitude,
        from_lng: from.longitude,
        to_lat: to.latitude,
        to_lng: to.longitude,
      },
    });
    return data;
  } catch {
    return null;
  }
}

// Hits Mapbox Directions API directly for the polyline geometry. The backend's
// /directions response only carries distance+duration, so we still need Mapbox
// to draw the route shape on the MapView.
export async function getMapboxRouteGeometry(
  from: Coord,
  to: Coord,
): Promise<RouteGeometry | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance_m: route.distance ?? 0,
      duration_s: route.duration ?? 0,
    };
  } catch {
    return null;
  }
}
