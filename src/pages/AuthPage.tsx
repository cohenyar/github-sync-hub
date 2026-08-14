import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { he } from '../i18n'
import { GoogleIcon } from '../auth/GoogleIcon'
import styles from './AuthPage.module.css'

type Mode = 'sign-in' | 'sign-up' | 'forgot'
type Screen = 'form' | 'confirm-sent' | 'forgot-sent'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Minimum sign-up password policy, stated to the user before they submit. */
function passwordPolicyError(password: string): string | null {
  if (password.length < 6) return he.authPasswordTooShort
  if (!/[A-Za-z\u0590-\u05FF]/.test(password) || !/\d/.test(password)) return he.authErrorWeakPassword
  return null
}

/**
 * The single sign-in / sign-up / forgot-password surface. It owns no auth
 * state of its own — every action goes through the one AuthProvider.
 * Sign In and Sign Up are deliberately distinct experiences (own title,
 * own fields, own copy), and sign-up ends on a dedicated confirmation
 * screen rather than leaving the form on screen.
 *
 * A visitor can always leave without an account ("continue as guest"):
 * local Meridian progress is never gated behind a Cloud account, and
 * signing in never resets it.
 */
export function AuthPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [screen, setScreen] = useState<Screen>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (auth.status === 'signed-in') navigate('/dashboard', { replace: true })
  }, [auth.status, navigate])

  function switchMode(next: Mode) {
    setMode(next)
    setScreen('form')
    setError(null)
    setMessage(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(he.authErrorInvalidEmail)
      return
    }
    if (mode !== 'forgot' && !password) {
      setError(he.authMissingFields)
      return
    }
    if (mode === 'sign-up') {
      const policy = passwordPolicyError(password)
      if (policy) {
        setError(policy)
        return
      }
      if (password !== confirmPassword) {
        setError(he.authErrorPasswordsMismatch)
        return
      }
    }

    setBusy(true)
    const result =
      mode === 'sign-in'
        ? await auth.signInWithEmail(trimmedEmail, password)
        : mode === 'sign-up'
          ? await auth.signUpWithEmail(trimmedEmail, password, displayName.trim() || undefined)
          : await auth.sendPasswordReset(trimmedEmail)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (mode === 'forgot') {
      setScreen('forgot-sent')
      return
    }
    // Sign-up with email confirmation on: replace the form entirely, so the
    // user is never left staring at the registration fields.
    if (mode === 'sign-up' && result.needsEmailConfirmation) setScreen('confirm-sent')
  }

  async function handleResend() {
    if (!auth.resendConfirmationEmail) return
    setError(null)
    setMessage(null)
    setBusy(true)
    const result = await auth.resendConfirmationEmail(email.trim())
    setBusy(false)
    if (result.error) setError(result.error)
    else setMessage(he.authResendSent)
  }

  const googleButton = (
    <button
      type="button"
      className={styles.googleButton}
      data-testid="google-sign-in-button"
      onClick={() => void auth.signInWithGoogle()}
    >
      <GoogleIcon />
      {he.signInWithGoogle}
    </button>
  )

  const guestBlock = (
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
  )

  if (screen === 'confirm-sent') {
    return (
      <main className={styles.page} dir="rtl">
        <section className={styles.card} aria-labelledby="auth-title" data-testid="auth-confirmation-screen">
          <h1 className={styles.title} id="auth-title">
            {he.authConfirmSentTitle}
          </h1>
          <p className={styles.message} role="status">
            {he.authConfirmSentBody}
            <br />
            <strong>{email.trim()}</strong>
          </p>
          <p className={styles.guestNote}>{he.authConfirmSentHint}</p>
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
          <button
            type="button"
            className={styles.submit}
            data-testid="auth-go-to-sign-in"
            onClick={() => switchMode('sign-in')}
          >
            {he.authGoToSignInCta}
          </button>
          {auth.resendConfirmationEmail && (
            <button
              type="button"
              className={styles.linkButton}
              disabled={busy}
              data-testid="auth-resend-confirmation"
              onClick={() => void handleResend()}
            >
              {he.authResendConfirmation}
            </button>
          )}
          <button
            type="button"
            className={styles.linkButton}
            data-testid="auth-change-email"
            onClick={() => switchMode('sign-up')}
          >
            {he.authChangeEmailCta}
          </button>
          {guestBlock}
        </section>
      </main>
    )
  }

  if (screen === 'forgot-sent') {
    return (
      <main className={styles.page} dir="rtl">
        <section className={styles.card} aria-labelledby="auth-title" data-testid="auth-forgot-sent-screen">
          <h1 className={styles.title} id="auth-title">
            {he.authForgotSentTitle}
          </h1>
          <p className={styles.message} role="status" data-testid="auth-form-message">
            {he.authForgotSentBody}
            <br />
            <strong>{email.trim()}</strong>
          </p>
          <button
            type="button"
            className={styles.submit}
            data-testid="auth-go-to-sign-in"
            onClick={() => switchMode('sign-in')}
          >
            {he.authGoToSignInCta}
          </button>
          {guestBlock}
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.card} aria-labelledby="auth-title" data-testid="auth-page">
        <Link to="/" className={styles.brand} aria-label="Meridian" data-testid="auth-brand-link">
          <span aria-hidden className={styles.brandMark} />
          <span className={styles.brandName}>Meridian</span>
        </Link>
        <h1 className={styles.title} id="auth-title">
          {mode === 'forgot' ? he.authForgotTitle : mode === 'sign-up' ? he.authSignUpTitle : he.authSignInTitle}
        </h1>
        {mode !== 'forgot' && (
          <p className={styles.guestNote} data-testid="auth-subtitle">
            {mode === 'sign-up' ? he.authSignUpSubtitle : he.authSignInSubtitle}
          </p>
        )}

        {mode !== 'forgot' && (
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign-in'}
              className={`${styles.tab} ${mode === 'sign-in' ? styles.tabActive : ''}`}
              data-testid="auth-tab-sign-in"
              onClick={() => switchMode('sign-in')}
            >
              {he.authSignInTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign-up'}
              className={`${styles.tab} ${mode === 'sign-up' ? styles.tabActive : ''}`}
              data-testid="auth-tab-sign-up"
              onClick={() => switchMode('sign-up')}
            >
              {he.authSignUpTab}
            </button>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
              inputMode="email"
              autoComplete="email"
              data-testid="auth-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== 'forgot' && (
            <>
              <label className={styles.field}>
                {he.authPasswordLabel}
                <input
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  data-testid="auth-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.linkButton}
                data-testid="auth-toggle-password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? he.authHidePassword : he.authShowPassword}
              </button>
            </>
          )}

          {mode === 'sign-up' && (
            <>
              <label className={styles.field}>
                {he.authConfirmPasswordLabel}
                <input
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  data-testid="auth-confirm-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              <p className={styles.guestNote} data-testid="auth-password-requirements">
                {he.authPasswordRequirements}
              </p>
            </>
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
          <button type="button" className={styles.linkButton} onClick={() => switchMode('sign-in')}>
            {he.authBackToSignIn}
          </button>
        ) : mode === 'sign-in' ? (
          <>
            <button
              type="button"
              className={styles.linkButton}
              data-testid="auth-forgot-link"
              onClick={() => switchMode('forgot')}
            >
              {he.authForgotPassword}
            </button>
            <button
              type="button"
              className={styles.linkButton}
              data-testid="auth-switch-to-sign-up"
              onClick={() => switchMode('sign-up')}
            >
              {he.authNoAccountPrompt}
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.linkButton}
            data-testid="auth-switch-to-sign-in"
            onClick={() => switchMode('sign-in')}
          >
            {he.authHaveAccountPrompt}
          </button>
        )}

        <div className={styles.divider}>{he.authOrDivider}</div>

        {googleButton}

        {/* Google failures are browser-side far more often than not (blocked
            popup, third-party cookies), so keep the guidance actionable. */}
        {auth.authError && (
          <div className={styles.error} role="alert" data-testid="google-auth-error">
            <span>{auth.authError}</span>
          </div>
        )}

        {guestBlock}
      </section>
    </main>
  )
}
