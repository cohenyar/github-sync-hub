export type Role = 'student' | 'admin'

export interface AuthUser {
  id: string
  email: string | null
  avatarUrl: string | null
  /** From the OAuth provider's profile (e.g. Google's full name). Null when unavailable — callers fall back to email. */
  displayName: string | null
}

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

/** Result shape shared by every email/password action — never throws at the call site. */
export interface AuthActionResult {
  /** A ready-to-display Hebrew message, or null on success. Scoped to the call that returned it — never written into AuthContextValue.authError, which is for the ambient session-lifecycle error only. */
  error: string | null
  /** True when the action succeeded but needs the user to check their inbox (sign-up confirmation, reset link). */
  needsEmailConfirmation?: boolean
}

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  role: Role | null
  isAdmin: boolean
  authError: string | null
  /** False when the Cloud env vars are absent — sign-in is hidden, guest play is unaffected. */
  configured: boolean
  /**
   * True specifically when the Cloud env vars ARE present but the
   * generated client still failed to load after every retry (see
   * supabaseClient.loadCloudClient) — distinct from the plain `!configured`
   * case (env vars genuinely absent), so the UI can show an accurate
   * message instead of always blaming missing configuration. Optional so
   * every existing test fixture/mock that builds an AuthContextValue
   * literal keeps compiling unchanged; undefined is treated as false
   * (the historical, still-correct default) by every consumer.
   */
  cloudClientLoadFailed?: boolean
  /**
   * Local-only flag: the player explicitly chose to keep playing without a
   * Cloud account. Never affects the local Meridian save — it only tells the
   * UI to stop nudging toward sign-in.
   */
  isGuest: boolean
  continueAsGuest: () => void
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthActionResult>
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>
  /** Sends a password-reset email; does not touch the current session. */
  sendPasswordReset: (email: string) => Promise<AuthActionResult>
  updatePassword: (password: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}
