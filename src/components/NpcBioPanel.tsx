import { he } from '../i18n'
import type { NpcConfig } from '../npcs'
import panelStyles from './Panel.module.css'
import styles from './NpcBioPanel.module.css'

export interface NpcBioPanelProps {
  npc: NpcConfig
  onClose: () => void
}

/** A read-only bio card for one NPC. No dialogue, no behavior — just the registry's own fields. */
export function NpcBioPanel({ npc, onClose }: NpcBioPanelProps) {
  return (
    <section
      className={`${panelStyles.panel} ${styles.overlay}`}
      aria-label={`${npc.name} bio`}
      data-testid="npc-bio-panel"
      data-npc-id={npc.id}
    >
      <button
        type="button"
        className={styles.closeButton}
        data-testid="npc-bio-close-button"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <h2 className={panelStyles.title}>{he.npcPanelTitle}</h2>
      <h3 className={styles.name}>{npc.name}</h3>
      <p className={styles.role}>
        {npc.role} · {npc.districtId}
      </p>
      <p className={styles.description}>{npc.description}</p>
    </section>
  )
}
