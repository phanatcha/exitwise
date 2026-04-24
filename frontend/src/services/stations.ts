import { api } from '../lib/api';

// Station records as consumed by the frontend. Normalised from the two
// shapes the Go handler currently emits:
//
//   new:  { id, code, name, name_local, line_code, latitude, longitude }
//   old:  { stations: [ { id, name_en, name_th, line, lat, lng } ] }
//
// Keeping both mappings here means adding the new columns in Postgres is a
// server-only change — the frontend already understands it.
export interface Station {
  id: number;
  code: string;
  name: string;
  name_local: string | null;
  line_code: string;
  latitude: number;
  longitude: number;
}

function toStation(raw: any): Station {
  const name = raw?.name ?? raw?.name_en ?? raw?.name_english ?? '';
  const line = (raw?.line_code ?? raw?.line ?? '').toString();
  const lineUpper = line.toUpperCase();

  // Synthesize a stable `code` when the backend only gave us `line + name`.
  // Matches the planner's expected format (`BL-Ari`, `BL-Asok`…).
  const code =
    raw?.code ??
    (lineUpper
      ? `${prefixForLine(lineUpper)}-${name.replace(/\s+/g, '')}`
      : name.replace(/\s+/g, ''));

  return {
    id: Number(raw?.id ?? 0),
    code,
    name,
    name_local: raw?.name_local ?? raw?.name_th ?? null,
    line_code: lineUpper || 'UNKNOWN',
    latitude: Number(raw?.latitude ?? raw?.lat ?? 0),
    longitude: Number(raw?.longitude ?? raw?.lng ?? 0),
  };
}

function prefixForLine(line: string): string {
  if (line.includes('BLUE')) return 'BL';
  if (line.includes('SUKHUMVIT')) return 'BTS-S';
  if (line.includes('SILOM')) return 'BTS-L';
  if (line.includes('PURPLE')) return 'PP';
  if (line.includes('AIRPORT')) return 'ARL';
  return line.slice(0, 3);
}

export async function fetchStations(): Promise<Station[]> {
  const { data } = await api.get('/stations');
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.stations)
    ? data.stations
    : [];
  return list.map(toStation);
}
