import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './AppErrorFallback.module.css'

/**
 * Whole-app crash fallback for App.tsx's Sentry.ErrorBoundary — distinct
 * from and one level shallower than WorldScene3D's own WebglErrorBoundary,
 * which only handles WebGL context loss. A reload is the only recovery this
 * offers: there is no partial-app state worth trying to preserve past an
 * error this boundary actually catches.
 */
export function AppErrorFallback() {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.message}>{he.appErrorFallbackMessage}</p>
      <Button variant="primary" size="md" onClick={() => window.location.reload()}>
        {he.reloadPageCta}
      </Button>
    </div>
  )
}
