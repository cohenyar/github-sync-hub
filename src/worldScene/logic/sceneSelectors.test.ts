import { describe, expect, it } from 'vitest'
import { getDistrictStatusColor, getDistrictStatusLabel, getVisibleNpcs } from './sceneSelectors'

describe('getVisibleNpcs', () => {
  it('returns only unlocked NPCs assigned to the given district', () => {
    const visible = getVisibleNpcs('north', ['north-warden'])
    expect(visible.map((npc) => npc.id)).toEqual(['north-warden'])
  })

  it('excludes an NPC assigned to the district but not yet unlocked', () => {
    const visible = getVisibleNpcs('east', [])
    expect(visible).toEqual([])
  })

  it('returns an empty list for a district with no NPCs at all', () => {
    expect(getVisibleNpcs('does-not-exist', ['north-warden'])).toEqual([])
  })
})

describe('getDistrictStatusLabel', () => {
  it('gives every status a non-empty Hebrew label', () => {
    for (const status of ['thriving', 'stable', 'unstable'] as const) {
      const label = getDistrictStatusLabel(status)
      expect(label.length).toBeGreaterThan(0)
      expect(/[֐-׿]/.test(label)).toBe(true)
    }
  })
})

describe('getDistrictStatusColor', () => {
  it('gives every status a distinct hex color', () => {
    const colors = (['thriving', 'stable', 'unstable'] as const).map(getDistrictStatusColor)
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
    expect(new Set(colors).size).toBe(colors.length)
  })
})
