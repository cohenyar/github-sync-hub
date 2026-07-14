import { describe, expect, it } from 'vitest'
import { rowKey } from './rowKey'

describe('rowKey', () => {
  it('produces the same key regardless of property order', () => {
    const a = { b: 2, a: 1 }
    const b = { a: 1, b: 2 }
    expect(rowKey(a)).toBe(rowKey(b))
  })

  it('produces different keys for different values', () => {
    expect(rowKey({ a: 1 })).not.toBe(rowKey({ a: 2 }))
  })

  it('normalizes cell values before hashing', () => {
    expect(rowKey({ a: '  x  ' })).toBe(rowKey({ a: 'x' }))
  })

  it('restricts the key to the given columns when provided', () => {
    const row = { a: 1, b: 2, c: 3 }
    expect(rowKey(row, ['a'])).toBe(rowKey({ a: 1, ignored: 'x' }, ['a']))
  })

  it('is sensitive to column order when columns are explicit', () => {
    const row = { a: 1, b: 2 }
    expect(rowKey(row, ['a', 'b'])).not.toBe(rowKey(row, ['b', 'a']))
  })
})
