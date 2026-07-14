import { describe, expect, it } from 'vitest'
import { npcRegistry } from '../../npcs'
import { getNpcContent } from './npcContentAdapter'

describe('getNpcContent', () => {
  it('projects every registered NPC', () => {
    expect(getNpcContent()).toEqual(
      npcRegistry.map((npc) => ({
        id: npc.id,
        name: npc.name,
        districtId: npc.districtId,
        role: npc.role,
        description: npc.description,
      })),
    )
  })
})
