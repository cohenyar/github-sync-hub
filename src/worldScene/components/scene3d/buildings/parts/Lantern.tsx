export interface LanternProps {
  position: [number, number, number]
  glowColor?: string
  armColor?: string
  radius?: number
  emissiveIntensity?: number
}

/**
 * World art-direction pass — formalizes the "exterior lamp" building part
 * the original parts-kit plan called for. Every building that wanted a
 * lantern before this used a bare glowing sphere inlined at its own call
 * site (MathAcademy.tsx, EnglishCenter.tsx) — this adds a small wall-mount
 * bracket so it reads as a fixture attached to the building, not a stray
 * glowing ball floating beside it. Kept to 2 meshes (matching every other
 * part in this kit's low-poly/mobile-perf convention).
 */
export function Lantern({
  position,
  glowColor = '#ffcf8a',
  armColor = '#2a2f3d',
  radius = 0.11,
  emissiveIntensity = 0.9,
}: LanternProps) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.14, 5]} />
        <meshStandardMaterial color={armColor} flatShading />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 10, 10]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={emissiveIntensity} flatShading />
      </mesh>
    </group>
  )
}
