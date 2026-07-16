import type { ReactNode } from 'react'
import { he } from '../i18n'
import { Pill } from '../platform/ui'
import styles from './MissionStage.module.css'

export interface MissionStageProps {
  /** DOM id so the header CTA can scroll here when there's no next step to advance to. */
  id: string
  /** MissionPanel — the active mission's brief (goal, prompt, badges, continue). */
  panel: ReactNode
  /** SqlEditorPanel — the console where the player acts. */
  terminal: ReactNode
}

/**
 * The focal "stage" for the active mission — the visual centre of gravity of
 * the dashboard, where the player actually works. Pure layout wrapper: the
 * children are the unchanged, gameplay-wired MissionPanel + SqlEditorPanel.
 */
export function MissionStage({ id, panel, terminal }: MissionStageProps) {
  return (
    <section id={id} className={styles.stage} aria-label={he.missionStageTitle}>
      <header className={styles.head}>
        <Pill tone="ai">{he.missionStageTitle}</Pill>
      </header>
      <div className={styles.body}>
        {panel}
        {terminal}
      </div>
    </section>
  )
}
