import type { Position2D } from '../../../logic/movement'

export interface FlowerbedProps {
  position: Position2D
}

const BLOOMS: ReadonlyArray<{ x: number; z: number; color: string }> = [
  { x: -0.18, z: 0.1, color: '#e08fc0' },
  { x: 0.15, z: -0.08, color: '#f0d15a' },
  { x: 0.02, z: 0.18, color: '#e08fc0' },
  { x: -0.05, z: -0.18, color: '#f0d15a' },
]

/**
 * A small flat bed of color — a few low bloom clusters (one mesh per bloom,
 * no individually modeled petals). Static: blooms this small don't
 * visibly sway, so this doesn't spend a useFrame subscription on it.
 */
export function Flowerbed({ position }: FlowerbedProps) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.32, 0.34, 0.06, 10]} />
        <meshStandardMaterial color="#3d5a35" flatShading />
      </mesh>
      {BLOOMS.map((bloom, index) => (
        <mesh key={index} position={[bloom.x, 0.12, bloom.z]}>
          <coneGeometry args={[0.07, 0.14, 6]} />
          <meshStandardMaterial color={bloom.color} flatShading />
        </mesh>
      ))}
    </group>
  )
}
