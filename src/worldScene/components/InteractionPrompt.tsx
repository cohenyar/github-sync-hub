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
}

/**
 * A plain DOM overlay, not 3D-anchored. NPCs keep the plain "talk" prompt;
 * a district-kind interactable is now always a destination (the Hub or a
 * course world — see destinationContent.ts) and shows its Hebrew name and
 * derived progress, or a distinct locked variant if the player can't enter
 * it yet — so "can I go there" is answered before any interaction is
 * attempted, never as a silent failure afterward.
 */
export function InteractionPrompt({ interactable, destinationInfoById }: InteractionPromptProps) {
  if (!interactable) return null

  if (interactable.kind === 'npc') {
    return (
      <div className={styles.prompt} data-testid="interaction-prompt" data-interactable-id={interactable.id}>
        {he.talkPrompt}
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
