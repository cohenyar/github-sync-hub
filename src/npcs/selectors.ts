import type { EntityId } from '../types/engine'
import { npcRegistry } from './registry'
import type { NpcConfig } from './types'

export function getAllNpcs(): readonly NpcConfig[] {
  return npcRegistry
}

export function getNpcById(id: string): NpcConfig | undefined {
  return npcRegistry.find((npc) => npc.id === id)
}

export function getNpcsByDistrict(districtId: EntityId): readonly NpcConfig[] {
  return npcRegistry.filter((npc) => npc.districtId === districtId)
}
