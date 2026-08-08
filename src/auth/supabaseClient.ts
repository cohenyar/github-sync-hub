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

// Preview-reliability pass: the dynamic import below is a real, separately
// fetched chunk — unlike a static import, it can fail transiently for
// reasons that have nothing to do with configuration (a cold CDN cache
// right after a fresh Preview deploy, a momentary network hiccup inside
// Lovable Preview's sandboxed iframe). A single bounded retry costs nothing
// on the success path and recovers the one-shot module load from exactly
// that kind of blip, instead of permanently degrading a correctly-configured
// build to guest mode for the rest of the session.
const CLOUD_CLIENT_LOAD_ATTEMPTS = 2
const CLOUD_CLIENT_RETRY_DELAY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Both parameters are injectable purely so a test can drive this
 * deterministically — every real caller uses the defaults (the true
 * env-derived isSupabaseConfigured, and a real dynamic import). A real
 * dynamic `import()` of the same specifier is effectively memoized within
 * one module graph, which would make a real retry unobservable from a
 * test; configured is injectable so a test isn't at the mercy of whatever
 * VITE_SUPABASE_* values happen to be set in the machine running it.
 */
export async function loadCloudClient(
  importClientModule: () => Promise<{ supabase: unknown }> = () => import('../integrations/supabase/client'),
  configured: boolean = isSupabaseConfigured,
): Promise<SupabaseClient | null> {
  if (!configured) {
    console.warn(
      '[meridian] Lovable Cloud env values (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are missing from this build — continuing in guest mode.',
    )
    return null
  }
  for (let attempt = 1; attempt <= CLOUD_CLIENT_LOAD_ATTEMPTS; attempt += 1) {
    try {
      const mod = await importClientModule()
      return mod.supabase as unknown as SupabaseClient
    } catch (error) {
      const isLastAttempt = attempt === CLOUD_CLIENT_LOAD_ATTEMPTS
      // Deliberately worded differently from the "missing" warning above —
      // this is the case the env vars ARE present but the client still
      // failed to load, a distinct condition that used to be
      // indistinguishable from "not configured" in both the console and
      // the UI.
      console.warn(
        `[meridian] Lovable Cloud env values are present, but the generated client failed to load ` +
          `(attempt ${attempt}/${CLOUD_CLIENT_LOAD_ATTEMPTS})` +
          (isLastAttempt ? ' — continuing in guest mode.' : ', retrying…'),
        error,
      )
      if (!isLastAttempt) await delay(CLOUD_CLIENT_RETRY_DELAY_MS)
    }
  }
  return null
}

export const supabase: SupabaseClient | null = await loadCloudClient()
