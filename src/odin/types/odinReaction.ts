import type { GameEvent } from '../../events'
import type { OdinReactionTrigger } from './odinReactionTrigger'

export interface OdinReaction {
  id: string
  trigger: OdinReactionTrigger
  message: string | ((event: GameEvent) => string)
  /** Hebrew narration, preferred over `message` when present (see resolveMessage). */
  messageHe?: string | ((event: GameEvent) => string)
}
