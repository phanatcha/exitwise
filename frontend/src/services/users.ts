import { api } from '../lib/api';

// User profile (public.users row, keyed by auth.users.id).
export interface UserProfile {
  id: string;
  display_name: string;
  walking_limit_m: number | null;
  budget_baht: number | null;
  onboarding_completed: boolean;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/me');
  return data;
}

export async function updatePreferences(input: {
  walking_limit_m?: number;
  budget_baht?: number;
  onboarding_completed?: boolean;
}): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/me', input);
  return data;
}
