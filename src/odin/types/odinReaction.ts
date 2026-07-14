import type { GameEvent } from '../../events'
import type { OdinReactionTrigger } from './odinReactionTrigger'

export interface OdinReaction {
  id: string
  trigger: OdinReactionTrigger
  message: string | ((event: GameEvent) => string)
}
