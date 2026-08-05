export interface ChimneyProps {
  position: [number, number, number]
  width?: number
  height?: number
  color?: string
}

/** A single small box, off-ridge-center like a real chimney — used where a building's role (a hearth) calls for one. */
export function Chimney({ position, width = 0.3, height = 0.6, color = '#4a3f36' }: ChimneyProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, width]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}
