// Param lists for the three stacks. Keeps screen props strongly typed.

import type { Station } from '../services/stations';

export type AuthStackParamList = {
  Landing: undefined;
  SignUp: undefined;
  LogIn: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWalking: undefined;
  OnboardingBudget: { walking_limit_m: number };
};

// --- Main stack ------------------------------------------------------------
//
// The main product flow after login:
//
//   Home ────────────┐
//    │ (search / tap a station pin)
//    ▼                │
//   StationDetail ────┘ (pickMode = "start" | "destination")
//    │
//    ▼
//   Home (pickMode="destination")
//    │
//    ▼
//   StationDetail (sets destination)
//    │
//    ▼
//   TripConfirm  ── (optional) ──> AITripPlanner
//    │
//    ▼
//   Navigation (Mapbox — the ONLY place Mapbox is loaded)
//
// SaveTrip sits alongside as a "saved trips" tab.
export type PickMode = 'start' | 'destination';

export type MainStackParamList = {
  Home: { pickMode?: PickMode; start?: Station } | undefined;
  StationDetail: {
    station: Station;
    pickMode: PickMode;
    start?: Station;
  };
  TripConfirm: {
    start: Station;
    destination: Station;
  };
  Navigation: {
    start: Station;
    destination: Station;
  };
  AITripPlanner:
    | {
        start?: Station;
        destination?: Station;
        /** @deprecated — legacy parameter kept until all call sites migrate. */
        origin_station_code?: string;
      }
    | undefined;
  SaveTrip: undefined;
};
