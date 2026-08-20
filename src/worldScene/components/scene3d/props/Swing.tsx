import type { Position2D } from '../../../logic/movement'

export interface SwingProps {
  position: Position2D
  rotationY?: number
}

const POST_HEIGHT = 1.4
const SEAT_HEIGHT = 0.5
const POST_SPACING = 1.0

/**
 * A small static swing set: two vertical posts, one horizontal top bar, and
 * a flat seat. Purely decorative — matches this file's neighbors in every
 * way that matters (flat XZ placement, optional rotationY, flatShading
 * materials) but intentionally has no swinging animation/physics and no
 * interaction — "no gameplay interaction required" per the playground-area
 * brief. Colors reuse this world's already-established wood/wood-accent
 * family (Bench's dark wood, MarketCart's warm honey wood) rather than
 * inventing new ones.
 *
 * Perf pass — the original design also hung two thin chain cylinders
 * between the bar and the seat. At gameplay camera distance those chains
 * (1.5cm radius) were confirmed imperceptible — cut per "spend geometry
 * where the player can see it" rather than kept as invisible ornament; the
 * seat now sits directly below the bar, which reads the same at this
 * scene's actual scale/distance while costing 2 fewer draw calls per swing.
 */
export function Swing({ position, rotationY = 0 }: SwingProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[-POST_SPACING / 2, POST_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.07, POST_HEIGHT, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[POST_SPACING / 2, POST_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.07, POST_HEIGHT, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0, POST_HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, POST_SPACING + 0.2, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0, SEAT_HEIGHT, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.22]} />
        <meshStandardMaterial color="#c9a25a" flatShading />
      </mesh>
    </group>
  )
}
