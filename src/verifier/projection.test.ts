import { describe, expect, it } from 'vitest'
import { project, projectRows } from './projection'

describe('project', () => {
  it('keeps only the requested columns', () => {
    expect(project({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('fills missing columns with null', () => {
    expect(project({ a: 1 }, ['a', 'missing'])).toEqual({ a: 1, missing: null })
  })

  it('returns an empty object for an empty column list', () => {
    expect(project({ a: 1, b: 2 }, [])).toEqual({})
  })
})

describe('projectRows', () => {
  it('projects every row in the array', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]
    expect(projectRows(rows, ['a'])).toEqual([{ a: 1 }, { a: 3 }])
  })

  it('returns an empty array for an empty input', () => {
    expect(projectRows([], ['a'])).toEqual([])
  })
})
