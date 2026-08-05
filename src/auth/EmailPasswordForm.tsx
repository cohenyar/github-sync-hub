import { useState, type FormEvent } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './EmailPasswordForm.module.css'
import { useAuth } from './useAuth'

type Mode = 'sign-in' | 'sign-up'

export interface EmailPasswordFormProps {
  /** Called once a sign-in succeeds (never called for a sign-up pending email confirmation). */
  onSuccess?: () => void
}

/**
 * Compact email/password form shared by AuthButton's dropdown and
 * WelcomeScreen — both mount this instead of duplicating the form, so
 * there's exactly one email/password UI surface for the corner-HUD entry
 * points (the full /auth page is the other, separate entry point for
 * everything else, including "forgot password").
 */
export function EmailPasswordForm({ onSuccess }: EmailPasswordFormProps) {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    const result =
      mode === 'sign-in' ? await auth.signInWithEmail(email.trim(), password) : await auth.signUpWithEmail(email.trim(), password)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true)
      return
    }
    onSuccess?.()
  }

  if (needsConfirmation) {
    return (
      <div className={styles.form} data-testid="email-password-check-email">
        <p className={styles.title}>{he.checkYourEmailTitle}</p>
        <p className={styles.body}>{he.checkYourEmailBody}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-testid="email-password-form">
      <label className={styles.field}>
        {he.emailLabel}
        <input
          className={styles.input}
          type="email"
          required
          autoComplete="email"
          data-testid="email-password-email-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        {he.passwordLabel}
        <input
          className={styles.input}
          type="password"
          required
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          data-testid="email-password-password-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <Button variant="primary" size="sm" type="submit" disabled={busy} data-testid="email-password-submit-button">
        {mode === 'sign-in' ? he.emailSignInSubmitCta : he.emailSignUpSubmitCta}
      </Button>

      {error && (
        <span role="alert" className={styles.error} data-testid="email-password-error">
          {error}
        </span>
      )}

      <button
        type="button"
        className={styles.switchModeLink}
        data-testid="email-password-switch-mode-button"
        onClick={() => {
          setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))
          setError(null)
        }}
      >
        {mode === 'sign-in' ? he.switchToSignUpPrompt : he.switchToSignInPrompt}
      </button>
    </form>
  )
}
