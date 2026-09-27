/**
 * Shared Supabase client. Set EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in `.env.local` to use it; without
 * them `supabase` is null and screens run on their in-memory demo data.
 * No login yet, so sessions aren't stored.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

/**
 * A realtime channel name no other subscriber shares. `supabase.channel(name)`
 * hands back an existing channel with the same name, so a screen that
 * remounts before the old channel closes (or two screens watching the same
 * farm) would add listeners to an already-subscribed channel, which throws.
 */
export const uniqueChannel = (name: string) => `${name}-${Math.random().toString(36).slice(2, 10)}`;
