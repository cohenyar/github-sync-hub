import type { Position2D } from '../../../logic/movement'

export interface FenceProps {
  position: Position2D
  rotationY?: number
  segments?: number
}

/** A short run of fence posts with a single rail — purely decorative, no collision. */
export function Fence({ position, rotationY = 0, segments = 3 }: FenceProps) {
  const spacing = 0.5
  const railLength = segments * spacing

  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: segments }, (_, index) => (index - (segments - 1) / 2) * spacing).map((offsetX, index) => (
        <mesh key={index} position={[offsetX, 0.25, 0]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#4a4038" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[railLength, 0.06, 0.06]} />
        <meshStandardMaterial color="#4a4038" flatShading />
      </mesh>
    </group>
  )
}
