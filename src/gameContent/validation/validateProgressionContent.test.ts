import { describe, expect, it } from 'vitest'
import type { GameProgressionContent } from '../types/gameProgressionContent'
import { validateProgressionContent } from './validateProgressionContent'

const validEntry: GameProgressionContent = { order: 1, missionId: 'first-contact', title: 'First Contact' }

describe('validateProgressionContent', () => {
  it('accepts a well-formed progression entry', () => {
    expect(validateProgressionContent(validEntry)).toEqual({ valid: true, errors: [] })
  })

  it('rejects an entry with a non-numeric order', () => {
    const result = validateProgressionContent({ ...validEntry, order: '1' as unknown as number })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('order must be a number')
  })

  it('rejects an entry missing missionId', () => {
    const result = validateProgressionContent({ ...validEntry, missionId: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('missionId must be a non-empty string')
  })

  it('rejects an entry missing title', () => {
    const result = validateProgressionContent({ ...validEntry, title: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('title must be a non-empty string')
  })
})
