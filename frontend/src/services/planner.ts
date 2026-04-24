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
export interface PlannerInput {
  start_station_id: number;
  end_station_id: number;
  budget: number;
  max_walking_distance: number;
  travel_mode: 'walking' | 'transit';
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

// The AI service isn't guaranteed to return the exact shape we want — it's
// Gemini output. Normalise common field names so the UI can rely on one schema.
function normalise(raw: any): PlannerResult {
  const totalDistance =
    raw?.total_distance_m ??
    raw?.total_distance ??
    raw?.distance_m ??
    raw?.distance ??
    0;

  const estimatedMin =
    raw?.estimated_duration_min ??
    raw?.duration_min ??
    (raw?.duration_seconds
      ? Math.round(raw.duration_seconds / 60)
      : raw?.estimated_duration_seconds
      ? Math.round(raw.estimated_duration_seconds / 60)
      : 0);

  const rawStops: any[] =
    raw?.stops ?? raw?.itinerary ?? raw?.places ?? [];

  const stops: PlannerStop[] = rawStops.map((s: any, i: number) => ({
    name: s?.name ?? s?.title ?? `Stop ${i + 1}`,
    distance_m: s?.distance_m ?? s?.distance ?? 0,
    kind: (s?.kind ?? s?.category ?? 'poi') as PlannerStop['kind'],
    note: s?.note ?? s?.description,
  }));

  return {
    total_distance_m: totalDistance,
    estimated_duration_min: estimatedMin,
    stops,
    recommended_exit:
      raw?.recommended_exit ?? raw?.optimal_exit ?? undefined,
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
