import { Link } from 'react-router-dom'
import { he } from '../i18n'
import { getLearningPathHref, LEARNING_PATHS } from '../learning'
import { PageShell } from './PageShell'
import styles from './Dashboard.module.css'

/**
 * Purely decorative filler subjects — not real content, not navigable, no
 * engine involvement. Same pattern as LandingPage's own local FEATURES/STATS
 * arrays: presentational-only data that isn't a reusable Hebrew-string-
 * dictionary concern.
 */
const COMING_LATER_SUBJECTS = [{ label: 'מדעים' }, { label: 'היסטוריה' }] as const

/**
 * Phase 3A.1: replaces the placeholder with the real subject-selection
 * entry point. Each active card links to /world carrying its path id as a
 * query param (see learning/learningPathConfig.ts) — the smallest state
 * needed to eventually determine which building/NPC/lesson the world should
 * highlight, without a new store or context. Nothing in /world consumes it
 * yet; that lands with the buildings/NPCs in later batches.
 */
export function Dashboard() {
  return (
    <PageShell>
      <div className={styles.page}>
        <h1 className={styles.heading}>{he.dashboardHeading}</h1>
        <div className={styles.grid}>
          {Object.values(LEARNING_PATHS).map((path) => (
            <Link
              key={path.id}
              to={getLearningPathHref(path.id)}
              className={styles.card}
              data-testid={`subject-card-${path.id}`}
            >
              <h2 className={styles.cardTitle}>{path.subjectLabel}</h2>
              <p className={styles.cardTagline}>{path.tagline}</p>
              <span className={styles.cardCta}>{he.startLearningCta}</span>
            </Link>
          ))}
          {COMING_LATER_SUBJECTS.map((subject) => (
            <div
              key={subject.label}
              className={`${styles.card} ${styles.cardDisabled}`}
              aria-disabled="true"
              data-testid="subject-card-coming-later"
            >
              <h2 className={styles.cardTitle}>{subject.label}</h2>
              <span className={styles.comingBadge}>{he.comingLaterBadge}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
