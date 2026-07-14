import { CORE_ARCHIVE_POSITION } from '../../../logic/scenePositions3D'

/**
 * A small archive structure behind Mera Solt (and, later, Kestrel Vane) —
 * purely decorative scenery, no interaction, no unlock gating. Two
 * primitives: a squat cylinder body and a shallow cone cap.
 */
export function CoreArchiveBuilding() {
  const { x, z } = CORE_ARCHIVE_POSITION

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 1.8, 12]} />
        <meshStandardMaterial color="#4a4358" flatShading />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <coneGeometry args={[1.55, 0.9, 12]} />
        <meshStandardMaterial color="#5f5570" flatShading />
      </mesh>
    </group>
  )
}
