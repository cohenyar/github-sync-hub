import { he } from '../../i18n'
import styles from './QuestChip.module.css'

export interface QuestChipProps {
  title: string
  currentMissionIndex?: number
  totalMissions?: number
}

/**
 * Meridian 1.2 — a small, always-on "what am I doing right now" readout for
 * the plaza, replacing the classic dashboard's full Quest Track panel for
 * players who never open it. Fed entirely from data GameApp already
 * computes every render (the active mission's title, the campaign summary)
 * — no new state, no new engine.
 */
export function QuestChip({ title, currentMissionIndex, totalMissions }: QuestChipProps) {
  return (
    <div className={styles.chip} data-testid="quest-chip">
      <span className={styles.title}>{title}</span>
      {typeof currentMissionIndex === 'number' && typeof totalMissions === 'number' && (
        <span className={styles.progress} data-testid="quest-chip-progress">
          {he.missionLabel} {currentMissionIndex} {he.ofLabel} {totalMissions}
        </span>
      )}
    </div>
  )
}
