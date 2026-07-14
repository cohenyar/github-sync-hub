import { describe, expect, it } from 'vitest'
import { npcRegistry } from './registry'
import { getAllNpcs, getNpcById, getNpcsByDistrict } from './selectors'

describe('getAllNpcs', () => {
  it('returns the full registry', () => {
    expect(getAllNpcs()).toBe(npcRegistry)
  })
})

describe('getNpcById', () => {
  it('finds a registered NPC by id', () => {
    const [first] = npcRegistry
    expect(getNpcById(first.id)).toBe(first)
  })

  it('returns undefined for an unknown id', () => {
    expect(getNpcById('nope')).toBeUndefined()
  })
})

describe('getNpcsByDistrict', () => {
  it('returns only the NPCs that belong to the given district', () => {
    const [first] = npcRegistry
    const result = getNpcsByDistrict(first.districtId)

    expect(result.length).toBeGreaterThan(0)
    for (const npc of result) {
      expect(npc.districtId).toBe(first.districtId)
    }
  })

  it('returns an empty array for a district with no NPCs', () => {
    expect(getNpcsByDistrict('no-such-district')).toEqual([])
  })
})
