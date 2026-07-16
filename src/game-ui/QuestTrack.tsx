import type { ReactNode } from 'react'
import { he } from '../i18n'
import { Pill } from '../platform/ui'
import styles from './QuestTrack.module.css'

export interface QuestTrackProps {
  /** The mission chain (a MissionSelect element), rendered inside the frame. */
  children: ReactNode
}

/**
 * Frames the campaign mission chain as a "quest track" panel. Presentation
 * only — the actual selectable missions are the reused MissionSelect passed
 * as children (its testids / accessible names are unchanged).
 */
export function QuestTrack({ children }: QuestTrackProps) {
  return (
    <section className={styles.panel} aria-label={he.questTrackTitle}>
      <header className={styles.head}>
        <Pill>{he.questTrackTitle}</Pill>
      </header>
      {children}
    </section>
  )
}
