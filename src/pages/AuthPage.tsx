import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { he } from '../i18n'
import styles from './AuthPage.module.css'

type Mode = 'sign-in' | 'sign-up' | 'forgot'

/**
 * The single sign-in / sign-up / forgot-password surface. It owns no auth
 * state of its own — every action goes through the one AuthProvider.
 * A visitor can always leave without an account ("continue as guest"):
 * local Meridian progress is never gated behind a Cloud account.
 */
export function AuthPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (auth.status === 'signed-in') navigate('/dashboard', { replace: true })
  }, [auth.status, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (mode !== 'forgot' && (!email.trim() || !password)) {
      setError(he.authMissingFields)
      return
    }
    if (mode === 'sign-up' && password.length < 6) {
      setError(he.authPasswordTooShort)
      return
    }

    setBusy(true)
    const result =
      mode === 'sign-in'
        ? await auth.signInWithEmail(email.trim(), password)
        : mode === 'sign-up'
          ? await auth.signUpWithEmail(email.trim(), password, displayName.trim() || undefined)
          : await auth.sendPasswordReset(email.trim())
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsEmailConfirmation) setMessage(he.authCheckEmailMessage)
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.card} aria-labelledby="auth-title" data-testid="auth-page">
        <h1 className={styles.title} id="auth-title">
          {mode === 'forgot' ? he.authForgotTitle : he.authPageTitle}
        </h1>

        {mode !== 'forgot' && (
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign-in'}
              className={`${styles.tab} ${mode === 'sign-in' ? styles.tabActive : ''}`}
              data-testid="auth-tab-sign-in"
              onClick={() => setMode('sign-in')}
            >
              {he.authSignInTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign-up'}
              className={`${styles.tab} ${mode === 'sign-up' ? styles.tabActive : ''}`}
              data-testid="auth-tab-sign-up"
              onClick={() => setMode('sign-up')}
            >
              {he.authSignUpTab}
            </button>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'sign-up' && (
            <label className={styles.field}>
              {he.authNameLabel}
              <input
                className={styles.input}
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}

          <label className={styles.field}>
            {he.authEmailLabel}
            <input
              className={styles.input}
              type="email"
              required
              autoComplete="email"
              data-testid="auth-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== 'forgot' && (
            <label className={styles.field}>
              {he.authPasswordLabel}
              <input
                className={styles.input}
                type="password"
                required
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                data-testid="auth-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          <button className={styles.submit} type="submit" disabled={busy} data-testid="auth-submit-button">
            {mode === 'sign-in' ? he.authSignInAction : mode === 'sign-up' ? he.authSignUpAction : he.authForgotAction}
          </button>
        </form>

        {error && (
          <p className={styles.error} role="alert" data-testid="auth-form-error">
            {error}
          </p>
        )}
        {message && (
          <p className={styles.message} role="status" data-testid="auth-form-message">
            {message}
          </p>
        )}

        {mode === 'forgot' ? (
          <button type="button" className={styles.linkButton} onClick={() => setMode('sign-in')}>
            {he.authBackToSignIn}
          </button>
        ) : (
          <button
            type="button"
            className={styles.linkButton}
            data-testid="auth-forgot-link"
            onClick={() => {
              setMode('forgot')
              setError(null)
              setMessage(null)
            }}
          >
            {he.authForgotPassword}
          </button>
        )}

        <div className={styles.divider}>{he.authOrDivider}</div>

        <button
          type="button"
          className={styles.googleButton}
          data-testid="google-sign-in-button"
          onClick={() => void auth.signInWithGoogle()}
        >
          {he.signInWithGoogle}
        </button>

        {/* Google failures are browser-side far more often than not (blocked
            popup, third-party cookies) — show the specific fix, plus a retry
            that doesn't require finding the button again. */}
        {auth.authError && (
          <div className={styles.error} role="alert" data-testid="google-auth-error">
            <span>{auth.authError}</span>
            <button type="button" className={styles.linkButton} onClick={() => void auth.signInWithGoogle()}>
              {he.authRetryCta}
            </button>
          </div>
        )}

        <div className={styles.guest}>
          <Link
            className={styles.linkButton}
            to="/world"
            data-testid="continue-as-guest-link"
            onClick={() => auth.continueAsGuest()}
          >
            {he.authContinueAsGuest}
          </Link>
          <p className={styles.guestNote}>{he.authGuestNote}</p>
        </div>
      </section>
    </main>
  )
}
