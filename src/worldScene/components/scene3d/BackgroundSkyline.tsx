interface SilhouettePosition {
  x: number
  z: number
}

/** A small house silhouette — muted, dark tones so it recedes rather than competing with real buildings. */
function DistantHouse({ x, z }: SilhouettePosition) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 1, 1.4]} />
        <meshStandardMaterial color="#232c3d" flatShading />
      </mesh>
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.1, 0.7, 4]} />
        <meshStandardMaterial color="#1b2230" flatShading />
      </mesh>
    </group>
  )
}

function DistantTree({ x, z }: SilhouettePosition) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.8, 6]} />
        <meshStandardMaterial color="#2a2420" flatShading />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.75, 1.3, 8]} />
        <meshStandardMaterial color="#243326" flatShading />
      </mesh>
    </group>
  )
}

function DistantWaterTower({ x, z }: SilhouettePosition) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.8, 6]} />
        <meshStandardMaterial color="#2c333f" flatShading />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.6, 10]} />
        <meshStandardMaterial color="#333c4a" flatShading />
      </mesh>
    </group>
  )
}

/**
 * A ring of small, muted, non-interactive silhouettes beyond the movement
 * bounds — purely a backdrop to suggest the city continues past what's
 * playable. Deliberately dim and desaturated (no emissive materials
 * anywhere here) so nothing in this component ever competes with the
 * Records Core, the district buildings, or the props for attention.
 * "Not explorable" is enforced by the existing movement bounds (±14) —
 * nothing here has any interaction code at all.
 */
export function BackgroundSkyline() {
  return (
    <group>
      <DistantHouse x={16} z={-16} />
      <DistantHouse x={-17} z={-15} />
      <DistantHouse x={-16} z={17} />
      <DistantTree x={17} z={15} />
      <DistantTree x={-19} z={3} />
      <DistantWaterTower x={19} z={-4} />
    </group>
  )
}
