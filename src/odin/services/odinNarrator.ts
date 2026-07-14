import type { GameEvent } from '../../events'
import type { OdinNarrationEntry, OdinReaction } from '../types'
import { matchReaction, resolveMessage } from './matchReaction'

export interface OdinNarratorState {
  history: readonly OdinNarrationEntry[]
}

export function createInitialOdinState(): OdinNarratorState {
  return { history: [] }
}

/** Pure reducer: applies one event, appending a narration entry only if a reaction matches. */
export function applyOdinEvent(
  state: OdinNarratorState,
  event: GameEvent,
  reactions: readonly OdinReaction[],
): OdinNarratorState {
  const reaction = matchReaction(reactions, event)
  if (!reaction) return state

  const sequence = state.history.length + 1
  const entry: OdinNarrationEntry = {
    id: `${reaction.id}-${sequence}`,
    message: resolveMessage(reaction, event),
    event,
    sequence,
  }

  return { history: [...state.history, entry] }
}
