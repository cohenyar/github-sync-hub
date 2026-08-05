import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Lovable Cloud auth pass — Lovable Cloud is the only auth backend for
 * Meridian. It provisions and manages a real Supabase project and exposes
 * it to this app via VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY (see
 * the auto-generated src/integrations/supabase/client.ts — the same
 * project, Lovable's own generated client for it).
 *
 * This file is deliberately the ONLY place the app actually constructs a
 * Supabase client from, rather than importing that generated client
 * directly, for one concrete reason: it throws synchronously at module
 * load if either env var is missing ("Missing VITE_SUPABASE_URL or
 * VITE_SUPABASE_PUBLISHABLE_KEY..."). Every consumer in src/auth checks
 * `isSupabaseConfigured` and degrades to guest mode when it's false — a
 * real, common state (no .env.local in this environment, most local dev,
 * most test runs) — so a direct import would crash the entire app in
 * exactly the case this module exists to handle gracefully. Nothing here
 * is a second backend or a second set of credentials; it's the same
 * Lovable Cloud project, read the way this app's existing (already built,
 * already tested) auth system needs it read. VITE_SUPABASE_ANON_KEY is
 * accepted as a fallback name for a non-Lovable Supabase deployment.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey: string | undefined =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

/**
 * Supabase's newer API keys (sb_publishable_.../sb_secret_...) are opaque
 * strings, not bearer JWTs — a wrongly-attached `Authorization: Bearer
 * <key>` header breaks requests using them. Ported from Lovable's own
 * generated client (src/integrations/supabase/client.ts) so a Lovable
 * Cloud project's new-format keys behave identically here, without
 * importing that throwing module directly (see the file doc comment
 * above).
 */
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_')
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    )
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization')
    }
    headers.set('apikey', supabaseKey)
    return fetch(input, { ...init, headers })
  }
}

// Deliberately untyped (not SupabaseClient<Database>): Lovable's generated
// Database type (src/integrations/supabase/types.ts) currently reflects an
// empty schema — the `profiles` table this app's role lookup already
// queries (see supabase/migrations/0001_profiles.sql, AuthProvider.tsx's
// fetchRole) hasn't been created in the Lovable Cloud project's database
// yet (a manual action — see the checkpoint report). Typing against that
// empty schema would fail `.from('profiles')` at compile time for a table
// that's meant to exist; this stays untyped until the migration is applied
// and the generated type reflects it.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string, {
      global: { fetch: createSupabaseFetch(supabasePublishableKey as string) },
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
