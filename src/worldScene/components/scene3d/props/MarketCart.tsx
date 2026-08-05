import type { Position2D } from '../../../logic/movement'

export interface MarketCartProps {
  position: Position2D
  rotationY?: number
}

/**
 * A small two-wheeled market cart — East Trading's own "cart details,"
 * distinct from the Trading Post building's fixed counter/crates.
 */
export function MarketCart({ position, rotationY = 0 }: MarketCartProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.55]} />
        <meshStandardMaterial color="#7a6748" flatShading />
      </mesh>
      <mesh position={[-0.32, 0.18, 0.32]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 10]} />
        <meshStandardMaterial color="#3a3128" flatShading />
      </mesh>
      <mesh position={[0.32, 0.18, 0.32]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 10]} />
        <meshStandardMaterial color="#3a3128" flatShading />
      </mesh>
      <mesh position={[0, 0.61, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.4]} />
        <meshStandardMaterial color="#c9a25a" flatShading />
      </mesh>
      <mesh position={[0.55, 0.42, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#5c4d38" flatShading />
      </mesh>
    </group>
  )
}
