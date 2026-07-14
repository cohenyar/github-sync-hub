import { describe, expect, it } from 'vitest'
import { he } from './strings'

describe('he (Hebrew UI chrome dictionary)', () => {
  it('gives every key a non-empty string value', () => {
    for (const [key, value] of Object.entries(he)) {
      expect(typeof value).toBe('string')
      expect((value as string).length, `expected "${key}" to be non-empty`).toBeGreaterThan(0)
    }
  })

  it('gives every key at least some Hebrew text, not a bare English placeholder', () => {
    // A loose guard, not a strict linguistic check: every value must contain
    // at least one character from the Hebrew Unicode block. This still
    // allows values like the SQL placeholder ("-- ...") to mix in the
    // required SQL comment syntax alongside the Hebrew instruction.
    const hebrewPattern = /[֐-׿]/
    for (const [key, value] of Object.entries(he)) {
      expect(hebrewPattern.test(value as string), `expected "${key}" to contain Hebrew text`).toBe(true)
    }
  })
})
