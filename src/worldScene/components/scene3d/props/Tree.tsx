import type { Position2D } from '../../../logic/movement'

export interface TreeProps {
  position: Position2D
}

/**
 * A small reusable tree — same trunk-cylinder + cone-canopy shape as
 * BackgroundSkyline.tsx's DistantTree, but foreground-scaled with brighter
 * default colors (DistantTree's muted tones are deliberately dim so it
 * recedes as a backdrop silhouette; this is meant to be seen up close),
 * matching House.tsx's own precedent for graduating a background silhouette
 * into a foreground prop. Purely decorative: no interaction, no collision.
 */
export function Tree({ position }: TreeProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.8, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[0.75, 1.3, 8]} />
        <meshStandardMaterial color="#3f7a4f" flatShading />
      </mesh>
    </group>
  )
}
