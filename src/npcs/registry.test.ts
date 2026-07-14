import { afterEach, describe, expect, it } from 'vitest'
import { missionRegistry } from '../missions'
import { initialDistricts } from '../worldState'
import { addNpc, npcRegistry, removeNpc, updateNpc } from './registry'
import { getNpcById } from './selectors'
import type { NpcConfig } from './types'

const TEST_NPC_ID = 'test-crud-npc'

function testNpc(overrides: Partial<NpcConfig> = {}): NpcConfig {
  return {
    id: TEST_NPC_ID,
    name: 'Test NPC',
    districtId: 'core',
    role: 'Tester',
    description: 'A temporary NPC used only by tests.',
    ...overrides,
  }
}

afterEach(() => {
  try {
    removeNpc(TEST_NPC_ID)
  } catch {
    // Test NPC was already removed (or never added) — nothing to clean up.
  }
})

describe('npc registry', () => {
  it('has at least one NPC', () => {
    expect(npcRegistry.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = npcRegistry.map((npc) => npc.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places every NPC in a district that actually exists', () => {
    const districtIds = new Set(initialDistricts.map((district) => district.id))
    for (const npc of npcRegistry) {
      expect(districtIds.has(npc.districtId)).toBe(true)
    }
  })

  it('gives every NPC a non-empty name, role, and description', () => {
    for (const npc of npcRegistry) {
      expect(npc.name.length).toBeGreaterThan(0)
      expect(npc.role.length).toBeGreaterThan(0)
      expect(npc.description.length).toBeGreaterThan(0)
    }
  })

  it('has at least one NPC gated behind a real unlock condition', () => {
    expect(npcRegistry.some((npc) => npc.unlockConditions && npc.unlockConditions.length > 0)).toBe(true)
  })

  it('only references real mission ids in missionCompleted unlock conditions', () => {
    const missionIds = new Set(missionRegistry.map((mission) => mission.id))

    for (const npc of npcRegistry) {
      for (const condition of npc.unlockConditions ?? []) {
        if (condition.kind === 'missionCompleted') {
          expect(missionIds.has(condition.missionId)).toBe(true)
        }
      }
    }
  })

  it('gates north-analyst behind 40% overall progression, not a specific mission', () => {
    const northAnalyst = getNpcById('north-analyst')
    expect(northAnalyst?.districtId).toBe('north')
    expect(northAnalyst?.unlockConditions).toEqual([{ kind: 'progressionPercentage', minPercentage: 40 }])
  })
})

describe('addNpc', () => {
  it('adds a new NPC that is then findable by id', () => {
    addNpc(testNpc())
    expect(getNpcById(TEST_NPC_ID)).toEqual(testNpc())
  })

  it('rejects a duplicate id', () => {
    addNpc(testNpc())
    expect(() => addNpc(testNpc())).toThrow('already exists')
  })
})

describe('updateNpc', () => {
  it('shallow-merges updates onto an existing NPC', () => {
    addNpc(testNpc())
    const updated = updateNpc(TEST_NPC_ID, { name: 'Updated Name' })
    expect(updated.name).toBe('Updated Name')
    expect(updated.role).toBe('Tester')
  })

  it('preserves fields the update omits, like unlockConditions', () => {
    addNpc(testNpc({ unlockConditions: [{ kind: 'always' }] }))
    const updated = updateNpc(TEST_NPC_ID, { name: 'New name' })
    expect(updated.unlockConditions).toEqual([{ kind: 'always' }])
  })

  it('throws for an unknown id', () => {
    expect(() => updateNpc('does-not-exist', { name: 'x' })).toThrow('does not exist')
  })
})

describe('removeNpc', () => {
  it('removes an NPC from the registry', () => {
    addNpc(testNpc())
    removeNpc(TEST_NPC_ID)
    expect(getNpcById(TEST_NPC_ID)).toBeUndefined()
  })

  it('throws for an unknown id', () => {
    expect(() => removeNpc('does-not-exist')).toThrow('does not exist')
  })
})
