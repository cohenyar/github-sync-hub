import { describe, expect, it } from 'vitest'
import { getDistrictStatus } from './districtStatus'
import { initialDistricts } from './initialDistricts'

function district(id: string) {
  const found = initialDistricts.find((d) => d.id === id)
  if (!found) throw new Error(`missing district: ${id}`)
  return found
}

describe('initialDistricts', () => {
  it('defines the four starting districts', () => {
    expect(initialDistricts.map((d) => d.id)).toEqual(['north', 'south', 'east', 'core'])
  })

  it('starts the core district offline, and single-stat', () => {
    expect(district('core').stats).toEqual({ signal: 0 })
  })

  it('gives North, South, and East a second stat (stability) alongside loyalty', () => {
    for (const id of ['north', 'south', 'east']) {
      const stats = district(id).stats
      expect(Object.keys(stats).sort()).toEqual(['loyalty', 'stability'])
    }
  })

  it('starts with a varied spread of district statuses', () => {
    expect(getDistrictStatus(district('north'))).toBe('stable')
    expect(getDistrictStatus(district('south'))).toBe('unstable')
    expect(getDistrictStatus(district('east'))).toBe('thriving')
    expect(getDistrictStatus(district('core'))).toBe('unstable')
  })
})
