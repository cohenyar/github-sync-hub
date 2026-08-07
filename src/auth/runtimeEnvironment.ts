/**
 * Same mockable-boolean-export contract as `isSupabaseConfigured`
 * (./supabaseClient) — a plain constant read once at module load, so tests
 * can `vi.mock` this module to flip branches without touching real env vars.
 *
 * `import.meta.env.DEV` is true exactly when the app is served by the Vite
 * dev server (`npm run dev`), and false for any production build — whether
 * that build is hosted by Lovable (where the managed OAuth broker at
 * `/~oauth/initiate` exists) or anywhere else. That's the one signal we
 * actually need: Google sign-in's managed redirect only resolves on
 * Lovable's hosted infrastructure, never on a bare Vite dev server.
 */
export const isLocalDevRuntime = Boolean(import.meta.env.DEV)
