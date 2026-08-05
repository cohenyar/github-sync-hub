export type Role = 'student' | 'admin'

export interface AuthUser {
  id: string
  email: string | null
  avatarUrl: string | null
  /** From the OAuth provider's profile (e.g. Google's full name). Null when unavailable — callers fall back to email. */
  displayName: string | null
}

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export interface EmailAuthResult {
  /** A ready-to-display Hebrew message, or null on success. Scoped to the form that called it — never written into AuthContextValue.authError, which is for the ambient session-lifecycle error only. */
  error: string | null
  /** True only for a sign-up whose session isn't live yet — Supabase's own signal (a user row with no session) that email confirmation is required before sign-in works. */
  needsEmailConfirmation?: boolean
}

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  role: Role | null
  isAdmin: boolean
  authError: string | null
  /** False when VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY are absent — sign-in shows a clear not-configured notice, guest play is unaffected. */
  configured: boolean
  /** Lovable Cloud auth pass — true from the moment a password-reset link is followed until updatePassword succeeds. The email/password UI shows a "set new password" form instead of the normal sign-in/sign-up form while this is true. */
  isPasswordRecovery: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<EmailAuthResult>
  signInWithEmail: (email: string, password: string) => Promise<EmailAuthResult>
  /** Sends a password-reset email; does not touch the current session. */
  resetPasswordForEmail: (email: string) => Promise<EmailAuthResult>
  /** Only meaningful while isPasswordRecovery is true — sets the new password on the temporary recovery session and clears isPasswordRecovery on success. */
  updatePassword: (newPassword: string) => Promise<EmailAuthResult>
  signOut: () => Promise<void>
}
