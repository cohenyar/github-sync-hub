import { describe, expect, it } from 'vitest'
import { resolveBuildingCollision, type CircleCollider } from './collision'

const BUILDING: CircleCollider = { id: 'test-building', center: { x: 0, z: 0 }, radius: 1.5 }

describe('resolveBuildingCollision', () => {
  it('leaves a position outside every collider unchanged', () => {
    expect(resolveBuildingCollision({ x: 10, z: 10 }, [BUILDING])).toEqual({ x: 10, z: 10 })
  })

  it('pushes a position back to the collider edge along the shortest path', () => {
    const inside = { x: 0.5, z: 0 }
    const resolved = resolveBuildingCollision(inside, [BUILDING])

    const distance = Math.hypot(resolved.x - BUILDING.center.x, resolved.z - BUILDING.center.z)
    expect(distance).toBeCloseTo(BUILDING.radius, 5)
    // Pushed straight out along +x, since that's the direction from the
    // collider's center to the original (inside) position.
    expect(resolved.x).toBeCloseTo(BUILDING.radius, 5)
    expect(resolved.z).toBeCloseTo(0, 5)
  })

  it('resolves correctly regardless of approach direction', () => {
    const inside = { x: 0, z: -0.8 }
    const resolved = resolveBuildingCollision(inside, [BUILDING])

    const distance = Math.hypot(resolved.x - BUILDING.center.x, resolved.z - BUILDING.center.z)
    expect(distance).toBeCloseTo(BUILDING.radius, 5)
    expect(resolved.z).toBeCloseTo(-BUILDING.radius, 5)
  })

  it('handles landing exactly on the collider center without dividing by zero', () => {
    const resolved = resolveBuildingCollision({ x: 0, z: 0 }, [BUILDING])
    expect(Number.isFinite(resolved.x)).toBe(true)
    expect(Number.isFinite(resolved.z)).toBe(true)
    const distance = Math.hypot(resolved.x - BUILDING.center.x, resolved.z - BUILDING.center.z)
    expect(distance).toBeCloseTo(BUILDING.radius, 5)
  })

  it('resolves against multiple colliders in sequence', () => {
    const second: CircleCollider = { id: 'second-building', center: { x: 4, z: 0 }, radius: 1 }
    // Positioned inside the first collider only.
    const resolved = resolveBuildingCollision({ x: 0.3, z: 0 }, [BUILDING, second])

    const distanceFromFirst = Math.hypot(resolved.x - BUILDING.center.x, resolved.z - BUILDING.center.z)
    expect(distanceFromFirst).toBeCloseTo(BUILDING.radius, 5)
  })

  it('returns the exact position unchanged when there are no colliders', () => {
    expect(resolveBuildingCollision({ x: 1, z: 2 }, [])).toEqual({ x: 1, z: 2 })
  })
})
