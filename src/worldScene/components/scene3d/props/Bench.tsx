import type { Position2D } from '../../../logic/movement'

export interface BenchProps {
  position: Position2D
  rotationY?: number
}

export function Bench({ position, rotationY = 0 }: BenchProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[-0.5, 0.22, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.44, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0.5, 0.22, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.44, 6]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[1.3, 0.08, 0.4]} />
        <meshStandardMaterial color="#7d6a55" flatShading />
      </mesh>
      <mesh position={[0, 0.72, -0.17]}>
        <boxGeometry args={[1.3, 0.4, 0.06]} />
        <meshStandardMaterial color="#7d6a55" flatShading />
      </mesh>
    </group>
  )
}
