import * as Sentry from '@sentry/react'

/**
 * Game Feel pass — whole-app crash reporting via Sentry's free Developer
 * tier (5,000 events/month, silently dropped past the cap, never billed).
 * A no-op whenever VITE_SENTRY_DSN is unset (dev/test, and any deployment
 * that hasn't configured it yet) — every call site in this file degrades
 * safely rather than throwing, exactly like the Supabase auth surface
 * degrades to guest mode when unconfigured.
 */
export function initErrorReporting(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    // Production-only by design (see the module doc above) — dev/test never
    // reports, so local errors never pollute a shared Sentry project.
    enabled: import.meta.env.PROD,
  })
}
