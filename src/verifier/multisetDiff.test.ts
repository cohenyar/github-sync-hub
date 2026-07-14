import { describe, expect, it } from 'vitest'
import { multisetDiff } from './multisetDiff'

describe('multisetDiff', () => {
  it('reports no diff for identical multisets', () => {
    const rows = [{ a: 1 }, { a: 2 }]
    const result = multisetDiff(rows, rows)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
    expect(result.matched).toEqual(rows)
  })

  it('is order-independent', () => {
    const expected = [{ a: 1 }, { a: 2 }]
    const actual = [{ a: 2 }, { a: 1 }]
    const result = multisetDiff(expected, actual)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
    expect(result.matched).toHaveLength(2)
  })

  it('reports rows missing from actual', () => {
    const expected = [{ a: 1 }, { a: 2 }]
    const actual = [{ a: 1 }]
    const result = multisetDiff(expected, actual)
    expect(result.missing).toEqual([{ a: 2 }])
    expect(result.extra).toEqual([])
    expect(result.matched).toEqual([{ a: 1 }])
  })

  it('reports rows extra in actual', () => {
    const expected = [{ a: 1 }]
    const actual = [{ a: 1 }, { a: 2 }]
    const result = multisetDiff(expected, actual)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([{ a: 2 }])
    expect(result.matched).toEqual([{ a: 1 }])
  })

  it('is duplicate-count sensitive', () => {
    const expected = [{ a: 1 }, { a: 1 }, { a: 1 }]
    const actual = [{ a: 1 }]
    const result = multisetDiff(expected, actual)
    expect(result.matched).toEqual([{ a: 1 }])
    expect(result.missing).toEqual([{ a: 1 }, { a: 1 }])
    expect(result.extra).toEqual([])
  })

  it('respects an explicit column subset', () => {
    const expected = [{ a: 1, b: 'ignored' }]
    const actual = [{ a: 1, b: 'different' }]
    const result = multisetDiff(expected, actual, ['a'])
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
    expect(result.matched).toHaveLength(1)
  })
})
