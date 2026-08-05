export interface DomedRoofProps {
  radius: number
  position?: [number, number, number]
  color: string
  emissive?: string
  emissiveIntensity?: number
}

/** A half-sphere dome — the exact geometry EnglishCenter's roof already used inline, generalized so any building can have a rounded roof to contrast with a pitched one. */
export function DomedRoof({ radius, position = [0, 0, 0], color, emissive, emissiveIntensity }: DomedRoofProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} flatShading />
    </mesh>
  )
}
