import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './AuthButton.module.css'
import { useAuth } from './useAuth'

/**
 * Google sign-in / sign-out chrome. Renders nothing when Supabase isn't
 * configured (no VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) — guest play
 * never shows a broken sign-in control.
 */
export function AuthButton() {
  const { status, user, authError, configured, signInWithGoogle, signOut } = useAuth()

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
