import { api } from '../lib/api';

// Station records as returned by the Go backend.
export interface Station {
  id: number;
  code: string;
  name: string;
  name_local: string | null;
  line_code: string;
  latitude: number;
  longitude: number;
}

export async function fetchStations(): Promise<Station[]> {
  const { data } = await api.get<Station[]>('/stations');
  return data ?? [];
}
