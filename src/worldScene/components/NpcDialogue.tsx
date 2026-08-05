import { useEffect, useRef, type CSSProperties } from 'react'
import { he } from '../../i18n'
import { getLessonIdForNpc } from '../../learning'
import type { NpcConfig } from '../../npcs'
import { getFriendBonusLine, getNpcDialogue } from '../logic/dialogueContent'
import { getNpcDialogueState, type NpcDialogueContext } from '../logic/npcDialogueState'
import { getNpcFamiliarityLabel, type NpcFamiliarityTier } from '../../progression'
import { getPlayerAvatarPreset } from '../logic/playerAppearance'
import styles from './NpcDialogue.module.css'

export interface NpcDialogueProps {
  npc: NpcConfig
  context: NpcDialogueContext
  onOpen?: () => void
  onClose: () => void
  /** Batch 3A.3 — called with the NPC's linked lesson id (resolved from learningPathConfig) when "Start Lesson" is clicked. Never calls into the mission runtime itself; that stays the caller's decision. */
  onStartLesson?: (lessonId: string) => void
  /** Meridian 1.3 — Core Loop §06. Optional so every existing caller/fixture omitting it still type-checks; a missing tier simply shows no badge and no bonus line. */
  familiarityTier?: NpcFamiliarityTier
  /** Dialogue presentation pass — the local profile's chosen avatar preset id, shown as a small identity swatch on the opposite side of the header from the NPC's own. Optional/undefined simply omits it (e.g. no local profile yet). */
  playerAvatarId?: string
}

/**
 * A deterministic, decorative hue per NPC id — not tied to any stored
 * appearance data (NPCs have none), just a stable color so the same NPC's
 * dialogue always carries the same identity accent. Same hashing shape as
 * animationMotion.ts's hashIdToPhaseSeed, mapped to degrees instead of
 * radians; kept local since nothing else needs it.
 */
function npcIdToHue(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 360
  }
  return hash
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
export function NpcDialogue({
  npc,
  context,
  onOpen,
  onClose,
  onStartLesson,
  familiarityTier,
  playerAvatarId,
}: NpcDialogueProps) {
  const dialogueState = getNpcDialogueState(npc, context)
  const dialogue = getNpcDialogue(npc.id, dialogueState)
  const linkedLessonId = getLessonIdForNpc(npc.id)
  const friendBonusLine = familiarityTier === 'friend' ? getFriendBonusLine(npc.id) : undefined
  // Batch 3A.5 — the button stays offered either way (replay is supported
  // and idempotent); only its label changes.
  const isLessonCompleted = Boolean(linkedLessonId && (context.completedLessonIds ?? []).includes(linkedLessonId))
  const npcHue = npcIdToHue(npc.id)
  const playerPreset = getPlayerAvatarPreset(playerAvatarId)

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
      <div className={styles.header}>
        <span className={styles.npcIdentity}>
          <span
            className={styles.npcSwatch}
            data-testid="npc-dialogue-npc-swatch"
            aria-hidden="true"
            style={{ background: `hsl(${npcHue}, 55%, 55%)` }}
          />
          <h3 className={styles.name}>
            {npc.name}
            {familiarityTier && (
              <span className={styles.familiarityBadge} data-testid="npc-familiarity-badge">
                {getNpcFamiliarityLabel(familiarityTier)}
              </span>
            )}
          </h3>
        </span>
        <span
          className={styles.playerSwatch}
          data-testid="npc-dialogue-player-swatch"
          aria-hidden="true"
          style={{ '--swatch-body': playerPreset.bodyColor, '--swatch-accent': playerPreset.accentColor } as CSSProperties}
        />
      </div>
      <p className={styles.greeting}>{dialogue.greeting}</p>
      {dialogue.missionContext && (
        <p className={styles.missionContext} data-testid="npc-dialogue-mission-context">
          {dialogue.missionContext}
        </p>
      )}
      {friendBonusLine && (
        <p className={styles.friendBonusLine} data-testid="npc-dialogue-friend-bonus">
          {friendBonusLine}
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
