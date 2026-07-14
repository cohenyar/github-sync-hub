import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { npcRegistry } from '../../npcs'
import { initialDistricts } from '../../worldState'
import { defaultUnlockRules } from './defaultUnlockRules'

function ruleFor(target: { type: string; id: string }) {
  return defaultUnlockRules.find((rule) => rule.target.type === target.type && rule.target.id === target.id)
}

describe('defaultUnlockRules', () => {
  it('has exactly one rule per registered mission', () => {
    for (const mission of missionRegistry) {
      expect(ruleFor({ type: 'mission', id: mission.id })).toBeDefined()
    }
    expect(defaultUnlockRules.filter((rule) => rule.target.type === 'mission')).toHaveLength(missionRegistry.length)
  })

  it('the first mission is always unlocked', () => {
    expect(ruleFor({ type: 'mission', id: 'first-contact' })).toEqual({
      target: { type: 'mission', id: 'first-contact' },
      conditions: [{ kind: 'always' }],
    })
  })

  it('the second mission is gated behind completing the first', () => {
    expect(ruleFor({ type: 'mission', id: 'district-ties' })).toEqual({
      target: { type: 'mission', id: 'district-ties' },
      conditions: [{ kind: 'missionCompleted', missionId: 'first-contact' }],
    })
  })

  it('the third mission is gated behind completing the second', () => {
    expect(ruleFor({ type: 'mission', id: 'south-stability' })).toEqual({
      target: { type: 'mission', id: 'south-stability' },
      conditions: [{ kind: 'missionCompleted', missionId: 'district-ties' }],
    })
  })

  it('the fourth mission is gated behind completing the third', () => {
    expect(ruleFor({ type: 'mission', id: 'full-signal' })).toEqual({
      target: { type: 'mission', id: 'full-signal' },
      conditions: [{ kind: 'missionCompleted', missionId: 'south-stability' }],
    })
  })

  it('the fifth mission is gated behind completing the fourth', () => {
    expect(ruleFor({ type: 'mission', id: 'linked-records' })).toEqual({
      target: { type: 'mission', id: 'linked-records' },
      conditions: [{ kind: 'missionCompleted', missionId: 'full-signal' }],
    })
  })

  it('the finale mission is gated behind completing the fifth', () => {
    expect(ruleFor({ type: 'mission', id: 'priority-signal' })).toEqual({
      target: { type: 'mission', id: 'priority-signal' },
      conditions: [{ kind: 'missionCompleted', missionId: 'linked-records' }],
    })
  })

  it('has one always-unlocked rule per district', () => {
    for (const district of initialDistricts) {
      expect(defaultUnlockRules).toContainEqual({
        target: { type: 'district', id: district.id },
        conditions: [{ kind: 'always' }],
      })
    }
  })

  it('has exactly one rule per registered NPC', () => {
    for (const npc of npcRegistry) {
      expect(ruleFor({ type: 'npc', id: npc.id })).toBeDefined()
    }
    expect(defaultUnlockRules.filter((rule) => rule.target.type === 'npc')).toHaveLength(npcRegistry.length)
  })

  it('an NPC with no unlockConditions is always unlocked', () => {
    expect(ruleFor({ type: 'npc', id: 'archivist-mera' })).toEqual({
      target: { type: 'npc', id: 'archivist-mera' },
      conditions: [{ kind: 'always' }],
    })
  })

  it("an NPC's own unlockConditions are used as its rule", () => {
    expect(ruleFor({ type: 'npc', id: 'east-broker' })).toEqual({
      target: { type: 'npc', id: 'east-broker' },
      conditions: [{ kind: 'missionCompleted', missionId: 'first-contact' }],
    })
  })

  it('an NPC can be gated behind a later mission in the chain', () => {
    expect(ruleFor({ type: 'npc', id: 'south-engineer' })).toEqual({
      target: { type: 'npc', id: 'south-engineer' },
      conditions: [{ kind: 'missionCompleted', missionId: 'south-stability' }],
    })
  })

  it('an NPC can be gated behind overall progression percentage', () => {
    expect(ruleFor({ type: 'npc', id: 'north-analyst' })).toEqual({
      target: { type: 'npc', id: 'north-analyst' },
      conditions: [{ kind: 'progressionPercentage', minPercentage: 40 }],
    })
  })

  it('an NPC can be gated behind campaign completion', () => {
    expect(ruleFor({ type: 'npc', id: 'city-voice' })).toEqual({
      target: { type: 'npc', id: 'city-voice' },
      conditions: [{ kind: 'campaignCompleted', campaignId: 'meridian-campaign' }],
    })
  })
})
