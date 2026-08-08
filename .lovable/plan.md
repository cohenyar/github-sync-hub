# Preview provisioning audit — platform diagnosis

## Root cause

The hosted Preview is in a **split provisioning state**:

- The project workspace is correctly attached to the existing Lovable Cloud backend.
- The backend is active and healthy.
- The workspace `.env` has the correct public Cloud URL, publishable key, and project identifier.
- A newly started local Preview process receives those values and initializes the generated Cloud client successfully.
- The externally hosted `id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app` session nevertheless serves a build/runtime context in which both Vite values are absent.

Therefore the missing values are **not caused by app code, the backend, an incorrect key, browser cache, or a second backend**. The hosted Preview deployment/session was not reprovisioned with the current Cloud attachment. The Editor workspace and hosted Preview are currently resolving different environment snapshots.

## Auth-bridge finding

The Preview URL first redirects to Lovable's access gate:

```text
https://lovable.dev/auth-bridge?project_id=lovp_2qzjvkr5s19q8bfhf321za4nbr
```

The `project_id` here is Lovable's internal Preview/access-control identifier, not the Cloud backend identifier. It is normal for those identifiers to differ.

The browser's `auth-bridge` / `postMessage` origin errors show that the access-gate session is not completing for the `id-preview--…lovable.app` child origin. Because the problem reproduces in a fresh browser, this is not an expired-tab artifact. The hosted Preview's bridge/session binding is stale or inconsistent with its current project deployment.

This bridge failure and the missing environment values have the same platform boundary: the hosted Preview instance/access session, not Meridian's React authentication layer.

## Exact configuration/state that is wrong

The wrong state is the **hosted Preview deployment record and its auth-bridge session binding**:

1. Its frontend environment snapshot does not include the Cloud attachment's public Vite variables.
2. Its Preview access-gate session is not establishing a valid parent/child origin handshake.
3. The project workspace and Cloud backend attachment themselves are healthy and point to the correct existing backend.

The evidence does not support changing Google provider configuration. Managed Google is bound to the existing Cloud project, but it cannot work in this Preview until the Cloud client exists and the Preview bridge is healthy.

## Required action

Perform a **full Lovable hosted Preview reprovision**, not an app rebuild and not a backend replacement. The reprovision must:

1. discard the current hosted Preview deployment/environment snapshot;
2. create a fresh Preview deployment from the current project workspace;
3. reattach that Preview deployment to the project's existing Lovable Cloud backend;
4. regenerate the Preview access-gate/auth-bridge session binding for the exact `id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app` origin;
5. retain the current backend and managed Google provider unchanged.

There is no application-code change or self-service backend operation that can repair this split state. Restarting the database/auth backend would not help because it is already healthy. Rotating keys, adding hardcoded values, creating another client, or creating another backend would mask the provisioning fault and must not be done.

This requires Lovable's Preview control plane to reprovision the project. If closing/reopening the editor does not allocate a fresh Preview instance, escalate to Lovable Support with:

- Lovable project ID: `714988df-6b13-49ae-88a2-1134a0178761`
- Preview host: `id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app`
- auth-bridge project identifier: `lovp_2qzjvkr5s19q8bfhf321za4nbr`
- symptom: workspace has Cloud env values, hosted Preview reports both absent
- symptom: auth-bridge/postMessage origin handshake fails in a fresh session
- request: reprovision the hosted Preview environment and regenerate its bridge/origin binding without replacing the existing Cloud backend

## Acceptance check after reprovision

Before testing Google or email authentication, the real hosted Preview must show:

```text
urlPresent: true
keyPresent: true
isSupabaseConfigured: true
Cloud client import succeeded
```

It must also complete the Preview auth-bridge handshake without an origin/postMessage error.

No Meridian source file should be changed for this repair.