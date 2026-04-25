import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip } from '../services/trips';

// Local trip store.
//
// The Go backend currently only exposes GET/DELETE /trips — there's no
// POST handler yet — so saving a plan always failed silently and the user
// never saw their trip appear on SaveTripScreen. Until the backend gets a
// proper POST /trips (+ Supabase JWT verification), we persist saved plans
// locally so the UX stays intact. When the backend catches up we'll merge
// these with remote trips and migrate on first login.

const KEY = '@exitwise/local_trips';

export interface LocalTripStop {
  name: string;
  order_index: number;
  note?: string;
}

export interface LocalTrip extends Trip {
  local: true;
  stops: LocalTripStop[];
}

export async function getLocalTrips(): Promise<LocalTrip[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLocalTrip(trip: Omit<LocalTrip, 'local'>): Promise<LocalTrip> {
  const trips = await getLocalTrips();
  const next: LocalTrip = { ...trip, local: true };
  // Newest first — matches user expectation after tapping "Save Plan".
  trips.unshift(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(trips));
  return next;
}

export async function deleteLocalTrip(id: string): Promise<void> {
  const trips = await getLocalTrips();
  const next = trips.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearLocalTrips(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
