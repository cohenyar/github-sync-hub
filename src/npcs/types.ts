import type { UnlockCondition } from '../unlocks/types'
import type { EntityId } from '../types/engine'

/**
 * Pure content/data: no dialogue, no behavior, no AI. districtId links an
 * NPC to one of WorldState's real district ids so it can be placed on the
 * world map. unlockConditions is optional and evaluated by the existing
 * Unlock Engine (see unlocks/services/defaultUnlockRules.ts) — omitting it
 * means the NPC is always visible, matching how ungated missions default
 * to "always" unlocked.
 */
export interface NpcConfig {
  id: string
  name: string
  districtId: EntityId
  role: string
  description: string
  unlockConditions?: readonly UnlockCondition[]
  /** Optional Hebrew display text. Falls back to the English field above when absent (see npcDisplayText.ts). */
  roleHe?: string
  descriptionHe?: string
}
