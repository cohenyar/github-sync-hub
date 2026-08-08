import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { markBootStage } from '../bootDiagnostics'
import { he } from '../i18n'
import { translateAuthError } from './authErrorMessages'
import { googleAuthErrorMessage } from './googleAuthErrorMessages'
import { cloudClientPromise, isSupabaseConfigured } from './supabaseClient'
// Namespace import on purpose: `retryCloudClient` is a newer export, and every
// existing test mocks './supabaseClient' with a factory that only provides
// `isSupabaseConfigured` / `cloudClientPromise`. Reading it off the namespace
// keeps those mocks valid (the binding is simply undefined there) instead of
// failing at module link time on a missing named export.
import * as supabaseClientModule from './supabaseClient'
import type { AuthActionResult, AuthContextValue, AuthStatus, AuthUser, Role } from './types'

const VALID_ROLES: readonly Role[] = ['student', 'admin']

/**
 * Local-only marker for "I chose to play without an account". Deliberately
 * separate from `meridian:save` (game progress) and from the Cloud account —
 * clearing it never touches progress, and signing out never clears progress.
 */
const GUEST_KEY = 'meridian:guest'
/**
 * Where the user was when they pressed "sign in with Google" — sessionStorage
 * only, so it never touches `meridian:save` or any persisted game state.
 */
export const POST_AUTH_PATH_KEY = 'meridian:post-auth-path'

// Start fetching the managed OAuth helper as soon as this safe wrapper module
// is evaluated. This does not block React startup and is still guarded by the
// env check, but unlike the previous cloudClientState-dependent preload it is
// ready before the user can reach and click the Google button in Preview.
const lovableModulePromise = isSupabaseConfigured
  ? import('../integrations/lovable/index').catch(() => null)
  : Promise.resolve(null)

function readGuestFlag(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === 'true'
  } catch {
    return false
  }
}

function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value)
}

/**
 * Fail-closed by construction: a Supabase query error, a missing profiles
 * row, and an unrecognized role value are all indistinguishable from "no
 * admin access" here — none of them can ever resolve to 'admin'. It also
 * fails OPEN for startup: a hanging profiles request resolves to null after
 * 6s instead of leaving the session stuck in 'loading' forever.
 *
 * Takes the already-resolved client as a parameter rather than reading a
 * module-level binding — see the auth-state race fix pass note on
 * cloudClientPromise in supabaseClient.ts for why.
 */
async function fetchRole(client: SupabaseClient, userId: string): Promise<Role | null> {
  const query: Promise<Role | null> = Promise.resolve(
    client.from('profiles').select('role').eq('id', userId).single(),
  )
    .then(({ data, error }) => (error || !data || !isValidRole(data.role) ? null : (data.role as Role)))
    .catch(() => null)
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 6000))
  return Promise.race([query, timeout])
}


