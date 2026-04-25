import axios from 'axios';
import { supabase } from './supabase';

// Axios client for the Go backend. Injects the current Supabase JWT as
// `Authorization: Bearer <token>` so the Go handlers can verify it against
// the Supabase JWKS and extract auth.uid() for row-level queries.

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Light logger for 4xx/5xx — keeps debugging on device painless.
//
// We deliberately do NOT auto-signOut on 401s. The Go backend currently
// rejects any bearer it doesn't recognise, including valid Supabase JWTs
// while the backend is still being migrated to verify them. Bouncing the
// user back to Landing on every request there would make the app unusable.
// When the backend's Supabase verification lands, revisit this.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ExitWise API]',
        err?.config?.method?.toUpperCase(),
        err?.config?.url,
        err?.response?.status,
        err?.response?.data ?? err?.message,
      );
    }
    return Promise.reject(err);
  },
);
