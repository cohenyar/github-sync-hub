export interface WindowFrameProps {
  width: number
  height: number
  position: [number, number, number]
  rotationY?: number
  /** Deliberately static, no pulse — a lit window should read as "occupied," not compete with a landmark's glow. */
  glowColor?: string
  frameColor?: string
  emissiveIntensity?: number
}

/** A dark frame plus a warm, statically-lit pane — the "window" is a real two-mesh detail now, not one overlaid rectangle. */
export function WindowFrame({
  width,
  height,
  position,
  rotationY = 0,
  glowColor = '#ffcf8a',
  frameColor = '#2a2f3d',
  emissiveIntensity = 0.45,
}: WindowFrameProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.04]} />
        <meshStandardMaterial color={frameColor} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[width, height, 0.03]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={emissiveIntensity} flatShading />
      </mesh>
    </group>
  )
}
