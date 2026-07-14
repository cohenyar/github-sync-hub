import { he } from '../i18n'
import { PageShell } from './PageShell'
import styles from './pages.module.css'

/**
 * Generic "coming soon" body for every route that only needs a routing
 * skeleton right now — Dashboard/Courses/Tutor/Progress/Profile all reuse
 * this until each gets its own real design in a later phase.
 */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <PageShell>
      <div className={styles.content}>
        <h1>{title}</h1>
        <p>{he.placeholderComingSoon}</p>
      </div>
    </PageShell>
  )
}
