import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './AuthButton.module.css'
import { useOptionalAuth } from './useAuth'

/**
 * Google sign-in / sign-out chrome. Renders nothing when Supabase isn't
 * configured (no VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) — guest play
 * never shows a broken sign-in control. Also renders nothing if dropped in
 * somewhere with no AuthProvider ancestor (useOptionalAuth, not the
 * strict/throwing useAuth) — this is what makes it safe to reuse in both
 * PageShell's nav and GameControlBar without every caller (including the
 * many existing tests that render <GameApp/> directly) needing to wrap in
 * a provider.
 */
export function AuthButton() {
  const auth = useOptionalAuth()
  if (!auth) return null
  const { status, user, authError, configured, signInWithGoogle, signOut } = auth

  if (!configured) return null

  if (status === 'loading') {
    return (
      <span className={styles.wrap}>
        <span className={styles.status} data-testid="auth-loading">
          {he.authLoadingMessage}
        </span>
      </span>
    )
  }

  if (status === 'signed-in') {
    return (
      <span className={styles.wrap}>
        <span className={styles.account} data-testid="auth-account">
          {user?.avatarUrl && <img className={styles.avatar} src={user.avatarUrl} alt="" />}
          {user?.email && !authError && <span className={styles.email}>{user.email}</span>}
          {authError && (
            <span role="alert" className={styles.error} data-testid="auth-error">
              {authError}
            </span>
          )}
        </span>
        <Button variant="ghost" size="sm" data-testid="sign-out-button" onClick={() => void signOut()}>
          {he.signOut}
        </Button>
      </span>
    )
  }

  return (
    <span className={styles.wrap}>
      <Button variant="secondary" size="sm" data-testid="google-sign-in-button" onClick={() => void signInWithGoogle()}>
        {he.signInWithGoogle}
      </Button>
      {authError && (
        <span role="alert" className={styles.error} data-testid="auth-error">
          {authError}
        </span>
      )}
    </span>
  )
}
