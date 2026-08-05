import { useEffect, useRef, useState } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './AuthButton.module.css'
import { EmailPasswordForm } from './EmailPasswordForm'
import { useOptionalAuth } from './useAuth'

/**
 * Google sign-in / account chrome. Also renders nothing if dropped in
 * somewhere with no AuthProvider ancestor (useOptionalAuth, not the
 * strict/throwing useAuth) — this is what makes it safe to reuse in both
 * PageShell's nav and GameControlBar without every caller (including the
 * many existing tests that render <GameApp/> directly) needing to wrap in
 * a provider.
 *
 * Meridian 1.2: signed-in state is now a trigger (avatar + name) that opens
 * a small account menu holding Sign out — a corner HUD profile control,
 * not a persistently-open row of text and buttons.
 *
 * Bug-fix pass: an unconfigured Lovable Cloud project (no VITE_SUPABASE_URL/
 * VITE_SUPABASE_PUBLISHABLE_KEY — the actual state of this environment
 * today) used to make this component return null outright, so a real player would
 * see no sign-in control and no explanation at all — indistinguishable
 * from a broken build. It now renders a small, honest "not configured"
 * notice instead, and every signed-out state (configured or not) carries a
 * persistent Guest badge, since "playing without an account" is the same
 * state either way.
 */
export function AuthButton() {
  const auth = useOptionalAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  if (!auth) return null
  const { status, user, authError, configured, signInWithGoogle, signOut } = auth

  if (!configured) {
    return (
      <span className={styles.wrap}>
        <span className={styles.guestBadge} data-testid="guest-mode-badge">
          {he.guestModeLabel}
        </span>
        <span
          className={styles.notConfiguredNotice}
          data-testid="auth-not-configured"
          title={he.authNotConfiguredMessage}
        >
          {he.authNotConfiguredShortLabel}
        </span>
      </span>
    )
  }

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
    const label = user?.displayName || user?.email || ''
    const initial = label.trim().charAt(0).toUpperCase()

    return (
      <div className={styles.wrap} ref={containerRef}>
        <button
          type="button"
          className={styles.trigger}
          data-testid="auth-account"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label={he.accountMenuLabel}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {user?.avatarUrl ? (
            <img className={styles.avatar} src={user.avatarUrl} alt="" />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {initial}
            </span>
          )}
          <span className={styles.name}>{label}</span>
        </button>

        {isMenuOpen && (
          <div className={styles.menu} role="menu" aria-label={he.accountMenuLabel}>
            <div className={styles.menuHeader}>
              <span className={styles.menuName}>{label}</span>
              {user?.email && user.email !== label && <span className={styles.menuEmail}>{user.email}</span>}
            </div>
            {authError && (
              <span role="alert" className={styles.error} data-testid="auth-error">
                {authError}
              </span>
            )}
            <p className={styles.signOutNote} data-testid="sign-out-progress-note">
              {he.signOutProgressNote}
            </p>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              data-testid="sign-out-button"
              onClick={() => {
                setIsMenuOpen(false)
                void signOut()
              }}
            >
              {he.signOut}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <span className={styles.wrap} ref={containerRef}>
      <span className={styles.guestBadge} data-testid="guest-mode-badge">
        {he.guestModeLabel}
      </span>
      <Button variant="primary" size="md" data-testid="google-sign-in-button" onClick={() => void signInWithGoogle()}>
        {he.signInWithGoogle}
      </Button>
      {/* Plain anchor, not <Link>: AuthButton is dropped into chrome that
          isn't always inside a Router (GameControlBar in existing tests). */}
      <a className={styles.authLink} href="/auth" data-testid="auth-page-link">
        {he.authGoToSignIn}
      </a>
      <button
        type="button"
        className={styles.emailToggle}
        data-testid="email-auth-toggle-button"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {he.emailAuthToggleLabel}
      </button>
      {authError && (
        <span role="alert" className={styles.error} data-testid="auth-error">
          {authError}
        </span>
      )}
      {isMenuOpen && (
        <div className={styles.menu} role="menu" aria-label={he.emailAuthToggleLabel}>
          <EmailPasswordForm onSuccess={() => setIsMenuOpen(false)} />
        </div>
      )}
    </span>
  )
}
