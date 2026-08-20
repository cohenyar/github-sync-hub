import type { Position2D } from '../../../logic/movement'

export interface SlideProps {
  position: Position2D
  rotationY?: number
}

const PLATFORM_HEIGHT = 0.9

/**
 * A small static slide: a platform at the top reached by a single stair
 * block (ladder-adjacent per the brief, rather than individually modeled
 * rungs), and one tilted ramp descending back to the ground. Purely
 * decorative — no interaction, no collision, no actual sliding
 * physics/animation. Colors reuse this world's already-established
 * wood/wood-accent family (Bench's dark wood, MarketCart's warm honey wood,
 * the English district's light trim tan) rather than inventing new ones.
 */
export function Slide({ position, rotationY = 0 }: SlideProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      {/* platform at the top */}
      <mesh position={[0, PLATFORM_HEIGHT, -0.4]}>
        <boxGeometry args={[0.7, 0.08, 0.6]} />
        <meshStandardMaterial color="#c9a25a" flatShading />
      </mesh>
      {/* a single stair block up to the platform */}
      <mesh position={[0, PLATFORM_HEIGHT / 2, -0.78]}>
        <boxGeometry args={[0.6, PLATFORM_HEIGHT, 0.35]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      {/* the inclined slide surface, tilted down toward +Z */}
      <mesh position={[0, PLATFORM_HEIGHT / 2 - 0.02, 0.35]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[0.62, 0.06, 1.55]} />
        <meshStandardMaterial color="#e0c9a6" flatShading />
      </mesh>
    </group>
  )
}
