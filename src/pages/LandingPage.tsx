import { Link } from 'react-router-dom'
import { he } from '../i18n'
import { PageShell } from './PageShell'
import styles from './pages.module.css'

/**
 * Routing-foundation placeholder only — the real landing page (brand,
 * copy, visual design) is a separate, later phase. This just proves the
 * route exists and gives a working way into the game.
 */
export function LandingPage() {
  return (
    <PageShell>
      <div className={styles.content}>
        <h1>Meridian</h1>
        <p>{he.landingTagline}</p>
        <Link to="/world" className={styles.ctaButton} data-testid="landing-enter-world-link">
          {he.landingEnterCta}
        </Link>
      </div>
    </PageShell>
  )
}
