import { he } from '../../i18n'
import styles from './QuestChip.module.css'

export interface QuestChipProps {
  title: string
  /**
   * Playtest fix pass (issue 2) — the chip previously showed only the
   * mission's title ("First Contact"), never what to actually do. This
   * surfaces the mission's own goalHe, the same actionable objective text
   * MissionPanel already shows, so the plaza HUD always has a concrete
   * next step visible, not just a name.
   */
  goal?: string
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
export function QuestChip({ title, goal, currentMissionIndex, totalMissions }: QuestChipProps) {
  return (
    <div className={styles.chip} data-testid="quest-chip">
      <span className={styles.title}>{title}</span>
      {goal && <span className={styles.goal} data-testid="quest-chip-goal">{goal}</span>}
      {typeof currentMissionIndex === 'number' && typeof totalMissions === 'number' && (
        <span className={styles.progress} data-testid="quest-chip-progress">
          {he.missionLabel} {currentMissionIndex} {he.ofLabel} {totalMissions}
        </span>
      )}
    </div>
  )
}
