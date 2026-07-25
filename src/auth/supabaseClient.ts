import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * False whenever the env vars aren't set (no Supabase project configured
 * yet, or a test/CI run with no .env.local). Every auth-facing consumer
 * checks this instead of assuming `supabase` is non-null, so a missing
 * configuration degrades to guest mode rather than crashing the app.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null
