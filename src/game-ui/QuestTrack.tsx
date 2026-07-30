import type { ReactNode } from 'react'
import { he } from '../i18n'
import { Pill } from '../platform/ui'
import styles from './QuestTrack.module.css'

export interface QuestTrackProps {
  /** The mission chain (a MissionSelect element), rendered inside the frame. */
  children: ReactNode
  /**
   * Meridian 1.4 — Mission Hub canonicalization: Archive Pages (a second,
   * separate class of "completed objective," from lessons) previously had
   * no presence on the dashboard's own mission hub at all — only a floating
   * HUD button, reachable but not part of "all my objectives" in one place.
   * Both optional so any other caller/test renders exactly as before.
   */
  archivePageCount?: number
  onOpenArchivePages?: () => void
}

/**
 * Frames the campaign mission chain as a "quest track" panel. Presentation
 * only — the actual selectable missions are the reused MissionSelect passed
 * as children (its testids / accessible names are unchanged).
 */
export function QuestTrack({ children, archivePageCount, onOpenArchivePages }: QuestTrackProps) {
  return (
    <section className={styles.panel} aria-label={he.questTrackTitle}>
      <header className={styles.head}>
        <Pill>{he.questTrackTitle}</Pill>
      </header>
      {children}
      {onOpenArchivePages && (
        <button
          type="button"
          className={styles.archiveLink}
          data-testid="quest-track-archive-pages-button"
          onClick={onOpenArchivePages}
        >
          {he.archivePagesTitle}
          {typeof archivePageCount === 'number' && (
            <span className={styles.archiveCount}>{archivePageCount}</span>
          )}
        </button>
      )}
    </section>
  )
}
