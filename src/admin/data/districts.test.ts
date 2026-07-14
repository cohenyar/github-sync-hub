import { describe, expect, it } from 'vitest'
import { initialDistricts } from '../../worldState'
import { getDistrictItems } from './districts'

describe('getDistrictItems', () => {
  it('returns the same districts used to seed the world', () => {
    expect(getDistrictItems()).toBe(initialDistricts)
  })

  it('includes the core district', () => {
    expect(getDistrictItems().some((district) => district.id === 'core')).toBe(true)
  })
})
