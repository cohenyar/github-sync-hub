import type { Group } from 'three'
import { useSway } from '../useSway'
import type { Position2D } from '../../../logic/movement'

export interface BushProps {
  position: Position2D
}

/**
 * A low, rounded shrub cluster — ground-level greening distinct from
 * Planter's potted shrub. World Polish pass: sways gently, same shared
 * useSway hook every other swaying prop uses.
 */
export function Bush({ position }: BushProps) {
  const swayRef = useSway<Group>(`bush-${position.x}-${position.z}`)

  return (
    <group position={[position.x, 0, position.z]}>
      <group ref={swayRef} position={[0, 0.28, 0]}>
        <mesh position={[-0.15, 0, 0.05]}>
          <sphereGeometry args={[0.24, 8, 6]} />
          <meshStandardMaterial color="#3f7a4f" flatShading />
        </mesh>
        <mesh position={[0.16, 0.03, -0.05]}>
          <sphereGeometry args={[0.2, 8, 6]} />
          <meshStandardMaterial color="#4c8a58" flatShading />
        </mesh>
        <mesh position={[0, -0.05, -0.15]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshStandardMaterial color="#3a6f47" flatShading />
        </mesh>
      </group>
    </group>
  )
}
