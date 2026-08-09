import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { he } from '../i18n'
import styles from './AuthPage.module.css'

/**
 * Landing target of the password-reset email. Public route by design: the
 * recovery link itself establishes the session, and this page only sets a
 * new password on it.
 */
export function ResetPasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (password.length < 6) {
      setError(he.authPasswordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(he.authErrorPasswordsMismatch)
      return
    }
    setBusy(true)
    const result = await auth.updatePassword(password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage(he.authResetSuccess)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.card} aria-labelledby="reset-title" data-testid="reset-password-page">
        <h1 className={styles.title} id="reset-title">
          {he.authResetTitle}
        </h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            {he.authNewPasswordLabel}
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              data-testid="reset-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            {he.authResetConfirmLabel}
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              data-testid="reset-confirm-password-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.linkButton}
            data-testid="reset-toggle-password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? he.authHidePassword : he.authShowPassword}
          </button>
          <p className={styles.guestNote}>{he.authPasswordRequirements}</p>
          <button className={styles.submit} type="submit" disabled={busy} data-testid="reset-password-submit">
            {he.authResetAction}
          </button>
        </form>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  )
}
