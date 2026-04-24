import { api } from '../lib/api';
import {
  getLocalTrips,
  saveLocalTrip,
  deleteLocalTrip,
} from '../lib/localTrips';

// A saved trip with denormalized stop count + aggregate preview.
export interface Trip {
  id: string;
  title: string;
  walking_limit_m: number;
  budget_baht: number | null;
  cover_image_url: string | null;
  created_at: string;
  stop_count?: number;
}

export interface CreateTripInput {
  title: string;
  walking_limit_m: number;
  budget_baht: number | null;
  stops?: Array<{
    station_code?: string;
    name: string;
    order_index: number;
    note?: string;
  }>;
}

// Try the backend first, fall back to whatever we have locally. The Go
// backend's /trips currently 401s for Supabase JWTs (no POST route yet, and
// GET requires a verified user_id), so this local store is the source of
// truth for the device until the backend catches up.
export async function listTrips(): Promise<Trip[]> {
  const local = await getLocalTrips();
  try {
    const { data } = await api.get<Trip[]>('/trips');
    const remote = Array.isArray(data) ? data : [];
    // Dedup by id. Local-first so "just saved" always wins the position.
    const seen = new Set(local.map((t) => t.id));
    return [...local, ...remote.filter((t) => !seen.has(t.id))];
  } catch {
    return local;
  }
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  // Fire-and-forget the backend POST. If/when the backend gets a proper
  // POST /trips route + Supabase JWT auth, this will start succeeding —
  // until then we just ignore the error and commit locally.
  let remote: Trip | null = null;
  try {
    const { data } = await api.post<Trip>('/trips', input);
    if (data?.id) remote = data;
  } catch {
    // swallow — local save below is the real source of truth for MVP.
  }

  const base: Trip = remote ?? {
    id: `local-${Date.now()}`,
    title: input.title,
    walking_limit_m: input.walking_limit_m,
    budget_baht: input.budget_baht,
    cover_image_url: null,
    created_at: new Date().toISOString(),
    stop_count: input.stops?.length ?? 0,
  };

  await saveLocalTrip({
    ...base,
    stops:
      input.stops?.map((s) => ({
        name: s.name,
        order_index: s.order_index,
        note: s.note,
      })) ?? [],
  });

  return base;
}

export async function removeTrip(id: string): Promise<void> {
  await deleteLocalTrip(id);
  try {
    await api.delete(`/trips?id=${encodeURIComponent(id)}`);
  } catch {
    // best effort
  }
}
