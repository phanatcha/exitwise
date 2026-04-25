import AsyncStorage from '@react-native-async-storage/async-storage';

// We persist onboarding preferences locally so the user can breeze through
// Q1 → Q2 without needing the Go backend online. Once the backend is wired up
// we'll also PATCH them to /me, but the local copy is the source of truth for
// the device.

const KEY_WALKING_LIMIT = '@exitwise/walking_limit_m';
const KEY_BUDGET = '@exitwise/budget_baht';
const KEY_TRAVEL_MODE = '@exitwise/travel_mode';
const KEY_DONE = '@exitwise/onboarding_completed';

// Matches the Python AI microservice strategies (see ai_service/main.py):
//   - 'lazy'     → shortest walk, single great POI
//   - 'explorer' → 2-3 stop walking tour
export type TravelModePref = 'lazy' | 'explorer';

export async function saveWalkingLimit(meters: number) {
  await AsyncStorage.setItem(KEY_WALKING_LIMIT, String(meters));
}

export async function saveBudget(baht: number) {
  await AsyncStorage.setItem(KEY_BUDGET, String(baht));
}

export async function saveTravelMode(mode: TravelModePref) {
  await AsyncStorage.setItem(KEY_TRAVEL_MODE, mode);
}

export async function markOnboardingDone() {
  await AsyncStorage.setItem(KEY_DONE, '1');
}

export async function getOnboarding(): Promise<{
  walking_limit_m: number | null;
  budget_baht: number | null;
  travel_mode: TravelModePref;
  completed: boolean;
}> {
  const [w, b, mode, done] = await Promise.all([
    AsyncStorage.getItem(KEY_WALKING_LIMIT),
    AsyncStorage.getItem(KEY_BUDGET),
    AsyncStorage.getItem(KEY_TRAVEL_MODE),
    AsyncStorage.getItem(KEY_DONE),
  ]);
  return {
    walking_limit_m: w ? Number(w) : null,
    budget_baht: b ? Number(b) : null,
    // Default to 'explorer' — most users want the multi-POI tour.
    travel_mode: (mode === 'lazy' ? 'lazy' : 'explorer') as TravelModePref,
    completed: done === '1',
  };
}

export async function resetOnboarding() {
  await AsyncStorage.multiRemove([
    KEY_WALKING_LIMIT,
    KEY_BUDGET,
    KEY_TRAVEL_MODE,
    KEY_DONE,
  ]);
}
