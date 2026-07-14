import { describe, expect, it } from 'vitest'
import { toDistrictVisualState } from './visualState'

describe('toDistrictVisualState', () => {
  it('maps an empty stats object to zero intensity', () => {
    expect(toDistrictVisualState({ id: 'a', stats: {} })).toEqual({ id: 'a', intensity: 0 })
  })

  it('normalizes a single stat into a 0-1 range', () => {
    expect(toDistrictVisualState({ id: 'a', stats: { x: 50 } })).toEqual({ id: 'a', intensity: 0.5 })
  })

  it('averages multiple stats', () => {
    expect(toDistrictVisualState({ id: 'a', stats: { x: 0, y: 100 } })).toEqual({ id: 'a', intensity: 0.5 })
  })

  it('clamps negative averages to zero', () => {
    expect(toDistrictVisualState({ id: 'a', stats: { x: -50 } }).intensity).toBe(0)
  })

  it('clamps averages above the normalization ceiling to one', () => {
    expect(toDistrictVisualState({ id: 'a', stats: { x: 500 } }).intensity).toBe(1)
  })

  it('is deterministic for the same district state', () => {
    const district = { id: 'a', stats: { x: 30, y: 70 } }
    expect(toDistrictVisualState(district)).toEqual(toDistrictVisualState(district))
  })
})
