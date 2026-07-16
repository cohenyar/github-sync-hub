import type { CSSProperties } from 'react'
import { getDistrictStatus } from '../worldState'
import type { WorldState } from '../worldState/types'
import { District } from './District'
import styles from './WorldMap.module.css'

export interface WorldMapProps {
  world: WorldState
  unlockedNpcIds?: readonly string[]
  onSelectNpc?: (npcId: string) => void
  /**
   * Which district owns the currently-active mission, if any. Presentation
   * only — used to light the active node on the map. Derived by the caller
   * from the existing destination→mission map; WorldMap neither computes nor
   * changes gameplay from it.
   */
  activeDistrictId?: string
}

export function WorldMap({ world, unlockedNpcIds = [], onSelectNpc, activeDistrictId }: WorldMapProps) {
  const districts = Object.values(world.districts)

  return (
    <div className={styles.mapViewport} data-turn={world.turn}>
      {/* Decorative center anchor + radial spokes. Non-interactive; the map
          reads as a connected place rather than a row of cards. The spokes
          are generated per-district so this scales to any district count. */}
      <div className={styles.constellation} aria-hidden="true">
        <span className={styles.hub} />
        {districts.map((district, index) => (
          <span
            key={`spoke-${district.id}`}
            className={styles.spoke}
            style={{ '--slot-index': index, '--slot-total': districts.length } as CSSProperties}
          />
        ))}
      </div>

      <div className={styles.map}>
        {districts.map((district, index) => (
          <div
            key={district.id}
            className={styles.node}
            data-active={district.id === activeDistrictId ? 'true' : undefined}
            data-status={getDistrictStatus(district)}
            style={{ '--slot-index': index, '--slot-total': districts.length } as CSSProperties}
          >
            <District
              district={district}
              unlockedNpcIds={unlockedNpcIds}
              onSelectNpc={onSelectNpc}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
