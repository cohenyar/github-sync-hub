import type { Session } from '@supabase/supabase-js'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { he } from '../i18n'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { AuthContextValue, AuthStatus, AuthUser, Role } from './types'

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
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    avatarUrl: (session.user.user_metadata?.avatar_url as string | undefined) ?? null,
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Owns the entire Supabase session lifecycle. Deliberately independent of
 * the existing localStorage save system (src/persistence) — this never
 * reads or writes `meridian:save`; signing in or out only ever touches
 * Supabase's own session storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Skips 'loading' entirely when unconfigured, so a missing Supabase setup
  // resolves instantly to guest mode instead of hanging forever.
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(error.message)
  }

  async function signOut() {
    if (!supabase) return
    // Only ever clears Supabase's own session — never touches
    // meridian:save/localStorage (see src/persistence).
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    status,
    user,
    role,
    isAdmin: role === 'admin',
    authError,
    configured: isSupabaseConfigured,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
