import type { Position2D } from '../../../logic/movement'

export interface CrateProps {
  position: Position2D
  rotationY?: number
  color?: string
}

/**
 * A single reusable crate — the same shape EastTradingPost.tsx's own inline
 * crates already use, extracted so TownProps can scatter a couple more
 * nearby without duplicating the geometry.
 */
export function Crate({ position, rotationY = 0, color = '#6b5a42' }: CrateProps) {
  return (
    <mesh position={[position.x, 0.2, position.z]} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}
