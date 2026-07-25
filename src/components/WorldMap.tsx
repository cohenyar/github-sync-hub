import { Fragment } from 'react'
import { getDistrictStatus } from '../worldState'
import type { DistrictState, WorldState } from '../worldState/types'
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

/**
 * The canonical learning-journey order — matches the order the Hub World
 * feature already uses for the same four districts (see
 * worldScene/logic/destinationContent.ts's DESTINATIONS array): Core hosts
 * the on-ramp mission, then North/South/East follow as course worlds. Not a
 * new ordering invented for this layout — reusing the one order the app
 * already treats as authoritative elsewhere.
 */
const DISTRICT_ORDER: readonly string[] = ['core', 'north', 'south', 'east']

/** Known ids sort into the canonical order; any other id (e.g. a test fixture) keeps its original relative position, after every known id. */
function sortByLearningJourney(districts: readonly DistrictState[]): readonly DistrictState[] {
  return [...districts].sort((a, b) => {
    const indexA = DISTRICT_ORDER.indexOf(a.id)
    const indexB = DISTRICT_ORDER.indexOf(b.id)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

export function WorldMap({ world, unlockedNpcIds = [], onSelectNpc, activeDistrictId }: WorldMapProps) {
  const districts = sortByLearningJourney(Object.values(world.districts))

  return (
    <div className={styles.mapViewport} data-turn={world.turn}>
      <div className={styles.map}>
        {districts.map((district, index) => (
          <Fragment key={district.id}>
            {index > 0 && <span className={styles.connector} aria-hidden="true" />}
            <div
              className={styles.node}
              data-active={district.id === activeDistrictId ? 'true' : undefined}
              data-status={getDistrictStatus(district)}
            >
              <District district={district} unlockedNpcIds={unlockedNpcIds} onSelectNpc={onSelectNpc} />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
