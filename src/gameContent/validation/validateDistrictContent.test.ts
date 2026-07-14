import { describe, expect, it } from 'vitest'
import type { GameDistrictContent } from '../types/gameDistrictContent'
import { validateDistrictContent } from './validateDistrictContent'

describe('validateDistrictContent', () => {
  it('accepts a district with an id and numeric stats', () => {
    const district: GameDistrictContent = { id: 'core', stats: { signal: 0 } }
    expect(validateDistrictContent(district)).toEqual({ valid: true, errors: [] })
  })

  it('accepts a district with no stats defined', () => {
    expect(validateDistrictContent({ id: 'core', stats: {} })).toEqual({ valid: true, errors: [] })
  })

  it('rejects a district missing an id', () => {
    const result = validateDistrictContent({ id: '', stats: {} })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('id must be a non-empty string')
  })

  it('rejects a district whose stats is not an object', () => {
    const result = validateDistrictContent({ id: 'core', stats: null as unknown as Record<string, number> })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('stats must be an object')
  })

  it('rejects a district with a non-numeric stat value', () => {
    const result = validateDistrictContent({
      id: 'core',
      stats: { signal: '100' as unknown as number },
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('stats.signal must be a number')
  })
})
