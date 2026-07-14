import { describe, expect, it } from 'vitest'
import { getDistrictStatus } from './districtStatus'

describe('getDistrictStatus', () => {
  it('is unstable for a district with no stats (average 0)', () => {
    expect(getDistrictStatus({ id: 'a', stats: {} })).toBe('unstable')
  })

  it('is unstable below the unstable threshold', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 39 } })).toBe('unstable')
  })

  it('is stable at the unstable threshold boundary', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 40 } })).toBe('stable')
  })

  it('is stable in the middle of the range', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 60, stability: 60 } })).toBe('stable')
  })

  it('is stable just below the thriving threshold', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 69 } })).toBe('stable')
  })

  it('is thriving at and above the thriving threshold', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 70 } })).toBe('thriving')
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 100 } })).toBe('thriving')
  })

  it('is computed from the average across multiple stats', () => {
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 75, stability: 75 } })).toBe('thriving')
    expect(getDistrictStatus({ id: 'a', stats: { loyalty: 40, stability: 20 } })).toBe('unstable')
  })
})
