# Meridian startup recovery fix

## Confirmed diagnosis

The blocker is in `index.html`, not Lovable Cloud auth. The fixed entry URL (`/src/main.tsx?v=20260807-1`) is served by Preview with a one-year immutable cache policy, so the same URL can retain a stale Vite module graph after source or asset changes. The 4-second boot watchdog can then reload while a slow but valid module load is still in progress.

No service worker or PWA cache is registered in this project. The Welcome Screen is not gated on auth, and an unavailable auth/profile request does not prevent the home route from rendering.

## Implementation

1. Remove the fixed version query from the Vite entry URL so Preview uses the current module graph instead of a permanently cached entry.
2. Replace the reload-first boot watchdog with a bounded, storage-safe fail-safe:
   - never auto-reload a slow valid startup;
   - catch unavailable `sessionStorage` access;
   - always replace the spinner with a usable retry/error state after a timeout.
3. Strengthen `AuthProvider` so every session/profile resolution—including later auth refresh events—has a fresh timeout and fails open to signed-out/Guest-capable state with the existing non-blocking warning.
4. Keep the existing single auth provider/client, routes, auth methods, guest flag, and `meridian:save` untouched.

## Verification

Test normal load, refresh, cache-bypassing refresh, signed-out state, restored session, unavailable auth/profile requests, slow network, mobile viewport, console errors, and service-worker registrations. Confirm the Welcome Screen remains usable and no loading surface can persist indefinitely.