import type { ReactNode } from 'react'
import { he } from '../i18n'
import { Pill } from '../platform/ui'
import styles from './MissionJourney.module.css'

export interface MissionJourneyProps {
  /** MissionSelect — the list of selectable missions. */
  select: ReactNode
  /** MissionPanel — the active mission's detail. */
  panel: ReactNode
  /** SqlEditorPanel — the SQL console for the active mission. */
  console: ReactNode
}

/**
 * Frames the existing mission components as one "mission journey" section
 * without altering any of them. The active mission (panel + console) is the
 * visually dominant primary column; the selectable list is supporting.
 * Pure layout wrapper — the children are the unchanged tested components.
 */
export function MissionJourney({ select, panel, console }: MissionJourneyProps) {
  return (
    <section className={styles.section} aria-label={he.missionsTitle}>
      <header className={styles.header}>
        <Pill>{he.missionsTitle}</Pill>
      </header>

      <div className={styles.grid}>
        <div className={styles.primary}>
          {panel}
          {console}
        </div>
        <div className={styles.aside}>{select}</div>
      </div>
    </section>
  )
}
