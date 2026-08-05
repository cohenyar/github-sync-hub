export interface PitchedRoofProps {
  /** Span the two slabs slope across (eave-to-eave, before any overhang you bake into the number yourself). */
  width: number
  /** Ridge length. */
  depth: number
  /** Peak height above the eave line. */
  height: number
  /** Eave-level center — where the roof sits on top of the building body. */
  position?: [number, number, number]
  color: string
}

/**
 * A real gable roof — two tilted slabs meeting at a center ridge — replacing
 * a flat slab. Not a 3-sided cylinder: a cylinderGeometry's triangular
 * cross-section can't have width and height set independently, so this uses
 * the same "a tilted box" technique NorthWardensPost's own lean-to annex
 * roof already uses, just as a mirrored pair.
 */
export function PitchedRoof({ width, depth, height, position = [0, 0, 0], color }: PitchedRoofProps) {
  const halfSpan = width / 2
  const pitch = Math.atan2(height, halfSpan)
  const slabLength = Math.hypot(halfSpan, height)

  return (
    <group position={position}>
      <mesh position={[-halfSpan / 2, height / 2, 0]} rotation={[0, 0, pitch]}>
        <boxGeometry args={[slabLength, 0.12, depth]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[halfSpan / 2, height / 2, 0]} rotation={[0, 0, -pitch]}>
        <boxGeometry args={[slabLength, 0.12, depth]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  )
}
