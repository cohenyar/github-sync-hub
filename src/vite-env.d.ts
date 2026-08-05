/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Lovable Cloud's env var name for the public/publishable Supabase key — see src/auth/supabaseClient.ts. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Older Supabase key naming, accepted as a fallback for a non-Lovable-managed Supabase project. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
