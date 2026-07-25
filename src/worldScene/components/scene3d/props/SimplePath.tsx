import type { Position2D } from '../../../logic/movement'

export interface SimplePathProps {
  from: Position2D
  to: Position2D
  width?: number
}

/**
 * A short, straight, flat connector path — deliberately simpler than
 * PathNetwork.tsx's mitered multi-waypoint roads (no bends needed for a
 * short plaza spur). A single thin box rotated only around Y avoids any
 * combined-rotation risk. Purely visual: no collision, no pathfinding, same
 * as every existing road.
 */
export function SimplePath({ from, to, width = 1.3 }: SimplePathProps) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  const midX = (from.x + to.x) / 2
  const midZ = (from.z + to.z) / 2
  const angle = Math.atan2(dx, dz)

  return (
    <mesh position={[midX, 0.013, midZ]} rotation={[0, angle, 0]}>
      <boxGeometry args={[width, 0.02, length]} />
      <meshStandardMaterial color="#7a7360" flatShading />
    </mesh>
  )
}
