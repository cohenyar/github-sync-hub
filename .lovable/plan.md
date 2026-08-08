# Preview / Cloud environment audit — diagnosis only

## What I actually measured (this turn, no code changed)

- Project root `.env` contains all three values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (written 19:09 UTC).
- The running Preview server was started at 19:31 UTC, i.e. **after** the env file was written, so Vite loaded those values into the bundle.
- I loaded the live app in a clean headless browser (no cache, no stored session) and read its console:

```text
[meridian][auth-diagnostic] Cloud client load starting
  {isSupabaseConfigured: true, urlPresent: true, keyPresent: true}
[meridian][auth-diagnostic] Cloud client import succeeded {attempt: 1, hasClient: true}
```

So the build that the Preview serves right now already satisfies the success criteria:
`urlPresent: true`, `keyPresent: true`, `isSupabaseConfigured: true`, Cloud client import succeeded.

- No service worker exists (`registerServiceWorker()` is an intentional no-op, no `sw.js`, no PWA plugin), so nothing in the app is caching an old bundle.

## Answers to the eight questions

1. **Why your Preview still shows `urlPresent: false`** — because that console output is not coming from the build now being served. Your Preview tab is holding a document/module graph fetched before the env sync. A clean fetch of the same URL shows the values present. There is no env value missing on the server side.
2. **The auth-bridge origin error** — `https://lovable.dev/auth-bridge?project_id=…` is Lovable's own Preview session gate, loaded from the editor origin into the `id-preview--….lovable.app` frame. The "unsafe attempt to load URL … from frame with URL …" message is the browser refusing that cross-origin navigation when the **Preview session cookie has expired**. It is platform session state, not app code, and it is exactly what leaves an old tab pinned to a stale document.
3. **Preview iframe origin authorization** — the preview origin is the standard `id-preview--<project-id>.lovable.app` host for this project and is authorized; it served the app and its module chunks correctly in my clean session.
4. **Correct Cloud project?** — yes. The app is bound to the single existing Lovable Cloud backend for this project; only one client is created (`src/integrations/supabase/client.ts`), and it resolved successfully.
5. **Preview vs Editor scope mismatch?** — no. Both point at the same project id `714988df-6b13-49ae-88a2-1134a0178761` and the same Cloud backend. The mismatch you saw is session freshness, not scope.
6. **auth-bridge `project_id`** — it is the Lovable project id above (not a Supabase ref) and matches this project. It does not select the Cloud backend.
7. **Full Preview reprovision needed?** — no. Reprovisioning would discard a healthy environment for a client-side session problem.
8. **Managed Google provider binding** — the managed provider is bound at the Cloud-project level (not per Preview build), so it is already bound to this environment. It cannot be validated while the tab is stuck on a stale document.

## Root cause

Platform-level: **an expired Lovable Preview session in your browser tab.** The expired session makes the `auth-bridge` frame load fail (the origin error you pasted), the tab keeps the pre-env-sync document, and that old bundle keeps reporting `urlPresent: false / keyPresent: false`. A plain refresh inside a broken iframe re-runs the same blocked bridge, which is why refreshing did not help.

## Required action (no app code changes)

1. Open the Preview in a **separate top-level browser tab** (not the editor iframe): `https://id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app/` — this forces a fresh Lovable login and a fresh document.
2. If it still shows the old state, clear site data for `*.lovable.app` (or use a private window) and reload once.
3. Confirm in that tab's console: `urlPresent: true`, `keyPresent: true`, `isSupabaseConfigured: true`, `Cloud client import succeeded`, and no auth-bridge error.

## Follow-up work I can do once you confirm (needs your approval)

- Verify the six auth flows (Google, email sign-up, confirmation, sign-in, reset, sign-out) end to end in the real Preview.
- Fix the unrelated `manifest.webmanifest` 404: `index.html` links a manifest that does not exist in `public/`. Either add a minimal Hebrew/RTL manifest or remove the link tag. Console noise only, not related to auth.

## Technical notes

- No new Supabase project, no second backend, no second auth client, no hardcoded credentials are involved in any step above.
- `AuthProvider`, `LandingAuth`, `AuthPage`, `supabaseClient`, the generated client, gameplay, and `meridian:save` are all untouched by this diagnosis and by the recommended action.
