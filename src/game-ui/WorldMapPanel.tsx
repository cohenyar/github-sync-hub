import { WorldMap } from '../components'
import { NpcBioPanel } from '../components'
import { he } from '../i18n'
import type { NpcConfig } from '../npcs'
import { Pill } from '../platform/ui'
import type { WorldState } from '../worldState/types'
import styles from './WorldMapPanel.module.css'

export interface WorldMapPanelProps {
  world: WorldState
  unlockedNpcIds: readonly string[]
  activeDistrictId?: string
  onSelectNpc: (npcId: string) => void
  selectedNpc?: NpcConfig
  onCloseNpc: () => void
}

const LEGEND = [
  { key: 'active', label: he.mapActiveLabel },
  { key: 'thriving', label: he.districtThriving },
  { key: 'stable', label: he.districtStable },
  { key: 'unstable', label: he.districtUnstable },
] as const

/**
 * "Map board" framing around the existing radial WorldMap — title, a status
 * legend, and a cartographic grid texture so the map reads as a place, not a
 * row of cards. Pure presentation: WorldMap and NpcBioPanel are reused
 * unchanged (same data-district-id / data-npc-id / onSelectNpc contracts).
 */
export function WorldMapPanel({
  world,
  unlockedNpcIds,
  activeDistrictId,
  onSelectNpc,
  selectedNpc,
  onCloseNpc,
}: WorldMapPanelProps) {
  return (
    <section className={styles.panel} aria-label={he.worldMapTitle}>
      <header className={styles.head}>
        <Pill>{he.worldMapTitle}</Pill>
        <ul className={styles.legend}>
          {LEGEND.map((item) => (
            <li key={item.key} className={styles.legendItem} data-k={item.key}>
              <span aria-hidden className={styles.legendDot} />
              {item.label}
            </li>
          ))}
        </ul>
      </header>

      <div className={styles.board}>
        <WorldMap
          world={world}
          unlockedNpcIds={unlockedNpcIds}
          onSelectNpc={onSelectNpc}
          activeDistrictId={activeDistrictId}
        />
      </div>

      {selectedNpc && <NpcBioPanel npc={selectedNpc} onClose={onCloseNpc} />}
    </section>
  )
}
