export interface DoorProps {
  width: number
  height: number
  position: [number, number, number]
  rotationY?: number
  color?: string
}

/** A single flat panel — the same technique MathAcademy/EnglishCenter already used inline, generalized so every building can place one. */
export function Door({ width, height, position, rotationY = 0, color = '#232b3d' }: DoorProps) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}
