# Find the real startup blocker with boot instrumentation

## What the evidence currently shows

Confirmed by measurement, not assumption:

- The dev server compiles cleanly; the earlier parse errors in the log were from a transient mid-edit state and are gone.
- A cold load of `/` in a real browser at your exact viewport (721x529, dpr 1.5) fetches 47 modules and renders the Welcome Screen in ~0.7s. With 30ms and 60ms of artificial latency added to every single request, it still renders in ~1.0s and never reaches the 8s fallback.
- Live preview network traffic shows the app's profile request returning 200 repeatedly from your preview session, which means in those sessions React mounted and auth initialization completed.

So the stall is not reproducible from inside the sandbox, and no single promise in the current code has been shown to hang. Guessing at a culprit now would be a fix aimed at the wrong target. The fallback screen currently tells us only that React did not mount in 8 seconds — it does not say which stage stalled or whether anything threw.

## The plan: make the failing load report itself

Add lightweight boot instrumentation so the next preview load that stalls names the blocker exactly, with no timeout increase, no hidden fallback, and no design change.

1. Record a timestamped boot stage marker at each startup step: HTML parsed, entry module executing, React root created, first render committed, router mounted, auth initialization started, session resolved, profile resolved, landing route rendered.
2. Capture uncaught errors, unhandled promise rejections, and failed module loads during startup into the same record.
3. When the 8s fail-safe fires, show — in addition to the existing Hebrew message and refresh button — the last completed stage, the elapsed time, and the captured error text, plus a copy button.
4. Log the same record to the console so it appears in preview diagnostics automatically.
5. Keep the whole record in memory only. No new dependency, no service worker, no reload loop, no routing change.

## Then fix the identified blocker

Once one stalled preview load reports its last completed stage, the failing step is known precisely — auth, profile, routing, module loading, or React render — and the minimal fix targets that step only. Instrumentation that is no longer needed after the fix is removed at the same time; the bounded fail-safe stays.

## Technical notes

- Stage markers are written to a small `window.__meridianBoot` array from `index.html` (pre-module stages) and from `src/main.tsx` plus `src/auth/AuthProvider.tsx` (mount and auth stages).
- Error capture uses `window.addEventListener('error' | 'unhandledrejection')` registered in `index.html` before the entry module, so a module-level throw is caught.
- Files touched: `index.html`, `src/main.tsx`, `src/auth/AuthProvider.tsx`, and a single small helper module. Guest state, `meridian:save`, the auth client and provider, and all routes stay unchanged.
