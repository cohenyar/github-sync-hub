import type { Session } from '@supabase/supabase-js'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { he } from '../i18n'
import { lovable } from '../integrations/lovable/index'
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
 * admin access" here — none of them can ever resolve to 'admin'. It also
 * fails OPEN for startup: a hanging profiles request resolves to null after
 * 6s instead of leaving the session stuck in 'loading' forever.
 */
async function fetchRole(userId: string): Promise<Role | null> {
  if (!supabase) return null
  const query: Promise<Role | null> = Promise.resolve(
    supabase.from('profiles').select('role').eq('id', userId).single(),
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

    // Timeout protection: if Cloud never answers, the app must not sit in
    // 'loading' forever — it resolves to signed-out (guest still works) with
    // a non-blocking warning. Re-armed on EVERY transition into 'loading'
    // (initial load and every later auth event), never just the first one.
    let timeoutId = 0
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
      // A session transition (sign-in, sign-out, token refresh) always
      // re-enters 'loading' first, so ProtectedAdminRoute/AuthButton never
      // render stale role/account info from the previous session while the
      // new one resolves.
      setStatus('loading')
      armLoadingTimeout()
      resolveSession(session)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
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

  async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    setAuthError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: displayName ? { full_name: displayName } : undefined,
      },
    })
    if (error) return { error: error.message }
    clearGuest()
    // With email confirmation on (the default), signUp returns no session:
    // the user is NOT signed in until they click the link in their inbox.
    return { error: null, needsEmailConfirmation: !data.session }
  }

  async function signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    clearGuest()
    return { error: null }
  }

  async function sendPasswordReset(email: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return { error: null, needsEmailConfirmation: true }
  }

  async function updatePassword(password: string): Promise<AuthActionResult> {
    if (!supabase) return { error: he.authUnavailableMessage }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    if (!supabase) return
    // Only ever clears the Cloud session — never touches meridian:save or
    // any other local progress (see src/persistence).
    await supabase.auth.signOut()
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
