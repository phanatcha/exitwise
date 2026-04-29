import AsyncStorage from '@react-native-async-storage/async-storage';

// We persist onboarding preferences locally so the user can breeze through
// Q1 → Q2 without needing the Go backend online. Once the backend is wired up
// we'll also PATCH them to /me, but the local copy is the source of truth for
// the device.

const KEY_WALKING_LIMIT = (uid: string) => `@exitwise/walking_limit_m_${uid}`;
const KEY_BUDGET        = (uid: string) => `@exitwise/budget_baht_${uid}`;
const KEY_TRAVEL_MODE   = (uid: string) => `@exitwise/travel_mode_${uid}`;
const KEY_DONE          = (uid: string) => `@exitwise/onboarding_completed_${uid}`;

// Matches the Python AI microservice strategies (see ai_service/main.py):
//   - 'lazy'     → shortest walk, single great POI
//   - 'explorer' → 2-3 stop walking tour
export type TravelModePref = 'lazy' | 'explorer';


export async function saveWalkingLimit(userId: string, meters: number) {
  await AsyncStorage.setItem(KEY_WALKING_LIMIT(userId), String(meters));
}

export async function saveBudget(userId: string, baht: number) {
  await AsyncStorage.setItem(KEY_BUDGET(userId), String(baht));
}

export async function saveTravelMode(userId: string, mode: TravelModePref) {
  await AsyncStorage.setItem(KEY_TRAVEL_MODE(userId), mode);
}

export async function markOnboardingDone(userId: string) {
  await AsyncStorage.setItem(KEY_DONE(userId), '1');
}

export async function getOnboarding(userId: string): Promise<{
  walking_limit_m: number | null;
  budget_baht: number | null;
  travel_mode: TravelModePref;
  completed: boolean;
}> {
  const [w, b, mode, done] = await Promise.all([
    AsyncStorage.getItem(KEY_WALKING_LIMIT(userId)),
    AsyncStorage.getItem(KEY_BUDGET(userId)),
    AsyncStorage.getItem(KEY_TRAVEL_MODE(userId)),
    AsyncStorage.getItem(KEY_DONE(userId)),
  ]);
  return {
    walking_limit_m: w ? Number(w) : null,
    budget_baht: b ? Number(b) : null,
    // Default to 'explorer' — most users want the multi-POI tour.
    travel_mode: (mode === 'lazy' ? 'lazy' : 'explorer') as TravelModePref,
    completed: done === '1',
  };
}

export async function resetOnboarding(userId: string) {
  await AsyncStorage.multiRemove([
     KEY_WALKING_LIMIT(userId),
    KEY_BUDGET(userId),
    KEY_TRAVEL_MODE(userId),
    KEY_DONE(userId),
  ]);
}
