import type { Position2D } from './movement'

export interface CircleCollider {
  id: string
  center: Position2D
  radius: number
}

/**
 * Pushes `position` outside any collider it's currently inside, along the
 * shortest vector back to that collider's edge. Deliberately simple: a
 * fixed-order pass over a small, sparse list (today, just the two Batch
 * 3A.2 learning buildings — see scenePositions3D.ts's
 * LEARNING_BUILDING_COLLIDERS) rather than a general physics/pathfinding
 * system. No existing building, prop, or NPC gets a collider by this
 * change — walking through everything else remains exactly as before.
 */
export function resolveBuildingCollision(position: Position2D, colliders: readonly CircleCollider[]): Position2D {
  let resolved = position

  for (const collider of colliders) {
    const dx = resolved.x - collider.center.x
    const dz = resolved.z - collider.center.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance === 0) {
      // Degenerate case (landed exactly on the collider's center) — push
      // out along an arbitrary fixed direction rather than dividing by zero.
      resolved = { x: collider.center.x + collider.radius, z: collider.center.z }
    } else if (distance < collider.radius) {
      const scale = collider.radius / distance
      resolved = { x: collider.center.x + dx * scale, z: collider.center.z + dz * scale }
    }
  }

  return resolved
}
