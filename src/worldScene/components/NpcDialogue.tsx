import { useEffect } from 'react'
import { he } from '../../i18n'
import type { NpcConfig } from '../../npcs'
import { getNpcDialogue } from '../logic/dialogueContent'
import { getNpcDialogueState, type NpcDialogueContext } from '../logic/npcDialogueState'
import styles from './NpcDialogue.module.css'

export interface NpcDialogueProps {
  npc: NpcConfig
  context: NpcDialogueContext
  onOpen?: () => void
  onClose: () => void
}

/**
 * A simple authored dialogue box: the NPC's name plus a short Hebrew
 * greeting (and, for some NPCs/states, a mission-context line). Static
 * content only — no branching, no generated text, no LLM. Which lines show
 * depends on the NPC's current dialogue state (npcDialogueState.ts),
 * derived from existing Progression/Unlock/World State data the caller
 * assembles into context. onOpen (optional) fires once, on mount — the
 * caller uses it for a presentation-only audio cue (Batch 5); this
 * component has no idea audio exists.
 */
export function NpcDialogue({ npc, context, onOpen, onClose }: NpcDialogueProps) {
  const dialogueState = getNpcDialogueState(npc, context)
  const dialogue = getNpcDialogue(npc.id, dialogueState)

  useEffect(() => {
    onOpen?.()
    // Intentionally fires once per mount only — a new NpcDialogue instance
    // is created each time a conversation opens (see WorldScene3D/App.tsx).
  }, [])

  return (
    <div className={styles.dialogue} data-testid="npc-dialogue" data-npc-id={npc.id} role="dialog">
      <h3 className={styles.name}>{npc.name}</h3>
      <p className={styles.greeting}>{dialogue.greeting}</p>
      {dialogue.missionContext && (
        <p className={styles.missionContext} data-testid="npc-dialogue-mission-context">
          {dialogue.missionContext}
        </p>
      )}
      <button type="button" className={styles.closeButton} data-testid="npc-dialogue-close-button" onClick={onClose}>
        {he.dialogueCloseButton}
      </button>
    </div>
  )
}
