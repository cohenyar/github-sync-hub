import type { GameEvent } from '../../events'

/** One logged narration line — what Odin said, which event caused it, and when. */
export interface OdinNarrationEntry {
  id: string
  message: string
  event: GameEvent
  sequence: number
}
