# Hosted Preview environment injection — definitive finding

## Exact comparison

- Hosted Preview source revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- Internal healthy Preview source revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- The revisions are identical and contain the latest auth/env handling.
- The root `.env` exists in the editor workspace, so the internal Vite process reads it and reports all values present.
- The same `.env` is **not tracked by Git** and does **not exist in revision `3cd7a3f…`**.
- That revision's `.gitignore` explicitly excludes both `.env` and `.env.*`.

## Root cause

The externally hosted Preview builds from the project revision. That revision has no `.env`, so Vite receives neither `VITE_SUPABASE_URL` nor `VITE_SUPABASE_PUBLISHABLE_KEY` at build time.

The internal Preview process is healthy only because its editor workspace has an out-of-revision `.env` provisioned locally. This creates the observed result:

```text
same source revision + different available build environment
```

This is not an `AuthProvider`, client architecture, Google-provider, backend-health, or stale-revision problem. It also explains why building the revision without `.env` reproduces the hosted failure exactly.

## Required repair

Lovable's official guidance for classic Vite projects is that the generated root `.env` must be available to the repository-backed hosted build; it must not be excluded by `.gitignore`. The Cloud URL and publishable browser key are intentionally public build-time values. The service-role key must never be placed there.

Repair requires:

1. Remove the `.env` exclusion that prevents the generated Lovable Cloud environment file from being included in the project revision.
2. Have Lovable resync/regenerate the existing Cloud project's root `.env` into the repository-backed project state.
3. Produce a new hosted Preview revision/build from that state.
4. Keep the existing Lovable Cloud backend, keys, generated client, and managed Google provider unchanged.

No Meridian auth or gameplay code needs modification.

## Can I complete it with the available tools?

Not completely. I can plan the `.gitignore` correction, but I am prohibited from editing the auto-generated `.env`, and the available tools do not expose a hosted-Preview environment resync/reprovision action or allow me to force an ignored generated file into the repository revision.

Therefore the final environment resync now requires **Lovable Support/control-plane intervention** unless the editor automatically regenerates and tracks `.env` after its ignore rule is removed.

Support request:

- Project: `714988df-6b13-49ae-88a2-1134a0178761`
- Affected revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- Finding: root `.env` exists in the editor workspace but is ignored, untracked, and absent from the hosted Preview revision
- Request: resync the existing Lovable Cloud public Vite environment into the repository-backed hosted Preview build; do not create a backend or rotate keys

## Success check

Verification must be performed against the external `id-preview--…lovable.app` environment, not localhost/internal Preview:

```text
urlPresent: true
keyPresent: true
isSupabaseConfigured: true
Cloud client import succeeded
```