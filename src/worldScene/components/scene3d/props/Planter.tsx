import type { Position2D } from '../../../logic/movement'

export interface PlanterProps {
  position: Position2D
}

export function Planter({ position }: PlanterProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.28, 0.24, 0.4, 10]} />
        <meshStandardMaterial color="#5c4c3c" flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.32, 0.5, 8]} />
        <meshStandardMaterial color="#3f7a4f" flatShading />
      </mesh>
    </group>
  )
}
