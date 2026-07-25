import { useEffect, useRef } from 'react'
import { he } from '../../i18n'
import { getLessonIdForNpc } from '../../learning'
import type { NpcConfig } from '../../npcs'
import { getNpcDialogue } from '../logic/dialogueContent'
import { getNpcDialogueState, type NpcDialogueContext } from '../logic/npcDialogueState'
import styles from './NpcDialogue.module.css'

export interface NpcDialogueProps {
  npc: NpcConfig
  context: NpcDialogueContext
  onOpen?: () => void
  onClose: () => void
  /** Batch 3A.3 — called with the NPC's linked lesson id (resolved from learningPathConfig) when "Start Lesson" is clicked. Never calls into the mission runtime itself; that stays the caller's decision. */
  onStartLesson?: (lessonId: string) => void
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
export function NpcDialogue({ npc, context, onOpen, onClose, onStartLesson }: NpcDialogueProps) {
  const dialogueState = getNpcDialogueState(npc, context)
  const dialogue = getNpcDialogue(npc.id, dialogueState)
  const linkedLessonId = getLessonIdForNpc(npc.id)
  // Batch 3A.5 — the button stays offered either way (replay is supported
  // and idempotent); only its label changes.
  const isLessonCompleted = Boolean(linkedLessonId && (context.completedLessonIds ?? []).includes(linkedLessonId))

  useEffect(() => {
    onOpen?.()
    // Intentionally fires once per mount only — a new NpcDialogue instance
    // is created each time a conversation opens (see WorldScene3D/App.tsx).
  }, [])

  // Batch 3A.3: Escape closes the same way the close button does. Read
  // through a ref (mount-once effect) so a fresh onClose identity on every
  // render — GameApp passes an inline arrow function — never requires
  // tearing down and reattaching the listener, the same pattern
  // WorldScene3D's own keydown handling already uses.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
      {linkedLessonId && onStartLesson && (
        <button
          type="button"
          className={styles.startLessonButton}
          data-testid="npc-dialogue-start-lesson-button"
          onClick={() => onStartLesson(linkedLessonId)}
        >
          {isLessonCompleted ? he.replayLessonAction : he.startLessonAction}
        </button>
      )}
      <button type="button" className={styles.closeButton} data-testid="npc-dialogue-close-button" onClick={onClose}>
        {he.dialogueCloseButton}
      </button>
    </div>
  )
}
