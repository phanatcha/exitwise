import { api } from '../lib/api';

// Wire-format to the Go backend's /generate-itinerary handler, which proxies
// to the Python/Gemini AI microservice (see backend/internal/planner/planner.go).
//
//   POST /generate-itinerary
//   {
//     user_id: int,
//     start_station_id: int,
//     end_station_id: int,
//     budget: int,
//     max_walking_distance: int,
//     travel_mode: "walking" | "transit"
//   }
// travel_mode is consumed by the Python microservice to pick a planning
// strategy against Gemini:
//   - 'lazy'     → shortest walk, one great POI
//   - 'explorer' → 2-3 stop walking tour (eat → shop → sight)
//   - 'walking' / 'transit' are legacy aliases; the backend treats anything
//     that isn't literally "explorer" as lazy.
export type TravelMode = 'walking' | 'transit' | 'lazy' | 'explorer';

export interface PlannerInput {
  start_station_id: number;
  end_station_id: number;
  budget: number;
  max_walking_distance: number;
  travel_mode: TravelMode;
  user_id?: number;
  interests?: string[];
}

export interface PlannerStop {
  name: string;
  distance_m: number;
  kind: 'exit' | 'poi' | 'food' | 'landmark';
  note?: string;
}

export interface PlannerResult {
  total_distance_m: number;
  estimated_duration_min: number;
  stops: PlannerStop[];

  // Extras the Gemini-backed microservice returns. These render nicely on
  // TripConfirm (ETA / Budget / Best exit) when present.
  recommended_exit?: string;
  estimated_total_cost?: number;
  narrative?: string;
}

// Map a Gemini POI category to one of our stop icon kinds.
function classify(category?: string): PlannerStop['kind'] {
  if (!category) return 'poi';
  const c = category.toLowerCase();
  if (
    c.includes('food') ||
    c.includes('restaurant') ||
    c.includes('cafe') ||
    c.includes('coffee') ||
    c.includes('dessert') ||
    c.includes('street')
  ) {
    return 'food';
  }
  if (
    c.includes('shop') ||
    c.includes('mall') ||
    c.includes('market') ||
    c.includes('store')
  ) {
    return 'landmark';
  }
  if (c.includes('landmark') || c.includes('temple') || c.includes('park')) {
    return 'landmark';
  }
  return 'poi';
}

// The AI service isn't guaranteed to return the exact shape we want — it's
// Gemini output. Normalise common field names so the UI can rely on one schema.
//
// The Python microservice currently returns a TripResponse-shaped payload:
//   {
//     recommended_exit: "Exit 2",
//     route_steps: [{ instructions, distance, duration }],
//     suggested_pois: [{ id, name, category, price_level, location }],
//     estimated_total_cost: 250
//   }
// We translate that into our flatter `stops` list so the UI can render a
// single scrollable itinerary (exit → POI → POI → …).
function normalise(raw: any): PlannerResult {
  const routeSteps: any[] = Array.isArray(raw?.route_steps)
    ? raw.route_steps
    : [];
  const sumDistance = routeSteps.reduce(
    (acc, s) => acc + (Number(s?.distance) || 0),
    0,
  );
  const sumDurationSec = routeSteps.reduce(
    (acc, s) => acc + (Number(s?.duration) || 0),
    0,
  );

  const totalDistance =
    raw?.total_distance_m ??
    raw?.total_distance ??
    raw?.distance_m ??
    raw?.distance ??
    (sumDistance > 0 ? sumDistance : 0);

  const estimatedMin =
    raw?.estimated_duration_min ??
    raw?.duration_min ??
    (raw?.duration_seconds
      ? Math.round(raw.duration_seconds / 60)
      : raw?.estimated_duration_seconds
      ? Math.round(raw.estimated_duration_seconds / 60)
      : sumDurationSec > 0
      ? Math.round(sumDurationSec / 60)
      : 0);

  // Collect stops from whichever field Gemini actually filled in.
  const flatStops: any[] =
    raw?.stops ?? raw?.itinerary ?? raw?.places ?? [];
  const suggestedPois: any[] = Array.isArray(raw?.suggested_pois)
    ? raw.suggested_pois
    : [];

  const stops: PlannerStop[] = [];

  // Synthetic first stop: the exit Gemini picked, if any. Gives the user
  // context on *where* to come out of the station before walking.
  const exit = raw?.recommended_exit ?? raw?.optimal_exit;
  if (exit) {
    const firstStep = routeSteps[0];
    stops.push({
      name: String(exit).startsWith('Exit') ? exit : `Exit ${exit}`,
      distance_m: 0,
      kind: 'exit',
      note: firstStep?.instructions ?? undefined,
    });
  }

  // The real POIs. Gemini only returns ONE when travel_mode is lazy; this is
  // exactly why AITripPlanner now sends 'explorer' for multi-stop tours.
  //
  // The Python microservice recomputes route_steps from coordinates so we
  // get one step per POI with an accurate per-segment distance in meters.
  // We intentionally DON'T fall back to routeSteps[0] here — doing so used
  // to cause every stop in an explorer itinerary to share the first step's
  // distance (e.g. "200 m" on all three stops).
  suggestedPois.forEach((p: any, i: number) => {
    const matchingStep = routeSteps[i];
    stops.push({
      name: p?.name ?? `Stop ${i + 1}`,
      distance_m: Number(matchingStep?.distance) || 0,
      kind: classify(p?.category),
      note:
        p?.description ||
        (p?.category ? p.category.replace(/_/g, ' ') : undefined),
    });
  });

  // Legacy/alternative shape: a pre-flattened stops array.
  flatStops.forEach((s: any, i: number) => {
    stops.push({
      name: s?.name ?? s?.title ?? `Stop ${i + 1}`,
      distance_m: s?.distance_m ?? s?.distance ?? 0,
      kind: (s?.kind ?? classify(s?.category)) as PlannerStop['kind'],
      note: s?.note ?? s?.description,
    });
  });

  return {
    total_distance_m: totalDistance,
    estimated_duration_min: estimatedMin,
    stops,
    recommended_exit: exit ?? undefined,
    estimated_total_cost:
      raw?.estimated_total_cost ?? raw?.total_cost ?? undefined,
    narrative: raw?.narrative ?? raw?.summary ?? undefined,
  };
}

export async function generateItinerary(
  input: PlannerInput,
): Promise<PlannerResult> {
  const { data } = await api.post<any>('/generate-itinerary', input);
  return normalise(data);
}
