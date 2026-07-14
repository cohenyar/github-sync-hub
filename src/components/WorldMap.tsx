import type { WorldState } from '../worldState/types'
import { District } from './District'
import styles from './WorldMap.module.css'

export interface WorldMapProps {
  world: WorldState
  unlockedNpcIds?: readonly string[]
  onSelectNpc?: (npcId: string) => void
}

export function WorldMap({ world, unlockedNpcIds = [], onSelectNpc }: WorldMapProps) {
  const districts = Object.values(world.districts)

  return (
    <div className={styles.map} data-turn={world.turn}>
      {districts.map((district) => (
        <District
          key={district.id}
          district={district}
          unlockedNpcIds={unlockedNpcIds}
          onSelectNpc={onSelectNpc}
        />
      ))}
    </div>
  )
}
