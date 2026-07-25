import type { Position2D } from '../../../logic/movement'

export interface HouseProps {
  position: Position2D
  wallColor?: string
  roofColor?: string
}

/**
 * A small reusable residential house — same box-body + rotated-cone-roof
 * shape as BackgroundSkyline.tsx's DistantHouse, but foreground-scaled with
 * brighter default colors (DistantHouse's muted tones are deliberately dim
 * so it recedes as a backdrop silhouette; these are meant to be seen up
 * close). Purely decorative: no interaction, no collision.
 */
export function House({ position, wallColor = '#8a7a63', roofColor = '#5c4c3c' }: HouseProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.6, 1.1, 1.6]} />
        <meshStandardMaterial color={wallColor} flatShading />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.25, 0.8, 4]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
    </group>
  )
}
