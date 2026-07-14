import { NORTH_BUILDING_POSITION } from '../../../logic/scenePositions3D'

/**
 * Devrin Kass's post — "The Ties." Legibility pass: the real gameplay
 * viewport is a fixed 720x480 with a far, non-follow camera, so the three
 * pieces are bigger, further apart, and reduced to one mass each — a tall
 * narrow tower, a squat annex, a lookout deck — joined by one chunky beam
 * instead of a plank-plus-rope-rails cluster. The bridge only needs to
 * read as "a connection exists," not show individual planks. Tower vs.
 * annex/deck/bridge also split into two color families (cool pale-blue vs.
 * warm brown) so the height/mass split is reinforced by value, not shape
 * alone. Purely decorative — no interaction, no collision, no logic; only
 * this file changed for the North pilot.
 */
export function NorthWardensPost() {
  const { x, z } = NORTH_BUILDING_POSITION

  return (
    <group position={[x, 0, z]}>
      {/* the tower — one tall, narrow silhouette. No window inset: at
          real gameplay scale it never read as anything but noise. */}
      <mesh position={[0, 0.175, 0]}>
        <boxGeometry args={[1.9, 0.35, 1.9]} />
        <meshStandardMaterial color="#414d61" flatShading />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[1.5, 3.6, 1.5]} />
        <meshStandardMaterial color="#6d7fa0" flatShading />
      </mesh>
      <mesh position={[0, 4.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.3, 1.9, 4]} />
        <meshStandardMaterial color="#414f68" flatShading />
      </mesh>
      {/* a flag — the tallest point in the district, a silhouette
          landmark that needs no glow to be recognizable */}
      <mesh position={[0, 6.15, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 5]} />
        <meshStandardMaterial color="#20293a" flatShading />
      </mesh>
      <mesh position={[0.22, 6.32, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.44, 0.28, 0.02]} />
        <meshStandardMaterial color="#8ca3c2" flatShading />
      </mesh>

      {/* the annex — one squat mass, clearly shorter than the tower and
          pushed further out so there's real air between the two roofs */}
      <group position={[-2.6, 0, 0.75]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.7, 1.5, 1.8]} />
          <meshStandardMaterial color="#7a6650" flatShading />
        </mesh>
        <mesh position={[0, 1.62, -0.1]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[1.8, 0.16, 2.05]} />
          <meshStandardMaterial color="#55473a" flatShading />
        </mesh>
      </group>

      {/* the lookout deck — closest to the plaza, pushed well forward of
          the tower so the bridge crosses a visible gap, not a seam */}
      <group position={[0.6, 0, 3.6]}>
        <mesh position={[-0.65, 0.55, -0.5]}>
          <cylinderGeometry args={[0.09, 0.1, 1.1, 6]} />
          <meshStandardMaterial color="#55473a" flatShading />
        </mesh>
        <mesh position={[0.65, 0.55, 0.5]}>
          <cylinderGeometry args={[0.09, 0.1, 1.1, 6]} />
          <meshStandardMaterial color="#55473a" flatShading />
        </mesh>
        <mesh position={[0, 1.17, 0]}>
          <boxGeometry args={[1.8, 0.14, 1.8]} />
          <meshStandardMaterial color="#5a4c3d" flatShading />
        </mesh>
      </group>

      {/* the bridge — a single chunky beam. It only has to read as "the
          tower and the deck are joined," not show individual planks. */}
      <mesh position={[0.5, 1.235, 1.75]} rotation={[0.07, 0, 0]}>
        <boxGeometry args={[0.9, 0.22, 2.1]} />
        <meshStandardMaterial color="#63533f" flatShading />
      </mesh>
    </group>
  )
}
