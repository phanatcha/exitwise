// Param lists for the three stacks. Keeps screen props strongly typed.

export type AuthStackParamList = {
  Landing: undefined;
  SignUp: undefined;
  LogIn: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWalking: undefined;
  OnboardingBudget: { walking_limit_m: number };
};

export type MainStackParamList = {
  Home: undefined;
  AITripPlanner: { origin_station_code?: string } | undefined;
  SaveTrip: undefined;
};
