import { afterEach, describe, expect, it } from 'vitest'
import { addMission, getMissionById } from '../../missions'
import { createMission, deleteMission, editMission, getMissionDraft, type MissionDraft } from './missionAdminService'

const TEST_ID = 'test-admin-mission'

function draft(overrides: Partial<MissionDraft> = {}): MissionDraft {
  return {
    id: TEST_ID,
    title: 'Test Mission',
    goal: 'Test goal',
    prompt: 'Test prompt',
    setupSql: 'CREATE TABLE t (id INTEGER);',
    referenceSql: 'SELECT * FROM t;',
    ...overrides,
  }
}

afterEach(() => {
  deleteMission(TEST_ID)
})

describe('createMission', () => {
  it('adds a valid mission to the real mission registry', () => {
    const result = createMission(draft())
    expect(result).toEqual({ success: true, errors: [] })
    expect(getMissionById(TEST_ID)).toMatchObject({ title: 'Test Mission' })
  })

  it('rejects a mission missing a required field, without touching the registry', () => {
    const result = createMission(draft({ title: '' }))
    expect(result.success).toBe(false)
    expect(result.errors).toContain('title must be a non-empty string')
    expect(getMissionById(TEST_ID)).toBeUndefined()
  })

  it('rejects a mission with empty setupSql', () => {
    const result = createMission(draft({ setupSql: '' }))
    expect(result.success).toBe(false)
    expect(result.errors).toContain('setupSql must be a non-empty string')
  })

  it('rejects a duplicate id', () => {
    createMission(draft())
    const result = createMission(draft())
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('already exists')
  })
})

describe('editMission', () => {
  it('updates an existing mission and preserves fields the draft does not cover', () => {
    createMission(draft())
    const result = editMission(TEST_ID, { ...draft(), title: 'Renamed' })
    expect(result).toEqual({ success: true, errors: [] })
    expect(getMissionById(TEST_ID)?.title).toBe('Renamed')
  })

  it("does not clobber an existing mission's successEffect, since the draft never carries one", () => {
    addMission({ ...draft(), successEffect: { kind: 'ADVANCE_TURN' } })

    const result = editMission(TEST_ID, { ...draft(), title: 'Renamed' })

    expect(result.success).toBe(true)
    expect(getMissionById(TEST_ID)?.successEffect).toEqual({ kind: 'ADVANCE_TURN' })
  })

  it('rejects an invalid update without mutating the registry', () => {
    createMission(draft())
    const result = editMission(TEST_ID, { ...draft(), referenceSql: '' })
    expect(result.success).toBe(false)
    expect(getMissionById(TEST_ID)?.referenceSql).toBe('SELECT * FROM t;')
  })
})

describe('deleteMission', () => {
  it('removes a mission', () => {
    createMission(draft())
    const result = deleteMission(TEST_ID)
    expect(result).toEqual({ success: true, errors: [] })
    expect(getMissionById(TEST_ID)).toBeUndefined()
  })

  it('reports failure for an unknown id instead of throwing', () => {
    const result = deleteMission('does-not-exist')
    expect(result.success).toBe(false)
  })
})

describe('getMissionDraft', () => {
  it('returns the full editable shape of a real mission', () => {
    expect(getMissionDraft('first-contact')).toEqual({
      id: 'first-contact',
      title: 'First Contact',
      goal: 'Bring the Records Core online by discovering the citizens registered in the city.',
      prompt:
        'The Records Core is blind. Meridian has citizens, but the city cannot see them yet.\n' +
        'Query the citizens registry and bring the first signal online.',
      setupSql: getMissionById('first-contact')!.setupSql,
      referenceSql: 'SELECT * FROM citizens;',
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(getMissionDraft('does-not-exist')).toBeUndefined()
  })
})
