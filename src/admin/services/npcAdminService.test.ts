import { afterEach, describe, expect, it } from 'vitest'
import { addNpc, getNpcById } from '../../npcs'
import { createNpc, deleteNpc, editNpc, getNpcDraft, type NpcDraft } from './npcAdminService'

const TEST_ID = 'test-admin-npc'

function draft(overrides: Partial<NpcDraft> = {}): NpcDraft {
  return {
    id: TEST_ID,
    name: 'Test NPC',
    districtId: 'core',
    role: 'Tester',
    description: 'A temporary NPC used only by tests.',
    ...overrides,
  }
}

afterEach(() => {
  deleteNpc(TEST_ID)
})

describe('createNpc', () => {
  it('adds a valid NPC to the real NPC registry', () => {
    const result = createNpc(draft())
    expect(result).toEqual({ success: true, errors: [] })
    expect(getNpcById(TEST_ID)).toMatchObject({ name: 'Test NPC' })
  })

  it('rejects an NPC missing a required field, without touching the registry', () => {
    const result = createNpc(draft({ name: '' }))
    expect(result.success).toBe(false)
    expect(result.errors).toContain('name must be a non-empty string')
    expect(getNpcById(TEST_ID)).toBeUndefined()
  })

  it('rejects an NPC with a districtId that does not match a real district', () => {
    const result = createNpc(draft({ districtId: 'nowhere' }))
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('districtId must be one of')
    expect(getNpcById(TEST_ID)).toBeUndefined()
  })

  it('rejects a duplicate id', () => {
    createNpc(draft())
    const result = createNpc(draft())
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('already exists')
  })
})

describe('editNpc', () => {
  it('updates an existing NPC', () => {
    createNpc(draft())
    const result = editNpc(TEST_ID, { ...draft(), name: 'Renamed' })
    expect(result).toEqual({ success: true, errors: [] })
    expect(getNpcById(TEST_ID)?.name).toBe('Renamed')
  })

  it("does not clobber an existing NPC's unlockConditions, since the draft never carries one", () => {
    addNpc({ ...draft(), unlockConditions: [{ kind: 'always' }] })

    const result = editNpc(TEST_ID, { ...draft(), name: 'Renamed' })

    expect(result.success).toBe(true)
    expect(getNpcById(TEST_ID)?.unlockConditions).toEqual([{ kind: 'always' }])
  })

  it("does not clobber an existing NPC's Hebrew display fields, since the draft never carries them", () => {
    addNpc({ ...draft(), roleHe: 'תפקיד', descriptionHe: 'תיאור' })

    const result = editNpc(TEST_ID, { ...draft(), name: 'Renamed' })

    expect(result.success).toBe(true)
    expect(getNpcById(TEST_ID)).toMatchObject({ roleHe: 'תפקיד', descriptionHe: 'תיאור' })
  })

  it('rejects an invalid update without mutating the registry', () => {
    createNpc(draft())
    const result = editNpc(TEST_ID, { ...draft(), districtId: 'nowhere' })
    expect(result.success).toBe(false)
    expect(getNpcById(TEST_ID)?.districtId).toBe('core')
  })
})

describe('deleteNpc', () => {
  it('removes an NPC', () => {
    createNpc(draft())
    const result = deleteNpc(TEST_ID)
    expect(result).toEqual({ success: true, errors: [] })
    expect(getNpcById(TEST_ID)).toBeUndefined()
  })

  it('reports failure for an unknown id instead of throwing', () => {
    const result = deleteNpc('does-not-exist')
    expect(result.success).toBe(false)
  })
})

describe('getNpcDraft', () => {
  it('returns the full editable shape of a real NPC', () => {
    expect(getNpcDraft('archivist-mera')).toEqual({
      id: 'archivist-mera',
      name: 'Mera Solt',
      districtId: 'core',
      role: 'Archivist',
      description: 'Tends the Records Core, waiting for its signal to steady.',
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(getNpcDraft('does-not-exist')).toBeUndefined()
  })
})
