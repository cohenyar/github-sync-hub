import { he } from '../i18n'
import type { MissionConfig } from '../missions'
import type { ContentStatus } from '../unlocks'
import styles from './MissionSelect.module.css'

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
 * The campaign missions as a connected "quest chain" of status nodes.
 * Purely presentational: GameApp owns which mission is active and how status
 * is computed (via the Unlock Engine) — this only renders options and reports
 * a click.
 *
 * Contract preserved verbatim for tests: each option is a <button> carrying
 * data-testid="mission-option-{id}", data-status, aria-current, the same
 * disabled rule, and the exact accessible name "{title} ({Status})". The node
 * number is a CSS counter (::before), NOT DOM text, so it never enters the
 * button's accessible name.
 */
export function MissionSelect({ options, activeMissionId, onSelect }: MissionSelectProps) {
  return (
    <section className={styles.track} aria-label={he.missionSelectLabel}>
      <ul className={styles.list}>
        {options.map(({ mission, status }) => {
          const isActive = mission.id === activeMissionId
          return (
            <li key={mission.id} className={styles.item}>
              <button
                type="button"
                className={isActive ? `${styles.node} ${styles.nodeActive}` : styles.node}
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
