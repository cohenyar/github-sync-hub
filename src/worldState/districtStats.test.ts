import { describe, expect, it } from 'vitest'
import { getAverageStat } from './districtStats'

describe('getAverageStat', () => {
  it('is 0 for a district with no stats', () => {
    expect(getAverageStat({ id: 'a', stats: {} })).toBe(0)
  })

  it('equals the value for a single stat', () => {
    expect(getAverageStat({ id: 'a', stats: { signal: 42 } })).toBe(42)
  })

  it('averages multiple stats', () => {
    expect(getAverageStat({ id: 'a', stats: { loyalty: 60, stability: 20 } })).toBe(40)
  })
})
