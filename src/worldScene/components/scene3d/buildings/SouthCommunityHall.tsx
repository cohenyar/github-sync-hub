import { SOUTH_BUILDING_POSITION } from '../../../logic/scenePositions3D'

/** Priya Nandall's hall — a wide, flat-roofed civic building. */
export function SouthCommunityHall() {
  const { x, z } = SOUTH_BUILDING_POSITION

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[3.2, 1.4, 2.2]} />
        <meshStandardMaterial color="#7d6a55" flatShading />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[3.5, 0.16, 2.5]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
    </group>
  )
}
