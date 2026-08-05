import type { Session } from '@supabase/supabase-js'
import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { he } from '../i18n'
import { translateAuthError } from './authErrorMessages'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { AuthContextValue, AuthStatus, AuthUser, EmailAuthResult, Role } from './types'

const VALID_ROLES: readonly Role[] = ['student', 'admin']

function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value)
}

/**
 * Fail-closed by construction: a Supabase query error, a missing profiles
 * row, and an unrecognized role value are all indistinguishable from "no
 * admin access" here — none of them can ever resolve to 'admin'.
 */
async function fetchRole(userId: string): Promise<Role | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (error || !data || !isValidRole(data.role)) return null
  return data.role
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
 * Owns the entire Supabase session lifecycle. Deliberately independent of
 * the existing localStorage save system (src/persistence) — this never
 * reads or writes `meridian:save`; signing in or out (Google or email/
 * password, sign-up or sign-in) only ever touches Supabase's own session
 * storage.
 *
 * Guest → Account migration, stated explicitly: there is currently no
 * cloud save (no `saves`/`progress` table exists — the only Supabase table
 * is `profiles`, used for role lookup). "Migrating" a guest's progress
 * therefore doesn't mean syncing anything anywhere; it means *not losing*
 * the local save when a guest becomes an account holder — which is true by
 * construction, not by any special-cased migration logic, because none of
 * the functions below ever touch `meridian:save`. A guest who signs up,
 * confirms their email, or signs in keeps exactly the local progress they
 * had a moment before, on this device. There is also no possible "newer
 * account data" to silently overwrite, since no account-side progress
 * exists to compare against — that scenario only becomes real once a real
 * cloud save is built (a separate, not-yet-scoped workstream: a `saves`
 * table, RLS, and real conflict resolution). Progress today is device-
 * local only and does not follow an account across devices.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Skips 'loading' entirely when unconfigured, so a missing Supabase setup
  // resolves instantly to guest mode instead of hanging forever.
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  // A ref alongside the state above: onAuthStateChange's PASSWORD_RECOVERY
  // event and the mount-time getSession() call both resolve asynchronously
  // and can race — this lets resolveSession check "are we in a recovery
  // flow" synchronously within the same effect, instead of trusting
  // whichever of the two happens to observe a stale isPasswordRecovery
  // state first.
  const isPasswordRecoveryRef = useRef(false)
  // Lets updatePassword reuse the exact same session-resolution logic
  // (fetchRole, status transitions) after a successful reset, instead of
  // duplicating it — resolveSession itself is declared inside the effect
  // below (it closes over that effect's own `cancelled` flag), so this ref
  // is how a function outside the effect reaches the current instance of it.
  const resolveSessionRef = useRef<(session: Session | null) => Promise<void>>(async () => {})

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let cancelled = false

    async function resolveSession(session: Session | null) {
      // A password-recovery session is a temporary, single-purpose session
      // for setting a new password — never treated as a normal sign-in.
      if (isPasswordRecoveryRef.current) return
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
      const resolvedRole = await fetchRole(session.user.id)
      if (cancelled) return
      setRole(resolvedRole)
      setAuthError(resolvedRole ? null : he.authProfileErrorMessage)
      setStatus('signed-in')
    }
    resolveSessionRef.current = resolveSession

    supabase.auth
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Lovable Cloud auth pass — a password-reset link lands here as a
      // real (temporary) session with this specific event, not a normal
      // sign-in. Flagging it lets the email/password UI show a "set new
      // password" form instead of treating this like an ordinary
      // authenticated session.
      if (event === 'PASSWORD_RECOVERY') {
        isPasswordRecoveryRef.current = true
        setIsPasswordRecovery(true)
        return
      }

      // A session transition (sign-in, sign-out, token refresh) always
      // re-enters 'loading' first, so ProtectedAdminRoute/AuthButton never
      // render stale role/account info from the previous session while the
      // new one resolves.
      setStatus('loading')
      resolveSession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    if (!supabase) return
    setAuthError(null)
    // The full current URL (not just the origin), so signing in from /world
    // or /dashboard returns there after the OAuth round trip, instead of
    // always landing back on the root path.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
    if (error) setAuthError(error.message)
  }

  // Email/password sign-up. Deliberately returns its own scoped result
  // rather than writing into `authError` (the ambient session-lifecycle
  // error) — a form needs an error tied to the submit it just made, not a
  // value that could already be stale by the time it renders.
  async function signUpWithEmail(email: string, password: string): Promise<EmailAuthResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: translateAuthError(error) }
    // Supabase's own signal for "confirm your email before you get a
    // session": a real user row came back, but no session did.
    return { error: null, needsEmailConfirmation: data.user !== null && data.session === null }
  }

  async function signInWithEmail(email: string, password: string): Promise<EmailAuthResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? translateAuthError(error) : null }
  }

  // Sends a reset-password email; never touches the current session (a
  // signed-out guest and a signed-in user can both request one). The
  // redirect brings the user back to wherever they asked from — same
  // convention as signInWithGoogle's own redirectTo — where onAuthStateChange
  // above picks up the resulting PASSWORD_RECOVERY session.
  async function resetPasswordForEmail(email: string): Promise<EmailAuthResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href })
    return { error: error ? translateAuthError(error) : null }
  }

  // Only meaningful during the temporary recovery session established by
  // the PASSWORD_RECOVERY event above. On success, the recovery session
  // becomes a normal one — resolved immediately via the same logic the
  // mount-time getSession() call uses, so the UI transitions straight to
  // signed-in instead of waiting for some unrelated future auth event.
  async function updatePassword(newPassword: string): Promise<EmailAuthResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: translateAuthError(error) }
    isPasswordRecoveryRef.current = false
    setIsPasswordRecovery(false)
    setStatus('loading')
    const { data } = await supabase.auth.getSession()
    await resolveSessionRef.current(data.session)
    return { error: null }
  }

  async function signOut() {
    if (!supabase) return
    setAuthError(null)
    // Only ever clears Supabase's own session — never touches
    // meridian:save/localStorage (see src/persistence).
    const { error } = await supabase.auth.signOut()
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
    configured: isSupabaseConfigured,
    isPasswordRecovery,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
