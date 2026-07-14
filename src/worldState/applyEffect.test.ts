import { describe, expect, it } from 'vitest'
import { applyEffect, applyEffects } from './applyEffect'
import { createWorldState } from './createWorldState'
import type { WorldState } from './types'

function baseState(): WorldState {
  return createWorldState([
    { id: 'a', stats: { loyalty: 5 } },
    { id: 'b', stats: {} },
  ])
}

describe('applyEffect', () => {
  it('ADJUST_STAT increases an existing stat by delta', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 3 })
    expect(next.districts.a.stats.loyalty).toBe(8)
  })

  it('ADJUST_STAT treats a missing stat as zero', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'b', stat: 'unrest', delta: 2 })
    expect(next.districts.b.stats.unrest).toBe(2)
  })

  it('ADJUST_STAT supports negative deltas', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: -5 })
    expect(next.districts.a.stats.loyalty).toBe(0)
  })

  it('SET_STAT overwrites a stat with an absolute value', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'SET_STAT', districtId: 'a', stat: 'loyalty', value: 42 })
    expect(next.districts.a.stats.loyalty).toBe(42)
  })

  it('ADVANCE_TURN increments the turn counter', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'ADVANCE_TURN' })
    expect(next.turn).toBe(1)
  })

  it('throws for an unknown district', () => {
    const state = baseState()
    expect(() =>
      applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'missing', stat: 'loyalty', delta: 1 }),
    ).toThrow('Unknown district: missing')
  })

  it('never mutates the input state', () => {
    const state = baseState()
    const snapshot = JSON.parse(JSON.stringify(state))
    applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 3 })
    expect(state).toEqual(snapshot)
  })

  it('does not affect unrelated districts', () => {
    const state = baseState()
    const next = applyEffect(state, { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 3 })
    expect(next.districts.b).toEqual(state.districts.b)
  })
})

describe('applyEffects', () => {
  it('folds a sequence of effects left to right', () => {
    const state = baseState()
    const next = applyEffects(state, [
      { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 3 },
      { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: -1 },
      { kind: 'ADVANCE_TURN' },
    ])
    expect(next.districts.a.stats.loyalty).toBe(7)
    expect(next.turn).toBe(1)
  })

  it('is equivalent to manually chaining applyEffect calls', () => {
    const state = baseState()
    const effects = [
      { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 2 },
      { kind: 'SET_STAT', districtId: 'b', stat: 'unrest', value: 9 },
    ] as const

    const viaReduce = applyEffects(state, effects)
    const viaManualChain = applyEffect(applyEffect(state, effects[0]), effects[1])

    expect(viaReduce).toEqual(viaManualChain)
  })

  it('returns the original state unchanged for an empty effect list', () => {
    const state = baseState()
    expect(applyEffects(state, [])).toEqual(state)
  })

  it('is deterministic: the same state and effects always produce the same result', () => {
    const state = baseState()
    const effects = [
      { kind: 'ADJUST_STAT', districtId: 'a', stat: 'loyalty', delta: 3 },
      { kind: 'ADVANCE_TURN' },
    ] as const

    expect(applyEffects(state, effects)).toEqual(applyEffects(state, effects))
  })
})
