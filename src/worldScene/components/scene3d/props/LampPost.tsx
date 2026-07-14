import type { Position2D } from '../../../logic/movement'

export interface LampPostProps {
  position: Position2D
}

/** A thin pole with a warm emissive head — fits the "database city at night" mood already established. */
export function LampPost({ position }: LampPostProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#3a4250" flatShading />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#f5d98a" emissive="#f5d98a" emissiveIntensity={0.8} flatShading />
      </mesh>
    </group>
  )
}
