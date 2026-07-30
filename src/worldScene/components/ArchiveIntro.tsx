import type { CSSProperties } from 'react'
import { getMissionDisplayText, type MissionConfig } from '../../missions'
import { getNpcDisplayText, type NpcConfig } from '../../npcs'
import { he } from '../../i18n'
import { getNpcAppearance } from '../logic/npcAppearance'
import styles from './ArchiveIntro.module.css'

export interface ArchiveIntroProps {
  mission: MissionConfig
  /** The mission's companion NPC, when one is unlocked for it — omitted (not just empty) when none applies. */
  npc?: NpcConfig
  /** The companion's own authored greeting/context line, reused as-is when present. */
  npcMessage?: string
}

/**
 * A short "quest briefing" beat shown before the reused MissionPanel/
 * SqlEditorPanel — the Archive's narrative framing (Meridian 1.2): who's
 * asking, one sentence of why, and what the quest is called, before the
 * player ever sees an input box. Reuses data GameApp already computes
 * (the companion NPC + its authored dialogue) rather than authoring new
 * content, so this stays a presentation-only addition.
 */
export function ArchiveIntro({ mission, npc, npcMessage }: ArchiveIntroProps) {
  const missionText = getMissionDisplayText(mission)
  const npcText = npc ? getNpcDisplayText(npc) : undefined
  // mission.prompt's first line is always the scene-setting sentence — the
  // instruction itself follows after a line break (see e.g. firstContact.ts)
  // — a safe, content-free heuristic that needs no new authored field.
  const fallbackNarrative = missionText.prompt.split('\n')[0]
  const narrative = npcMessage?.trim() || fallbackNarrative

  return (
    <div className={styles.intro} data-testid="archive-intro">
      {npc && npcText && (
        <div className={styles.npcRow} data-testid="archive-intro-npc">
          <span
            className={styles.npcDot}
            aria-hidden="true"
            style={{ '--npc-glow': getNpcAppearance(npc.id).glowColor } as CSSProperties}
          />
          <span className={styles.npcName}>{npc.name}</span>
          <span className={styles.npcRole}>{npcText.role}</span>
        </div>
      )}
      <p className={styles.eyebrow}>{he.archiveIntroEyebrow}</p>
      <p className={styles.narrative} data-testid="archive-intro-narrative">
        {narrative}
      </p>
      <h3 className={styles.questTitle} data-testid="archive-intro-quest-title">
        {missionText.title}
      </h3>
    </div>
  )
}