function toAuthUser(session: Session): AuthUser {
  const metadata = session.user.user_metadata as Record<string, unknown> | undefined
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    avatarUrl: (metadata?.avatar_url as string | undefined) ?? null,
    displayName: (metadata?.full_name as string | undefined) ?? (metadata?.name as string | undefined) ?? null,
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * The ONE auth provider in the app: it owns the entire Cloud session
 * lifecycle (Google, email/password, reset) and the local guest flag.
 * Deliberately independent of the local save system (src/persistence) — it
 * never reads or writes `meridian:save`; signing in or out only ever
 * touches the Cloud session and the guest marker.
 *
 * Guest → Account migration, stated explicitly: there is currently no
 * cloud save (no `saves`/`progress` table exists — the only Supabase table
 * is `profiles`, used for role lookup). "Migrating" a guest's progress
 * therefore doesn't mean syncing anything anywhere; it means *not losing*
 * the local save when a guest becomes an account holder — which is true by
 * construction, not by any special-cased migration logic, because none of
 * the functions below ever touch `meridian:save`. A guest who signs up,
 * confirms their email, or signs in keeps exactly the local progress they
 * had a moment before, on this device.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Skips 'loading' entirely when unconfigured, so a missing Cloud setup
  // resolves instantly to guest mode instead of hanging forever.
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState<boolean>(readGuestFlag)
  // Auth-state race fix pass — the one real fix this pass adds: a genuine,
  // reactive third state. Previously `configured`/`cloudClientLoadFailed`
  // were derived from `supabase`, a plain module constant assigned once via
  // a top-level `await` — meaning there was no way to ever represent "still
  // resolving," and (see the bug this replaces) the code path for "client
  // resolved to null" didn't exist at all, leaving `status` stuck at
  // 'loading' forever in that case. This state is tracked explicitly here,
  // driven by cloudClientPromise settling — independent of whatever
  // module-import timing Lovable Preview's specific hosting produces.
  const [cloudClientState, setCloudClientState] = useState<'pending' | 'ready' | 'unavailable'>(
    isSupabaseConfigured ? 'pending' : 'unavailable',
  )
  // Bumped by retryCloudConnection() — re-runs the whole session-wiring
  // effect below, so a failed client load is recoverable without a reload.
  const [retryAttempt, setRetryAttempt] = useState(0)

  useEffect(() => {
    markBootStage('auth-init-started')
    if (!isSupabaseConfigured) {
      markBootStage('auth-skipped-unconfigured')
      return
    }

    let cancelled = false
    let timeoutId = 0
    let unsubscribe: (() => void) | undefined

    // Timeout protection: if Cloud never answers, the app must not sit in
    // 'loading' forever — it resolves to signed-out (guest still works) with
    // a non-blocking warning. Re-armed on EVERY transition into 'loading'
    // (initial load and every later auth event), never just the first one.
    // Armed immediately, before the client is even known to have loaded —
    // covers the whole pending window now, not just the time after it.
    function armLoadingTimeout() {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        setStatus((current) => {
          if (current !== 'loading') return current
          setAuthError(he.authTimeoutMessage)
          return 'signed-out'
        })
      }, 8000)
    }
    armLoadingTimeout()

    // On the first pass this is the original module-load promise; a
    // user-initiated retry re-runs the same loader (never a second client).
    let retry: (() => Promise<SupabaseClient | null>) | undefined
    try {
      // Guarded: Vitest's module mocks THROW on access to an export their
      // factory doesn't define, so this must never be a bare property read.
      retry = (supabaseClientModule as { retryCloudClient?: () => Promise<SupabaseClient | null> }).retryCloudClient
    } catch {
      retry = undefined
    }
    const clientPromise = retryAttempt > 0 && retry ? retry() : cloudClientPromise

    clientPromise.then((client) => {
      if (cancelled) return
      setCloudClientState(client ? 'ready' : 'unavailable')

      if (!client) {
        // Bug fix — this branch previously didn't exist: the old code
        // returned before ever reaching a point where it could call
        // setStatus again once it learned the client was null, leaving
        // `status` stuck at 'loading' forever whenever env vars were
        // present but the client failed to load (see the root-cause
        // report). Guest mode remains fully usable either way.
        markBootStage('auth-client-unavailable')
        window.clearTimeout(timeoutId)
        setStatus('signed-out')
        return
      }

      // A separate binding, not just `client` directly — TypeScript's
      // narrowing from the `if (!client) return` guard above doesn't
      // extend into this nested function declaration's own closure, since
      // it's checking "could client have changed by call time," not this
      // specific never-reassigned binding.
      const readyClient = client

      async function resolveSession(session: Session | null) {
        markBootStage(session ? 'auth-session-resolved' : 'auth-session-resolved-none')
        if (!session) {
          if (!cancelled) {
            setUser(null)
            setRole(null)
            setAuthError(null)
            setStatus('signed-out')
          }
          return
        }
        if (!cancelled) setUser(toAuthUser(session))
        const resolvedRole = await fetchRole(readyClient, session.user.id)
        markBootStage('auth-profile-resolved')
        if (cancelled) return
        setRole(resolvedRole)
        setAuthError(resolvedRole ? null : he.authProfileErrorMessage)
        setStatus('signed-in')
      }

      client.auth
        .getSession()
        .then(({ data }) => resolveSession(data.session))
        .catch(() => {
          if (!cancelled) {
            setUser(null)
            setRole(null)
            setStatus('signed-out')
            setAuthError(he.authUnavailableMessage)
          }
        })

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        // A session transition (sign-in, sign-out, token refresh, or a
        // password-recovery link's temporary session) always re-enters
        // 'loading' first, so ProtectedAdminRoute/AuthButton never render
        // stale role/account info from the previous session while the new
        // one resolves.
        setStatus('loading')
        armLoadingTimeout()
        resolveSession(session)
      })
      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      unsubscribe?.()
    }
  }, [retryAttempt])

  /**
   * User-initiated recovery from "auth unavailable": puts the UI back into a
   * neutral resolving state and re-runs the client load + session wiring.
   */
  function retryCloudConnection() {
    if (!isSupabaseConfigured) return
    setAuthError(null)
    setCloudClientState('pending')
    setStatus('loading')
    setRetryAttempt((n) => n + 1)
  }

  // Preview self-heal: inside Lovable Preview's sandboxed iframe the client
  // chunk can fail to load on the very first paint (cold chunk / hiccup),
  // which used to leave the auth bar showing "unavailable" until the user
  // pressed Retry. Auto-retry a bounded number of times so Google/Email
  // sign-in appear on their own. Only when the build IS configured.
  const AUTO_RETRY_LIMIT = 2
  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (cloudClientState !== 'unavailable') return
    if (retryAttempt >= AUTO_RETRY_LIMIT) return
    const id = window.setTimeout(() => {
      setAuthError(null)
      setCloudClientState('pending')
      setStatus('loading')
      setRetryAttempt((n) => n + 1)
    }, 800)
    return () => window.clearTimeout(id)
  }, [cloudClientState, retryAttempt])

  // Popup-blocker fix: the managed Google helper opens a popup window. Browsers
  // only allow that inside the user-activation window of the click itself — any
  // `await` before it (dynamic import, client promise) drops the activation, the
  // popup is blocked, and the SDK falls back to a full-page redirect, which in
  // Lovable Preview happens *inside the iframe* where Google refuses to render.
  // So we preload the module up-front and call it synchronously on click.
  const lovableModuleRef = useRef<typeof import('../integrations/lovable/index') | null>(null)
  useEffect(() => {
    let cancelled = false
    void lovableModulePromise
      .then((mod) => {
        if (!cancelled) lovableModuleRef.current = mod
      })
    return () => {
      cancelled = true
    }
  }, [])






  function continueAsGuest() {
    try {
      localStorage.setItem(GUEST_KEY, 'true')
    } catch {
      /* private mode — guest play still works, it just isn't remembered */
    }
    setIsGuest(true)
  }

  function clearGuest() {
    try {
      localStorage.removeItem(GUEST_KEY)
    } catch {
      /* ignore */
    }
    setIsGuest(false)
  }

  function signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured) return
    setAuthError(null)
    clearGuest()
    // Managed Google sign-in through Lovable Cloud.
    // redirect_uri MUST be the plain public origin: for the full-page browser
    // flow the SDK sets window.location.href before it can hand the session
    // back, so a deep/protected URL (the old window.location.href) can land
    // the user on a guarded route — or a 404 — before the session exists.
    // The intended page is remembered separately and restored by the app once
    // the session is hydrated.
    try {
      sessionStorage.setItem(POST_AUTH_PATH_KEY, window.location.pathname + window.location.search)
    } catch {
      /* private mode — we simply return to the origin instead */
    }
    const preloaded = lovableModuleRef.current
    if (!preloaded) {
      setAuthError(he.authLoadingMessage)
      void lovableModulePromise.then((mod) => {
        if (mod) lovableModuleRef.current = mod
      })
      return Promise.resolve()
    }

    // This call is deliberately made synchronously in the click stack. Any
    // dynamic import/await before it causes Preview browsers to block the
    // OAuth popup and attempt an unusable in-iframe Google navigation.
    return preloaded.lovable.auth
      .signInWithOAuth('google', { redirect_uri: window.location.origin })
      .then((result) => {
        if (result.error) setAuthError(googleAuthErrorMessage(result.error))
      })
      .catch((error) => setAuthError(googleAuthErrorMessage(error)))
  }

  // Email/password sign-up. Deliberately returns its own scoped result
  // rather than writing into `authError` (the ambient session-lifecycle
  // error) — a form needs an error tied to the submit it just made, not a
  // value that could already be stale by the time it renders.
  async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthActionResult> {
    const client = await cloudClientPromise
    if (!client) return { error: he.authUnavailableMessage }
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: displayName ? { full_name: displayName } : undefined,
      },
    })
    if (error) return { error: translateAuthError(error) }
    clearGuest()
    // Supabase's own signal for "confirm your email before you get a
    // session": a real user row came back, but no session did.
    return { error: null, needsEmailConfirmation: data.user !== null && data.session === null }
  }

  async function signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
    const client = await cloudClientPromise
    if (!client) return { error: he.authUnavailableMessage }
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) return { error: translateAuthError(error) }
    clearGuest()
    return { error: null }
  }

  // Sends a reset-password email; never touches the current session (a
  // signed-out guest and a signed-in user can both request one). The
  // redirect lands on the dedicated ResetPasswordPage, where the recovery
  // link's own (temporary) session is picked up by the same onAuthStateChange
  // above like any other session — updatePassword below then finalizes it.
  async function sendPasswordReset(email: string): Promise<AuthActionResult> {
    const client = await cloudClientPromise
    if (!client) return { error: he.authUnavailableMessage }
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: translateAuthError(error) }
    return { error: null, needsEmailConfirmation: true }
  }

  async function updatePassword(password: string): Promise<AuthActionResult> {
    const client = await cloudClientPromise
    if (!client) return { error: he.authUnavailableMessage }
    const { error } = await client.auth.updateUser({ password })
    if (error) return { error: translateAuthError(error) }
    return { error: null }
  }

  async function signOut() {
    const client = await cloudClientPromise
    if (!client) return
    setAuthError(null)
    // Only ever clears the Cloud session — never touches meridian:save or
    // any other local progress (see src/persistence).
    const { error } = await client.auth.signOut()
    // A failed sign-out previously failed silently — this surfaces it the
    // same way every other auth action here already does, rather than
    // leaving the UI looking signed-in with no explanation.
    if (error) setAuthError(he.signOutErrorMessage)
  }

  const value: AuthContextValue = {
    status,
    user,
    role,
    isAdmin: role === 'admin',
    authError,
    // Availability, not just env presence: the client is resolved lazily and
    // settles to null if it failed to initialise — the UI must then explain
    // itself rather than pretend sign-in works. Derived from the reactive
    // cloudClientState now, not a frozen module constant — see that state's
    // own comment for why (auth-state race fix pass).
    configured: cloudClientState === 'ready',
    // Playtest fix pass — distinguishes "env vars genuinely absent" from
    // "env vars present but the client failed to load" so AuthButton/
    // WelcomeScreen can stop claiming missing configuration when that
    // isn't actually what happened.
    cloudClientLoadFailed: isSupabaseConfigured && cloudClientState === 'unavailable',
    // Auth-state race fix pass — true only while genuinely still resolving;
    // never true once cloudClientState has settled either way.
    cloudClientPending: cloudClientState === 'pending',
    retryCloudConnection,
    isGuest,
    continueAsGuest,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updatePassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
