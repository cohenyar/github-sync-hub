import type { NpcConfig } from './types'

export interface NpcDisplayText {
  role: string
  description: string
}

/** Hebrew display text for an NPC, falling back to the English field when absent. */
export function getNpcDisplayText(npc: NpcConfig): NpcDisplayText {
  return {
    role: npc.roleHe ?? npc.role,
    description: npc.descriptionHe ?? npc.description,
  }
}
