# Hosted Preview environment — supported mechanism and repair

## Confirmed supported mechanism

For a classic Vite project on Lovable, the **only** supported way to expose
`VITE_*` values to a repository-backed hosted Preview build is the Lovable-generated
root `.env` being present in the project revision.

Lovable's own documentation states this directly: `.env` must **not** be gitignored in a
Lovable project, because Lovable needs it in the repository so build-time `VITE_*` values
exist when generating Preview and published builds; gitignoring it breaks the Preview.

There is no alternative supported channel. The Secrets manager is explicitly **not** it:
secrets are runtime values for backend/edge functions and are never injected into a
client-side Vite build. There is no per-Preview environment panel for `VITE_*` values.

## Why this project fails

Measured on the affected revision `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`:

- `.env` exists in the editor workspace, so the internal process reports all values present.
- `.env` is untracked and absent from the revision itself.
- `.gitignore` lines 35-36 exclude `.env` and `.env.*`.

The hosted build therefore compiles the same source with no environment at all, producing
`urlPresent: false`, `keyPresent: false`, `isSupabaseConfigured: false`. This matches the
independent finding that building this source without `.env` reproduces the failure exactly.

## About the "no general-purpose .env in source control" concern

Your concern is correct for a normal repository, but it does not apply to these three values:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` are
  public browser values. They are compiled into the JavaScript bundle and are already
  visible to anyone who opens the app. Committing them reveals nothing new.
- Data protection comes from Row Level Security, not from hiding the publishable key.
- The service-role key and database password are **not** in this file, are not available to
  a frontend project, and must never be placed there.
- This is not a general-purpose `.env`: it is the Lovable-generated Cloud env file.

If you still prefer no committed env file, the hosted Preview cannot receive these values,
and that is a platform constraint rather than something app code can work around.

## Safety pre-check (already performed, names only)

The generated root `.env` was inspected for variable NAMES only; no values were read,
printed, or logged. It contains exactly three keys, all public frontend config:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

No service-role key, no database password, no private API key, no backend secret, no
non-public credential. The safety gate passes, so the change may proceed.

## Proposed change (one file, no app code)

Edit `.gitignore` lines 34-37 only:

```text
# Environment
.env
.env.*          -> removed
!.env.example
```

becomes

```text
# Environment
.env.local
.env.*.local
!.env.example
```

(`*.local` on line 16 already covers local overrides; the explicit lines are kept for clarity.)

Net effect: the generated Lovable Cloud `.env` (public values only) becomes part of the
revision, so the hosted Preview build receives it. Personal local overrides stay ignored.

Files touched: `.gitignore`. Nothing else.


## Explicitly not doing

No changes to `AuthProvider`, `supabaseClient`, `AuthPage`, `LandingAuth`, the generated
client, gameplay, or `meridian:save`. No new backend, no second auth client, no key
rotation, no hardcoded credentials. The existing Cloud backend and managed Google provider
stay exactly as they are.

## Limits of what I can execute

I can make the `.gitignore` change. I cannot edit or force-add the auto-generated `.env`
myself, and I have no tool that reprovisions the hosted Preview. After the ignore rule is
removed, the generated `.env` must be included in a new revision by Lovable's normal sync,
and a fresh hosted Preview build must be produced from it. If the `.env` still does not
appear in the revision after that, the remaining step is Lovable Support / control-plane:

- Project: `714988df-6b13-49ae-88a2-1134a0178761`
- Revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- Finding: generated root `.env` present in workspace, absent from the repository revision
- Request: sync the existing Cloud public Vite env into the repository-backed hosted build;
  do not create a backend or rotate keys

## Verification (external Preview only)

Checked at `https://id-preview--714988df-6b13-49ae-88a2-1134a0178761.lovable.app/`, never
localhost or the internal process:

```text
urlPresent: true
keyPresent: true
isSupabaseConfigured: true
Cloud client import succeeded
```

Google and email auth get tested only after that passes.
