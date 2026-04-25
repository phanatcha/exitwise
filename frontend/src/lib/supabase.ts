import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// These come from EXPO_PUBLIC_* so they're inlined in the JS bundle. That's
// safe here: the anon / publishable key is designed to be shipped publicly,
// and all row-level access is gated by Postgres RLS policies that check
// auth.uid() against user_id on every row.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loudly in dev so we don't silently ship a client that can't talk
  // to Supabase. These must be set in frontend/.env before starting Metro.
  console.warn(
    '[ExitWise] Supabase env vars missing. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.',
  );
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    // Persist the session so users don't have to log in every time they
    // re-open the app. AsyncStorage is the RN-idiomatic backing store.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl only matters on web (magic-link redirects). On RN
    // we handle deep links manually if/when we add them, so turn it off.
    detectSessionInUrl: false,
  },
});
