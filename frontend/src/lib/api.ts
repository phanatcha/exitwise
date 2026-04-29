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
  // refreshSession() บังคับดึง token ใหม่เสมอถ้า expired
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  // ถ้า token ใกล้หมดอายุ ให้ refresh ก่อน
  if (session) {
    const expiresAt = session.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);
    const shouldRefresh = expiresAt - now < 60; // refresh ถ้าเหลือน้อยกว่า 60 วิ

    if (shouldRefresh) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const token = refreshed.session?.access_token;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    }
    console.log('[ExitWise] session:', session ? 'exists' : 'null');
    console.log('[ExitWise] token:', session?.access_token?.slice(0, 20) + '...');
    console.log('[ExitWise] expires_at:', session?.expires_at);
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
      console.warn(
        '[ExitWise API]',
        err?.config?.method?.toUpperCase(),
        err?.config?.url,
        err?.response?.status,
        err?.response?.data ?? err?.message,
      );
    }

    // retry ครั้งเดียวถ้าได้ 401 โดย force refresh token ก่อน
    if (err?.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const { data } = await supabase.auth.refreshSession();
      const token = data.session?.access_token;
      if (token) {
        err.config.headers.Authorization = `Bearer ${token}`;
        return api(err.config);
      }
    }

    return Promise.reject(err);
  },
);
