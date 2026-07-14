import { npcRegistry } from '../../npcs'
import type { GameNpcContent } from '../types/gameNpcContent'

export function getNpcContent(): GameNpcContent[] {
  return npcRegistry.map((npc) => ({
    id: npc.id,
    name: npc.name,
    districtId: npc.districtId,
    role: npc.role,
    description: npc.description,
  }))
}
