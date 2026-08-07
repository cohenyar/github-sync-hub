import { he } from '../../i18n'
import type { ContentStatus } from '../../unlocks'
import type { Interactable } from '../logic/proximity'
import styles from './InteractionPrompt.module.css'

export interface DestinationPromptInfo {
  name: string
  status: ContentStatus
  progress: { completed: number; total: number }
  /** Playtest fix pass (issue 4) — the blocking mission's titleHe, only set while status === 'locked'. */
  lockRequirementMissionTitle?: string
}

export interface InteractionPromptProps {
  interactable: Interactable | null
  destinationInfoById: Readonly<Record<string, DestinationPromptInfo>>
  /** Batch 3A.3 — resolves an npc-kind interactable's id to its display name. Optional so every existing caller/test without it is unaffected (falls back to the plain talk prompt). */
  npcNameById?: Readonly<Record<string, string>>
  /**
   * Game Feel pass — renamed from onTalk: a visible, clickable alternative
   * to pressing E/Enter, for mouse and touch users, now for BOTH an
   * npc-kind interactable (unchanged — still the `npc-talk-button`) and an
   * available (non-locked) district-kind one (new — `destination-enter-
   * button`). A touch player has no keyboard equivalent for E/Enter at
   * all, so districts need a button just as much as NPCs do. Never shown
   * for a locked destination — there is nothing useful to do yet.
   */
  onInteract?: () => void
}

/**
 * A plain DOM overlay, not 3D-anchored. NPCs get the talk prompt (now
 * naming who, when known) plus a clickable Talk button; a district-kind
 * interactable is now always a destination (the Hub or a course world —
 * see destinationContent.ts) and shows its Hebrew name and derived
 * progress, or a distinct locked variant if the player can't enter it yet —
 * so "can I go there" is answered before any interaction is attempted,
 * never as a silent failure afterward.
 */
export function InteractionPrompt({ interactable, destinationInfoById, npcNameById, onInteract }: InteractionPromptProps) {
  if (!interactable) return null

  if (interactable.kind === 'npc') {
    const name = npcNameById?.[interactable.id]
    const label = name ? `${name} — ${he.talkPrompt}` : he.talkPrompt
    return (
      <div className={styles.prompt} data-testid="interaction-prompt" data-interactable-id={interactable.id}>
        <span>{label}</span>
        {onInteract && (
          <button type="button" className={styles.talkButton} data-testid="npc-talk-button" onClick={onInteract}>
            {he.talkButtonLabel}
          </button>
        )}
      </div>
    )
  }

  const info = destinationInfoById[interactable.id]
  if (!info) {
    return (
      <div className={styles.prompt} data-testid="interaction-prompt" data-interactable-id={interactable.id}>
        <span>{he.enterPrompt}</span>
        {onInteract && (
          <button type="button" className={styles.enterButton} data-testid="destination-enter-button" onClick={onInteract}>
            {he.enterButtonLabel}
          </button>
        )}
      </div>
    )
  }

  const isLocked = info.status === 'locked'
  const label = isLocked
    ? info.lockRequirementMissionTitle
      ? `${info.name} — ${he.destinationLockRequirementPrefix}${info.lockRequirementMissionTitle}`
      : `${info.name} — ${he.destinationLockedLabel}`
    : `${he.enterDestinationPrefix}${info.name} (${info.progress.completed}/${info.progress.total})`
  // Playtest fix pass (issue 2) — the Records Hub gets a specific action
  // verb instead of the generic Enter; every other destination keeps the
  // generic one. This also fixes a copy bug: this button previously always
  // read he.talkButtonLabel ("שיחה"/Talk), which is an NPC-only label that
  // never belonged on a district-kind interactable.
  const enterActionLabel = interactable.id === 'core' ? he.activateRecordsHubButtonLabel : he.enterButtonLabel

  return (
    <div
      className={styles.prompt}
      data-testid="interaction-prompt"
      data-interactable-id={interactable.id}
      data-locked={isLocked}
    >
      <span>{label}</span>
      {onInteract && !isLocked && (
        <button type="button" className={styles.enterButton} data-testid="destination-enter-button" onClick={onInteract}>
          {enterActionLabel}
        </button>
      )}
    </div>
  )
}
