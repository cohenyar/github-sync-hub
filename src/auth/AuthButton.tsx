import { useEffect, useRef, useState } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './AuthButton.module.css'
import { useOptionalAuth } from './useAuth'

/**
 * Google sign-in / account chrome. Renders nothing when Supabase isn't
 * configured (no VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) — guest play
 * never shows a broken sign-in control. Also renders nothing if dropped in
 * somewhere with no AuthProvider ancestor (useOptionalAuth, not the
 * strict/throwing useAuth) — this is what makes it safe to reuse in both
 * PageShell's nav and GameControlBar without every caller (including the
 * many existing tests that render <GameApp/> directly) needing to wrap in
 * a provider.
 *
 * Meridian 1.2: signed-in state is now a trigger (avatar + name) that opens
 * a small account menu holding Sign out — a corner HUD profile control,
 * not a persistently-open row of text and buttons.
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
    <span className={styles.wrap}>
      {/* Plain anchor, not <Link>: AuthButton is dropped into chrome that
          isn't always inside a Router (GameControlBar in existing tests). */}
      <a className={styles.authLink} href="/auth" data-testid="auth-page-link">
        {he.authGoToSignIn}
      </a>
      <Button variant="primary" size="sm" data-testid="google-sign-in-button" onClick={() => void signInWithGoogle()}>
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
