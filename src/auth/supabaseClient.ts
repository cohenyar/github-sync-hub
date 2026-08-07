/**
 * Single source of truth for the Supabase client.
 *
 * The client itself is the Lovable Cloud generated one
 * (src/integrations/supabase/client.ts) — this module only re-exports it so
 * every existing auth consumer (AuthProvider, tests that mock
 * './supabaseClient') keeps its import path. There is exactly ONE Supabase
 * client instance in the app; never call createClient anywhere else.
 *
 * Startup safety: the generated client THROWS at module-evaluation time when
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are absent from the build.
 * A static import would therefore take the whole app down before React mounts
 * (boot splash stuck at `html-parsed`). We must not edit the generated file,
 * so instead we import it lazily and only when the env values are actually
 * present, and we swallow any import failure. Missing Cloud config now
 * degrades to `supabase === null`, which the auth layer already handles as a
 * signed-out / guest-capable state.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * True when Lovable Cloud env values reached this build. When false, the whole
 * auth surface degrades to guest mode (and tests mock this module).
 */
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

async function loadCloudClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) {
    console.warn(
      '[meridian] Lovable Cloud env values are missing from this build — continuing in guest mode.',
    )
    return null
  }
  try {
    const mod = await import('../integrations/supabase/client')
    return mod.supabase as unknown as SupabaseClient
  } catch (error) {
    console.warn('[meridian] Lovable Cloud client failed to initialise — continuing in guest mode.', error)
    return null
  }
}

export const supabase: SupabaseClient | null = await loadCloudClient()
