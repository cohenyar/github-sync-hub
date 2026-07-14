import { he } from '../i18n'
import type { MissionConfig } from '../missions'
import type { ContentStatus } from '../unlocks'
import styles from './Panel.module.css'

export interface MissionSelectOption {
  mission: MissionConfig
  status: ContentStatus
}

export interface MissionSelectProps {
  options: readonly MissionSelectOption[]
  activeMissionId: string
  onSelect: (missionId: string) => void
}

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  completed: 'Completed',
}

/**
 * Lets the player load any unlocked mission into the SQL console. Purely
 * presentational: App.tsx owns which mission is active and how status is
 * computed (via the existing Unlock Engine) — this only renders options
 * and reports a click.
 */
export function MissionSelect({ options, activeMissionId, onSelect }: MissionSelectProps) {
  return (
    <section className={styles.panel} aria-label={he.missionSelectLabel}>
      <h2 className={styles.title}>{he.missionsTitle}</h2>
      <ul className={styles.missionList}>
        {options.map(({ mission, status }) => {
          const isActive = mission.id === activeMissionId
          return (
            <li key={mission.id}>
              <button
                type="button"
                className={isActive ? `${styles.missionButton} ${styles.missionButtonActive}` : styles.missionButton}
                data-testid={`mission-option-${mission.id}`}
                data-status={status}
                disabled={status === 'locked' || isActive}
                aria-current={isActive}
                onClick={() => onSelect(mission.id)}
              >
                {mission.title} ({CONTENT_STATUS_LABEL[status]})
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
