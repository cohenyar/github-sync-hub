import { describe, expect, it } from 'vitest'
import { createWorldState } from './createWorldState'

describe('createWorldState', () => {
  it('creates an empty world at turn zero with no districts', () => {
    expect(createWorldState()).toEqual({ turn: 0, districts: {} })
  })

  it('indexes the given districts by id', () => {
    const state = createWorldState([
      { id: 'a', stats: { loyalty: 1 } },
      { id: 'b', stats: {} },
    ])
    expect(state.districts).toEqual({
      a: { id: 'a', stats: { loyalty: 1 } },
      b: { id: 'b', stats: {} },
    })
    expect(state.turn).toBe(0)
  })
})
