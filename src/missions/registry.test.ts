import { afterEach, describe, expect, it } from 'vitest'
import { firstContactMission } from './firstContact'
import {
  addMission,
  getDefaultMission,
  getMissionById,
  missionRegistry,
  removeMission,
  updateMission,
} from './registry'
import type { MissionConfig } from './types'

const TEST_MISSION_ID = 'test-crud-mission'

function testMission(overrides: Partial<MissionConfig> = {}): MissionConfig {
  return {
    id: TEST_MISSION_ID,
    title: 'Test Mission',
    goal: 'Test goal',
    prompt: 'Test prompt',
    setupSql: 'CREATE TABLE t (id INTEGER);',
    referenceSql: 'SELECT * FROM t;',
    ...overrides,
  }
}

afterEach(() => {
  try {
    removeMission(TEST_MISSION_ID)
  } catch {
    // Test mission was already removed (or never added) — nothing to clean up.
  }
})

describe('mission registry', () => {
  it('registers First Contact', () => {
    expect(missionRegistry).toContain(firstContactMission)
  })

  it('finds a mission by id', () => {
    expect(getMissionById('first-contact')).toBe(firstContactMission)
  })

  it('returns undefined for an unknown id', () => {
    expect(getMissionById('nope')).toBeUndefined()
  })

  it('defaults to the first registered mission', () => {
    expect(getDefaultMission()).toBe(firstContactMission)
  })
})

describe('addMission', () => {
  it('adds a new mission that is then findable by id', () => {
    addMission(testMission())
    expect(getMissionById(TEST_MISSION_ID)).toEqual(testMission())
  })

  it('rejects a duplicate id', () => {
    addMission(testMission())
    expect(() => addMission(testMission())).toThrow('already exists')
  })
})

describe('updateMission', () => {
  it('shallow-merges updates onto an existing mission', () => {
    addMission(testMission())
    const updated = updateMission(TEST_MISSION_ID, { title: 'Updated Title' })
    expect(updated.title).toBe('Updated Title')
    expect(updated.goal).toBe('Test goal')
  })

  it('preserves fields the update omits, like successEffect', () => {
    addMission(testMission({ successEffect: { kind: 'ADVANCE_TURN' } }))
    const updated = updateMission(TEST_MISSION_ID, { title: 'New title' })
    expect(updated.successEffect).toEqual({ kind: 'ADVANCE_TURN' })
  })

  it('throws for an unknown id', () => {
    expect(() => updateMission('does-not-exist', { title: 'x' })).toThrow('does not exist')
  })
})

describe('removeMission', () => {
  it('removes a mission from the registry', () => {
    addMission(testMission())
    removeMission(TEST_MISSION_ID)
    expect(getMissionById(TEST_MISSION_ID)).toBeUndefined()
  })

  it('throws for an unknown id', () => {
    expect(() => removeMission('does-not-exist')).toThrow('does not exist')
  })
})
