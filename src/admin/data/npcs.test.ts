import { describe, expect, it } from 'vitest'
import { npcRegistry } from '../../npcs'
import { getNpcItems } from './npcs'

describe('getNpcItems', () => {
  it('reflects the real NPC registry', () => {
    expect(getNpcItems().map((item) => item.id)).toEqual(npcRegistry.map((npc) => npc.id))
  })

  it('includes locked NPCs — Admin shows total content, not just what the player has unlocked', () => {
    const gatedNpc = npcRegistry.find((npc) => npc.unlockConditions && npc.unlockConditions.length > 0)
    expect(gatedNpc).toBeDefined()
    expect(getNpcItems().map((item) => item.id)).toContain(gatedNpc?.id)
  })
})
