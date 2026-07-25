export type Role = 'student' | 'admin'

export interface AuthUser {
  id: string
  email: string | null
  avatarUrl: string | null
}

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  role: Role | null
  isAdmin: boolean
  authError: string | null
  /** False when VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are absent — sign-in is hidden, guest play is unaffected. */
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}
