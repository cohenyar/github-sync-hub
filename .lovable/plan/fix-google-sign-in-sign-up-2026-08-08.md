# Fix Google sign-in / sign-up

## What's wrong

Two separate problems, both confirmed by looking at the current setup:

1. **The Google provider was never activated on the backend.** The app code calls the managed Google OAuth helper (`lovable.auth.signInWithOAuth('google', ...)` in `src/auth/AuthProvider.tsx`, with `@lovable.dev/cloud-auth-js` installed), but the backend's Google sign-in method has not been switched on. Until it is, every Google attempt fails with an "unsupported provider" style error.

2. **Your preview is showing the "auth unavailable" message instead of the buttons.** In the screenshot the top bar reads "לא ניתן להתחבר לשירות ההתחברות כרגע" — the landing auth bar hides Google/Email whenever the backend client hasn't finished resolving. The environment values are present in this build, so this is the client-loading state getting stuck or failing rather than a real misconfiguration. Needs one live check in the preview to confirm which.

## Plan

1. **Activate Google sign-in on the backend** using the managed social-login configuration (keeps email/password enabled alongside it). No credentials needed from you — Lovable's managed Google client is used.
2. **Diagnose the "auth unavailable" state in the live preview**: load `/` in a real browser session, read the client-resolution state and any chunk-load error, and confirm whether it resolves to ready or fails.
3. **Fix whatever step 2 finds**, smallest change only. Likely one of:
   - the client-resolution state never leaving "resolving" → make the landing bar render the sign-in controls once the environment values are present, treating a slow client load as loading rather than unavailable;
   - a transient chunk-load failure → keep the existing retry but allow re-attempt on button click instead of latching to "unavailable" for the session.
4. **Make the unavailable state actionable** rather than a dead end: show the real reason plus a retry button, and keep guest mode present.
5. **Verify end to end**: Google button visible on landing and `/auth`, Google flow reaches the Google consent screen, email sign-up/sign-in still work, guest mode unchanged, sign-out visible when signed in, mobile layout intact, no console errors.

## Constraints kept

- No second auth client, no hardcoded credentials, no edits to generated backend client files.
- No changes to gameplay, world, or `meridian:save`.
- All user-facing text stays Hebrew.

## Technical notes

- Backend: enable the `google` provider via managed social auth; leave `email` enabled.
- `configured` in `src/auth/AuthProvider.tsx` is `cloudClientState === 'ready'`; `LandingAuth.tsx` and `AuthPage.tsx` branch on it. The fix targets that branch condition and its error surface, not the client loader's safety behaviour (no static import reintroduced, no throw before React mounts).
