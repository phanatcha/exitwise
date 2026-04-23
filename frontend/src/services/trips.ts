import { api } from '../lib/api';

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

export async function listTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/trips');
  return data ?? [];
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', input);
  return data;
}
