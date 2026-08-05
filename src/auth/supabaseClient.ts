/**
 * Single source of truth for the Supabase client.
 *
 * The client itself is the Lovable Cloud generated one
 * (src/integrations/supabase/client.ts) — this module only re-exports it so
 * every existing auth consumer (AuthProvider, tests that mock
 * './supabaseClient') keeps its import path. There is exactly ONE Supabase
 * client instance in the app; never call createClient anywhere else.
 *
 * Note: the generated client throws synchronously at import time if either
 * env var is missing, so importing this module (even just to read
 * isSupabaseConfigured) requires a real or placeholder .env — see .env.example.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as cloudClient } from '../integrations/supabase/client'

/**
 * Lovable Cloud is always provisioned for this project, so this is true in
 * every real run. It is kept because the whole auth surface degrades to
 * guest mode when it is false (and tests mock this module).
 */
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export const supabase: SupabaseClient | null = isSupabaseConfigured ? (cloudClient as unknown as SupabaseClient) : null
