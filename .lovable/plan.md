# Preview environment — corrected diagnosis and next step

## Correction to my previous plan

My previous plan claimed a "split provisioning state" between the hosted Preview and the
Editor workspace, and recommended a full Preview reprovision. That conclusion was
overstated and I am withdrawing it. Two things about it were wrong:

1. I cannot perform a hosted Preview reprovision. No tool available to me discards a
   Preview deployment snapshot, creates a fresh one, or regenerates the auth-bridge
   session binding. Those are Lovable control-plane operations. I should have said this
   instead of writing a plan that implied I could execute it.
2. I treated the `302 -> lovable.dev/auth-bridge` response as evidence of a broken
   binding. It is not. My request carried no Lovable session cookie, so the access gate
   correctly redirected it. That redirect is the expected behaviour for an
   unauthenticated request to a private Preview, not a fault.

## What is actually measured right now

Re-checked this turn, against the process that serves your Preview:

```text
[meridian][auth-diagnostic] Cloud client load starting
  {isSupabaseConfigured: true, urlPresent: true, keyPresent: true}
[meridian][auth-diagnostic] Cloud client import succeeded {attempt: 1, hasClient: true}
```

Also confirmed:

- `.env` holds the Cloud URL, publishable key, and project id.
- The Preview server process started after `.env` was written, so it picked those values up.
- Lovable Cloud backend is up and healthy, project `pntmkkwrxjkjaadooxpj`, managed by Lovable.
- The app creates exactly one Cloud client; nothing in Meridian's code references `auth-bridge`.

So the code path that produces your error message resolves to `configured` on the build
being served. I cannot reproduce `urlPresent: false` from inside the sandbox.

## Honest statement of the gap

You report the failure in a fresh incognito session, which rules out tab cache. I cannot
observe your browser's session, and I cannot reach the hosted Preview origin as an
authenticated user. So there is a real, unexplained difference between what the server
serves and what your browser executes, and I do not currently have evidence that names
its cause. I am not going to invent one again.

Two candidates remain, and they are distinguishable by one piece of evidence:

- **A** — your browser is executing a different (older) deployment of the app.
- **B** — your browser is executing the current deployment and the values genuinely are
  absent for the hosted origin only.

## What I need from you to separate them

In the failing incognito Preview tab, open devtools and report:

1. The full `[meridian][auth-diagnostic] Cloud client load starting` line.
2. The **Network** tab, JS document request: the value of the `x-deployment-id` response
   header on the Preview page itself.
3. Whether the console shows `Cloud client import succeeded` or the
   `generated client failed to load` warning with its `stage` field.

Item 2 is the decisive one. It tells us which deployment your browser actually ran, which
settles A vs B without further speculation.

## What to do about the reprovision request

A Preview reprovision has to be triggered from Lovable's side. If you want to proceed with
it regardless of the evidence above, raise it with Lovable Support with these details:

- Lovable project ID: `714988df-6b13-49ae-88a2-1134a0178761`
- Preview host: `id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app`
- Access-gate identifier seen in the redirect: `lovp_2qzjvkr5s19q8bfhf321za4nbr`
- Symptom: hosted Preview reports both `VITE_SUPABASE_*` values absent in a fresh
  incognito session, while the project workspace has them and the Cloud backend is healthy
- Request: reprovision the hosted Preview environment and regenerate its bridge/origin
  binding, keeping the existing Cloud backend and keys unchanged

## Not doing

No new backend, no key rotation, no second auth client, no hardcoded credentials, and no
changes to `AuthProvider`, `LandingAuth`, `AuthPage`, `supabaseClient`, the generated
client, gameplay, or `meridian:save`.
