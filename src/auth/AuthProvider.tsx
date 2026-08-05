import type { Session } from '@supabase/supabase-js'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { he } from '../i18n'
import { lovable } from '../integrations/lovable/index'
import { translateAuthError } from './authErrorMessages'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { AuthActionResult, AuthContextValue, AuthStatus, AuthUser, Role } from './types'

const VALID_ROLES: readonly Role[] = ['student', 'admin']

/**
 * Local-only marker for "I chose to play without an account". Deliberately
 * separate from `meridian:save` (game progress) and from the Cloud account —
 * clearing it never touches progress, and signing out never clears progress.
 */
const GUEST_KEY = 'meridian:guest'

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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let cancelled = false

    async function resolveSession(session: Session | null) {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // A session transition (sign-in, sign-out, token refresh, or a
      // password-recovery link's temporary session) always re-enters
      // 'loading' first, so ProtectedAdminRoute/AuthButton never render
      // stale role/account info from the previous session while the new
      // one resolves.
      setStatus('loading')
      resolveSession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
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

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) return
    setAuthError(null)
    clearGuest()
    // Managed Google sign-in through Lovable Cloud. The redirect target is
    // the full current URL, so signing in from /world or /dashboard returns
    // there after the OAuth round trip.
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.href })
    if (result.error) setAuthError(result.error.message ?? he.authUnavailableMessage)
  }

  // Email/password sign-up. Deliberately returns its own scoped result
  // rather than writing into `authError` (the ambient session-lifecycle
  // error) — a form needs an error tied to the submit it just made, not a
  // value that could already be stale by the time it renders.
  async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { data, error } = await supabase.auth.signUp({
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
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: translateAuthError(error) }
    return { error: null, needsEmailConfirmation: true }
  }

  async function updatePassword(password: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: translateAuthError(error) }
    return { error: null }
  }

  async function signOut() {
    if (!supabase) return
    setAuthError(null)
    // Only ever clears the Cloud session — never touches meridian:save or
    // any other local progress (see src/persistence).
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
