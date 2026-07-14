import { getNpcsByDistrict } from '../npcs'
import { getDistrictStatus, type DistrictStatus } from '../worldState'
import type { DistrictState } from '../worldState/types'
import styles from './District.module.css'
import { toDistrictVisualState } from './visualState'

const DISTRICT_STATUS_LABEL: Record<DistrictStatus, string> = {
  thriving: 'Thriving',
  stable: 'Stable',
  unstable: 'Unstable',
}

export interface DistrictProps {
  district: DistrictState
  /** NPC ids unlocked for the current player. Locked by default, matching the Unlock Engine's own default. */
  unlockedNpcIds?: readonly string[]
  /** Called with an NPC's id when its marker is clicked. Omitted (e.g. in tests) simply makes markers inert. */
  onSelectNpc?: (npcId: string) => void
}

export function District({ district, unlockedNpcIds = [], onSelectNpc }: DistrictProps) {
  const visual = toDistrictVisualState(district)
  const status = getDistrictStatus(district)
  const npcs = getNpcsByDistrict(district.id).filter((npc) => unlockedNpcIds.includes(npc.id))

  return (
    <div className={styles.district} data-district-id={visual.id} style={{ opacity: 0.3 + visual.intensity * 0.7 }}>
      <span className={styles.label}>{visual.id}</span>
      <span className={styles.status}>{DISTRICT_STATUS_LABEL[status]}</span>
      {npcs.length > 0 && (
        <ul className={styles.npcList} aria-label={`NPCs in ${visual.id}`}>
          {npcs.map((npc) => (
            <li key={npc.id} className={styles.npcMarker}>
              <button
                type="button"
                className={styles.npcButton}
                data-npc-id={npc.id}
                title={`${npc.name} — ${npc.role}`}
                onClick={() => onSelectNpc?.(npc.id)}
              >
                {npc.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
