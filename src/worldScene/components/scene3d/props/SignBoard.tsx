import type { Position2D } from '../../../logic/movement'

export interface SignBoardProps {
  position: Position2D
  rotationY?: number
}

export function SignBoard({ position, rotationY = 0 }: SignBoardProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshStandardMaterial color="#4a4038" flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.06]} />
        <meshStandardMaterial color="#8f7a52" flatShading />
      </mesh>
    </group>
  )
}
