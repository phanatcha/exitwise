import { api } from '../lib/api';

// Input the AI planner expects. Matches the shape the Python service returns
// the Go backend passes through.
export interface PlannerInput {
  origin_station_code: string;
  walking_limit_m: number;
  budget_baht: number;
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
}

export async function generateItinerary(
  input: PlannerInput,
): Promise<PlannerResult> {
  const { data } = await api.post<PlannerResult>('/generate-itinerary', input);
  return data;
}
