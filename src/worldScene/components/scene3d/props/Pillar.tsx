import type { Position2D } from '../../../logic/movement'

export interface PillarProps {
  position: Position2D
  height?: number
}

/**
 * World Polish pass — a weathered stone pillar topped with a faint,
 * static crystal cap (WindowFrame.tsx's own "deliberately static, no
 * pulse — a lit window should read as occupied, not compete with a
 * landmark's glow" reasoning applies here too, and keeps this from adding
 * another useFrame subscription for a small accent). Core Archive's own
 * archival-ruins detail, distinct from any other district's civic/
 * commercial props. The lighter stone shaft is deliberately NOT the same
 * color as CoreArchiveBuilding.tsx's own body — matching it exactly made
 * the pillar disappear against the building in-game; the violet-glow cap
 * is what still ties it to that building's palette.
 */
export function Pillar({ position, height = 1.4 }: PillarProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.16, 0.19, height, 8]} />
        <meshStandardMaterial color="#8c86a0" flatShading />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[0.42, 0.1, 0.42]} />
        <meshStandardMaterial color="#c9b8ff" emissive="#c9b8ff" emissiveIntensity={0.5} flatShading />
      </mesh>
    </group>
  )
}
