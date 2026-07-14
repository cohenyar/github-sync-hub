import { describe, expect, it } from 'vitest'
import { initialDistricts } from '../../worldState'
import { validateDistrictContent } from '../validation/validateDistrictContent'
import { getDistrictContent } from './districtContentAdapter'

describe('getDistrictContent', () => {
  it('returns the same array used to seed the world', () => {
    expect(getDistrictContent()).toBe(initialDistricts)
  })

  it('produces content that passes validation', () => {
    for (const content of getDistrictContent()) {
      expect(validateDistrictContent(content).valid).toBe(true)
    }
  })
})
