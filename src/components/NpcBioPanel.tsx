import { he } from '../i18n'
import { getNpcDisplayText, type NpcConfig } from '../npcs'
import { getDistrictDisplayName } from './districtDisplayName'
import panelStyles from './Panel.module.css'
import styles from './NpcBioPanel.module.css'

export interface NpcBioPanelProps {
  npc: NpcConfig
  onClose: () => void
}

/** A read-only bio card for one NPC. No dialogue, no behavior — just the registry's own fields. */
export function NpcBioPanel({ npc, onClose }: NpcBioPanelProps) {
  const display = getNpcDisplayText(npc)

  return (
    <section
      className={`${panelStyles.panel} ${styles.overlay}`}
      aria-label={`${npc.name} — ${he.npcBioAriaSuffix}`}
      data-testid="npc-bio-panel"
      data-npc-id={npc.id}
    >
      <button
        type="button"
        className={styles.closeButton}
        data-testid="npc-bio-close-button"
        onClick={onClose}
        aria-label={he.close}
      >
        ×
      </button>
      <h2 className={panelStyles.title}>{he.npcPanelTitle}</h2>
      <h3 className={styles.name}>{npc.name}</h3>
      <p className={styles.role}>
        {display.role} · {getDistrictDisplayName(npc.districtId)}
      </p>
      <p className={styles.description}>{display.description}</p>
    </section>
  )
}
