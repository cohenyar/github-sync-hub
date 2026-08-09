import { Link, useNavigate } from 'react-router-dom'
import { he } from '../i18n'
import { useOptionalAuth } from '../auth/useAuth'
import { GoogleIcon } from '../auth/GoogleIcon'
import styles from './LandingAuth.module.css'

/**
 * Welcome-screen auth surface — the one place the visitor decides how to
 * enter Meridian. It consumes the single AuthProvider context (optional, so
 * the landing still renders if it is ever mounted outside a provider) and
 * never creates a client of its own.
 *
 * Four explicit availability states, in this order (order matters — the
 * pending window must never render as "unavailable"):
 *   B. resolving        → neutral "connecting" note
 *   A. env missing      → honest "not configured here" + Guest
 *   D. client failed    → "failed to load" + Retry + Guest
 *   C. ready            → Google + Email + Guest (three distinct actions)
 */
export function LandingAuth() {
  const auth = useOptionalAuth()
  const navigate = useNavigate()
  if (!auth) return null

  const {
    status,
    user,
    configured,
    isGuest,
    authError,
    continueAsGuest,
    signInWithGoogle,
    signOut,
    cloudClientPending,
    cloudClientLoadFailed,
    retryCloudConnection,
  } = auth

  const guestButton = (
    <button
      type="button"
      className={styles.ghost}
      data-testid="continue-as-guest-button"
      onClick={() => {
        continueAsGuest()
        navigate('/world')
      }}
    >
      {he.authContinueAsGuest}
    </button>
  )
  const emailLink = (
    <Link to="/auth" className={styles.ghost} data-testid="auth-page-link">
      {he.authGoToSignIn}
    </Link>
  )
  const guestBadge = isGuest ? (
    <span className={styles.badge} data-testid="auth-guest-badge">
      {he.authGuestBadge}
    </span>
  ) : null

  // B — still resolving.
  if (status === 'loading' || cloudClientPending) {
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.note} data-testid="auth-loading">
          {he.authConnectingMessage}
        </span>
      </div>
    )
  }

  // D — client confirmed failed (env present, load failed): recoverable.
  if (!configured && cloudClientLoadFailed) {
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.note} data-testid="auth-cloud-failed">
          {he.authCloudFailedInline}
        </span>
        {retryCloudConnection && (
          <button
            type="button"
            className={styles.ghost}
            data-testid="auth-retry-button"
            onClick={() => retryCloudConnection()}
          >
            {he.authRetryShortCta}
          </button>
        )}
        {emailLink}
        {guestButton}
        {guestBadge}
      </div>
    )
  }

  // A — env genuinely missing.
  if (!configured) {
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        <span className={styles.note} data-testid="auth-env-missing">
          {he.authEnvMissingInline}
        </span>
        {guestButton}
        {guestBadge}
      </div>
    )
  }

  if (status === 'signed-in') {
    const label = user?.displayName || user?.email || ''
    return (
      <div className={styles.wrap} data-testid="landing-auth">
        {user?.avatarUrl && <img className={styles.avatar} src={user.avatarUrl} alt="" width={28} height={28} />}
        <span className={styles.badge} data-testid="auth-signed-in-badge">
          {he.authSignedInAs}
          {label}
        </span>
        <button type="button" className={styles.ghost} data-testid="sign-out-button" onClick={() => void signOut()}>
          {he.signOut}
        </button>
        {authError && (
          <div className={styles.errorBox} role="alert" data-testid="auth-error">
            <span>{authError}</span>
          </div>
        )}
      </div>
    )
  }

  // C — ready and signed out: three clearly different choices.
  return (
    <div className={styles.wrap} data-testid="landing-auth">
      <button
        type="button"
        className={styles.google}
        data-testid="google-sign-in-button"
        onClick={() => void signInWithGoogle()}
      >
        <GoogleIcon />
        {he.signInWithGoogle}
      </button>

      {emailLink}
      {guestButton}
      {guestBadge}
      {authError && (
        <div className={styles.errorBox} role="alert" data-testid="auth-error">
          <span>{authError}</span>
        </div>
      )}
    </div>
  )
}
