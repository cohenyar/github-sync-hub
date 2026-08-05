import { useEmissivePulse } from '../useEmissivePulse'
import type { Position2D } from '../../../logic/movement'

export interface LampPostProps {
  position: Position2D
  /** World Polish pass — lets a district-specific lamp (e.g. Core Archive's violet accent) share this exact shape without a bespoke component. Defaults to the original warm color, so every existing call site renders identically. */
  glowColor?: string
}

const BASE_EMISSIVE_INTENSITY = 0.8

/**
 * A thin pole with a warm emissive head — fits the "database city at
 * night" mood already established. World Polish pass: the head now pulses
 * gently (useEmissivePulse) — every lamp in the world gets this for free.
 */
export function LampPost({ position, glowColor = '#f5d98a' }: LampPostProps) {
  const materialRef = useEmissivePulse(`lamp-${position.x}-${position.z}`, BASE_EMISSIVE_INTENSITY)

  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#3a4250" flatShading />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial
          ref={materialRef}
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={BASE_EMISSIVE_INTENSITY}
          flatShading
        />
      </mesh>
    </group>
  )
}
