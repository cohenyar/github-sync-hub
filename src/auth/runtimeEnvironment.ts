/**
 * Same mockable-boolean-export contract as `isSupabaseConfigured`
 * (./supabaseClient) — a plain constant read once at module load, so tests
 * can `vi.mock` this module to flip branches without touching real env vars.
 *
 * Hostname-based, deliberately NOT `import.meta.env.DEV`: an earlier version
 * of this check used DEV, on the assumption it was true only for a bare
 * `npm run dev`. That assumption broke real local dev when a later refactor
 * dropped the check entirely and Google sign-in started navigating straight
 * to `/~oauth/initiate` (a route that only exists on Lovable's hosted
 * infrastructure) and 404ing. Restoring it on DEV would risk the opposite
 * failure: Lovable Preview also serves the app via a Vite dev server, so
 * DEV alone can't tell "developer's own machine" apart from "Preview,
 * where the managed broker exists and must keep working." The one signal
 * that's actually true only for a real local machine is the hostname it's
 * reached at — `localhost`, `127.0.0.1`, or `::1` — never Preview, staging,
 * or production.
 */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

export const isLocalDevRuntime =
  typeof window !== 'undefined' && LOCAL_HOSTNAMES.has(window.location.hostname)
