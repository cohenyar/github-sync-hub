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
 * Playtest diagnosis pass — classifies a caught import failure from
 * observable error characteristics only (name/message), never an
 * assumption. Never touches the generated file — pure inference from the
 * outside, using facts every major browser engine already puts in these
 * specific error messages, plus the generated file's own fixed, unchanged
 * guard text.
 *
 * - 'chunk-fetch-failed': the browser's own dynamic-import fetch failed
 *   (network/CDN/CSP) — Chromium/Firefox/WebKit all name the failed
 *   chunk's URL in this exact message shape, extracted below. The
 *   generated module's own top-level code never started executing.
 * - 'generated-module-env-guard': the generated file's own throw fired,
 *   verbatim (see src/integrations/supabase/client.ts, unedited) — proof
 *   the module DID start evaluating, and ITS OWN import.meta.env lookup
 *   was falsy at that moment — even if isSupabaseConfigured (computed the
 *   same way, in this file) said otherwise. A genuine, reportable
 *   divergence if it ever appears.
 * - 'other': neither of the above — the module was reached and evaluation
 *   proceeded past its own env guard. The generated file's only remaining
 *   throw-capable statement after that guard is the createClient(...)
 *   call itself, so this stage very likely means createClient() was
 *   reached and threw — reported as "likely," since we don't instrument
 *   the generated file to confirm it directly.
 */
type CloudClientFailureStage = 'chunk-fetch-failed' | 'generated-module-env-guard' | 'other'

function classifyCloudClientFailure(error: unknown): { stage: CloudClientFailureStage; chunkUrl: string | null } {
  const message = error instanceof Error ? error.message : String(error)
  const fetchFailureMatch = message.match(
    /(?:Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed)[:\s]*(\S+)/i,
  )
  if (fetchFailureMatch) {
    return { stage: 'chunk-fetch-failed', chunkUrl: fetchFailureMatch[1] ?? null }
  }
  if (message.includes('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')) {
    return { stage: 'generated-module-env-guard', chunkUrl: null }
  }
  return { stage: 'other', chunkUrl: null }
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
  // Playtest diagnosis pass — logged unconditionally, success or failure,
  // so the exact failure stage is visible in Preview's own devtools console
  // without needing the 8s boot-stall fallback UI (this path resolves fast;
  // the app boots normally either way today). Presence only, never values.
  console.info('[meridian][auth-diagnostic] Cloud client load starting', {
    isSupabaseConfigured: configured,
    urlPresent: Boolean(import.meta.env.VITE_SUPABASE_URL),
    keyPresent: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  })

  if (!configured) {
    console.warn(
      '[meridian] Lovable Cloud env values (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are missing from this build — continuing in guest mode.',
    )
    return null
  }
  for (let attempt = 1; attempt <= CLOUD_CLIENT_LOAD_ATTEMPTS; attempt += 1) {
    try {
      const mod = await importClientModule()
      console.info('[meridian][auth-diagnostic] Cloud client import succeeded', {
        attempt,
        hasClient: Boolean((mod as { supabase?: unknown } | undefined)?.supabase),
      })
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
      const { stage, chunkUrl } = classifyCloudClientFailure(error)
      console.warn('[meridian][auth-diagnostic] Cloud client import failed', {
        attempt,
        totalAttempts: CLOUD_CLIENT_LOAD_ATTEMPTS,
        stage,
        chunkUrl,
        generatedModuleReached: stage !== 'chunk-fetch-failed',
        likelyReachedCreateClient: stage === 'other',
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        willRetry: !isLastAttempt,
      })
      if (!isLastAttempt) await delay(CLOUD_CLIENT_RETRY_DELAY_MS)
    }
  }
  return null
}

export const supabase: SupabaseClient | null = await loadCloudClient()
