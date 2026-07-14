import { describe, expect, it } from 'vitest'
import { computeFacingAngle, computeNextPosition, MOVEMENT_BOUNDS, type MovementInput } from './movement'

const NO_INPUT: MovementInput = { forward: false, backward: false, left: false, right: false }

describe('computeNextPosition', () => {
  it('does not move when no keys are held', () => {
    expect(computeNextPosition({ x: 0, z: 0 }, NO_INPUT, 1)).toEqual({ x: 0, z: 0 })
  })

  it('moves in -z when forward is held', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, forward: true }, 1, 5)
    expect(next).toEqual({ x: 0, z: -5 })
  })

  it('moves in +z when backward is held', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, backward: true }, 1, 5)
    expect(next).toEqual({ x: 0, z: 5 })
  })

  it('moves in -x when left is held', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, left: true }, 1, 5)
    expect(next).toEqual({ x: -5, z: 0 })
  })

  it('moves in +x when right is held', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, right: true }, 1, 5)
    expect(next).toEqual({ x: 5, z: 0 })
  })

  it('normalizes diagonal movement to the same speed as a single axis', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { forward: true, right: true, backward: false, left: false }, 1, 5)
    const distance = Math.sqrt(next.x * next.x + next.z * next.z)
    expect(distance).toBeCloseTo(5, 5)
  })

  it('cancels opposite keys held together', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { forward: true, backward: true, left: false, right: false }, 1, 5)
    expect(next).toEqual({ x: 0, z: 0 })
  })

  it('clamps to the movement bounds instead of leaving the plaza', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, right: true }, 100, 5)
    expect(next.x).toBe(MOVEMENT_BOUNDS.maxX)
  })

  it('clamps at the negative bound too', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, forward: true }, 100, 5)
    expect(next.z).toBe(MOVEMENT_BOUNDS.minZ)
  })

  it('scales with deltaSeconds', () => {
    const next = computeNextPosition({ x: 0, z: 0 }, { ...NO_INPUT, right: true }, 0.5, 5)
    expect(next.x).toBe(2.5)
  })
})

describe('computeFacingAngle', () => {
  it('faces forward (-Z) as angle 0', () => {
    expect(computeFacingAngle({ ...NO_INPUT, forward: true }, 0)).toBeCloseTo(0, 5)
  })

  it('faces backward (+Z) as a half turn', () => {
    expect(Math.abs(computeFacingAngle({ ...NO_INPUT, backward: true }, 0))).toBeCloseTo(Math.PI, 5)
  })

  it('faces right (+X) as a quarter turn', () => {
    expect(computeFacingAngle({ ...NO_INPUT, right: true }, 0)).toBeCloseTo(-Math.PI / 2, 5)
  })

  it('faces left (-X) as a quarter turn the other way', () => {
    expect(computeFacingAngle({ ...NO_INPUT, left: true }, 0)).toBeCloseTo(Math.PI / 2, 5)
  })

  it('holds the previous angle when no keys are held', () => {
    expect(computeFacingAngle(NO_INPUT, 1.23)).toBe(1.23)
  })

  it('holds the previous angle when opposite keys cancel out', () => {
    const input: MovementInput = { forward: true, backward: true, left: false, right: false }
    expect(computeFacingAngle(input, 0.5)).toBe(0.5)
  })
})
