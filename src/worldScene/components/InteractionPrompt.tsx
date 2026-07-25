import { he } from '../../i18n'
import type { ContentStatus } from '../../unlocks'
import type { Interactable } from '../logic/proximity'
import styles from './InteractionPrompt.module.css'

export interface DestinationPromptInfo {
  name: string
  status: ContentStatus
  progress: { completed: number; total: number }
}

export interface InteractionPromptProps {
  interactable: Interactable | null
  destinationInfoById: Readonly<Record<string, DestinationPromptInfo>>
  /** Batch 3A.3 — resolves an npc-kind interactable's id to its display name. Optional so every existing caller/test without it is unaffected (falls back to the plain talk prompt). */
  npcNameById?: Readonly<Record<string, string>>
  /** Batch 3A.3 — a visible, clickable alternative to pressing E/Enter, for mouse and touch users. Only rendered for an npc-kind interactable when provided. */
  onTalk?: () => void
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
export function InteractionPrompt({ interactable, destinationInfoById, npcNameById, onTalk }: InteractionPromptProps) {
  if (!interactable) return null

  if (interactable.kind === 'npc') {
    const name = npcNameById?.[interactable.id]
    const label = name ? `${name} — ${he.talkPrompt}` : he.talkPrompt
    return (
      <div className={styles.prompt} data-testid="interaction-prompt" data-interactable-id={interactable.id}>
        <span>{label}</span>
        {onTalk && (
          <button type="button" className={styles.talkButton} data-testid="npc-talk-button" onClick={onTalk}>
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
        {he.enterPrompt}
      </div>
    )
  }

  const isLocked = info.status === 'locked'
  const label = isLocked
    ? `${info.name} — ${he.destinationLockedLabel}`
    : `${he.enterDestinationPrefix}${info.name} (${info.progress.completed}/${info.progress.total})`

  return (
    <div
      className={styles.prompt}
      data-testid="interaction-prompt"
      data-interactable-id={interactable.id}
      data-locked={isLocked}
    >
      {label}
    </div>
  )
}
