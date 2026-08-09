import { useState, type FormEvent } from 'react'
import { GoogleIcon } from '../../auth/GoogleIcon'
import styles from './SocialAuthCard.module.css'

export interface SocialAuthCardProps {
  title?: string
  subtitle?: string
  busy?: boolean
  onGoogle?: () => void
  onGithub?: () => void
  onLinkedin?: () => void
  onSubmit?: (credentials: { email: string; password: string }) => void
  onSignUp?: () => void
  className?: string
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.2c-3.34.72-4.04-1.42-4.04-1.42-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.21.09 1.85 1.25 1.85 1.25 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.25 8.25h4.5V24h-4.5V8.25ZM8.5 8.25h4.31v2.15h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V24h-4.5v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.16V24H8.5V8.25Z" />
    </svg>
  )
}

/**
 * Social auth card — visual port of the shadcn/Tailwind reference onto
 * Meridian's CSS-module + design-token stack (no Tailwind in this project).
 * Purely presentational: every action is delegated through props, so it
 * never touches AuthProvider, the Cloud client, or gameplay state.
 */
export default function SocialAuthCard({
  title = 'התחברות ל‑Meridian',
  subtitle = 'בחרו דרך התחברות כדי להמשיך במסע',
  busy = false,
  onGoogle,
  onGithub,
  onLinkedin,
  onSubmit,
  onSignUp,
  className,
}: SocialAuthCardProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.socials}>
        <button type="button" className={styles.social} onClick={onGoogle} disabled={busy}>
          <GoogleIcon />
          המשך עם Google
        </button>
        <button type="button" className={styles.social} onClick={onGithub} disabled={busy}>
          <GithubIcon />
          המשך עם GitHub
        </button>
        <button type="button" className={styles.social} onClick={onLinkedin} disabled={busy}>
          <LinkedinIcon />
          המשך עם LinkedIn
        </button>
      </div>

      <div className={styles.divider}>או</div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="social-auth-email">
            אימייל
          </label>
          <input
            id="social-auth-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="social-auth-password">
            סיסמה
          </label>
          <input
            id="social-auth-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.submit} disabled={busy}>
          כניסה
        </button>
      </form>

      <p className={styles.footer}>
        אין לכם חשבון?{' '}
        <button type="button" className={styles.link} onClick={onSignUp}>
          הרשמה
        </button>
      </p>
    </div>
  )
}
