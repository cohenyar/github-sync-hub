import { Link } from 'react-router-dom'
import { he } from '../i18n'
import { useOptionalAuth } from '../auth/useAuth'
import styles from './LandingAuth.module.css'

/**
 * Welcome-screen auth surface.
 *
 * The landing redesign dropped every auth control, so `/` exposed no way to
 * sign in, sign up, or even see whether you were a guest. This restores that
 * surface without adding a second auth client: it consumes the one
 * AuthProvider context (optional, so the landing still renders if it is ever
 * mounted outside a provider).
 *
 * Availability is never silently hidden: when Cloud auth is unavailable we
 * show a short non-blocking message and keep guest play working.
 */
export function LandingAuth() {
  const auth = useOptionalAuth()
  if (!auth) return null

  const { status, user, configured, isGuest, authError, continueAsGuest, signInWithGoogle, signOut } = auth

  if (status === 'loading') {
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.note} data-testid="auth-loading">
          {he.authLoadingMessage}
        </span>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.note} role="status" data-testid="auth-unavailable">
          {he.authUnavailableMessage}
        </span>
        <button type="button" className={styles.ghost} data-testid="continue-as-guest-button" onClick={continueAsGuest}>
          {he.authContinueAsGuest}
        </button>
        {isGuest && <span className={styles.badge}>{he.authGuestBadge}</span>}
      </div>
    )
  }

  if (status === 'signed-in') {
    const label = user?.displayName || user?.email || ''
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.badge} data-testid="auth-signed-in-badge">
          {he.authSignedInAs}
          {label}
        </span>
        <button type="button" className={styles.ghost} data-testid="sign-out-button" onClick={() => void signOut()}>
          {he.signOut}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.wrap} data-testid="landing-auth">
      <button
        type="button"
        className={styles.google}
        data-testid="google-sign-in-button"
        onClick={() => void signInWithGoogle()}
      >
        <span aria-hidden>G</span>
        {he.signInWithGoogle}
      </button>
      <Link to="/auth" className={styles.ghost} data-testid="auth-page-link">
        {he.authGoToSignIn}
      </Link>
      <button type="button" className={styles.ghost} data-testid="continue-as-guest-button" onClick={continueAsGuest}>
        {he.authContinueAsGuest}
      </button>
      {isGuest && <span className={styles.badge} data-testid="auth-guest-badge">{he.authGuestBadge}</span>}
      {authError && (
        <div className={styles.errorBox} role="alert" data-testid="auth-error">
          <span>{authError}</span>
          <button type="button" className={styles.retry} onClick={() => void signInWithGoogle()}>
            {he.authRetryCta}
          </button>
        </div>
      )}
    </div>
  )
}
