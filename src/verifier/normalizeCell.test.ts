import { describe, expect, it } from 'vitest'
import { normalizeCell } from './normalizeCell'

describe('normalizeCell', () => {
  it('converts null to null', () => {
    expect(normalizeCell(null)).toBeNull()
  })

  it('converts undefined to null', () => {
    expect(normalizeCell(undefined)).toBeNull()
  })

  it('trims whitespace from strings', () => {
    expect(normalizeCell('  hello  ')).toBe('hello')
  })

  it('leaves numbers unchanged', () => {
    expect(normalizeCell(42)).toBe(42)
  })

  it('normalizes negative zero to zero', () => {
    expect(Object.is(normalizeCell(-0), 0)).toBe(true)
  })

  it('leaves booleans unchanged', () => {
    expect(normalizeCell(true)).toBe(true)
    expect(normalizeCell(false)).toBe(false)
  })

  it('stringifies other values', () => {
    expect(normalizeCell(new Date(2024, 0, 1))).toBe(String(new Date(2024, 0, 1)))
  })
})
