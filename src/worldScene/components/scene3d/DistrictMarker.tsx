import type { ThreeEvent } from '@react-three/fiber'
import type { DistrictStatus } from '../../../worldState'
import { getDistrictPosition3D } from '../../logic/scenePositions3D'
import { useEmissivePulse } from './useEmissivePulse'

export interface DistrictMarkerProps {
  districtId: string
  status: DistrictStatus
  isCore: boolean
  isHighlighted?: boolean
  onClick?: () => void
}

// Meridian 1.2 palette pass: nudged toward the brand's blue/violet/cyan
// triad (thriving/stable) while keeping unstable's muted, unresolved grey —
// the three states still need to read as distinct at a glance, not just
// "on-brand."
const STATUS_COLOR: Record<DistrictStatus, string> = {
  thriving: '#43e5d6',
  stable: '#5b8cff',
  unstable: '#8394ad',
}

const CORE_EMISSIVE_INTENSITY = 0.6
const CORE_HIGHLIGHT_EMISSIVE_INTENSITY = 1.2

// Signal Beacon pass — the lens rides useEmissivePulse (same hook LampPost's
// heads use) so it reads as "broadcasting," but with a smaller amplitude
// than that hook's own default (0.25): the idle range (0.45-0.75) and the
// highlighted range (1.05-1.35) still never overlap, so the isHighlighted
// brightness jump stays legible at every point in the cycle, while the
// pulse itself stays a gentle breathe rather than a strobe.
const CORE_LENS_PULSE_AMPLITUDE = 0.15

// Signal Beacon's own violet-stone tower tones — matches CoreArchiveBuilding's
// established body/cap colors (#584a72/#6f5f8a) so the Beacon and the
// Archive read as the same architectural family, plus the shared
// foundation.stone tone (see worldPalette.ts) for the base band every
// constructed building in this pass gets.
const BEACON_FOUNDATION_COLOR = '#3a3f4d'
const BEACON_TOWER_LOWER_COLOR = '#584a72'
const BEACON_TOWER_UPPER_COLOR = '#6f5f8a'
const BEACON_GALLERY_RING_COLOR = '#a89bc4'
const BEACON_LENS_COLOR = '#d8c9ff'

/**
 * A simple flat-shaded primitive per district — a box for the three real
 * districts. The Records Core instead renders the Signal Beacon: an
 * observatory-style tower (foundation band, a two-stage tapered body, a
 * thin viewing-gallery ring, and a faceted glowing lens cap) so it reads as
 * Meridian's one constructed landmark rather than just another marker. Only
 * the Core is ever clickable (see WorldScene3D); the others are landmarks
 * whose color reflects district status, and whose proximity silently
 * reveals NPCs. isHighlighted brightens the Beacon's lens when it's the
 * current interaction target, matching the Hebrew prompt — same idle/
 * highlighted intensities the old cone used (0.6 / 1.2), just carried by
 * the lens mesh instead of the whole shape.
 */
export function DistrictMarker({ districtId, status, isCore, isHighlighted = false, onClick }: DistrictMarkerProps) {
  const position = getDistrictPosition3D(districtId)
  const statusColor = STATUS_COLOR[status]
  const lensBaseIntensity = isHighlighted ? CORE_HIGHLIGHT_EMISSIVE_INTENSITY : CORE_EMISSIVE_INTENSITY
  const lensMaterialRef = useEmissivePulse('core-beacon-lens', lensBaseIntensity, CORE_LENS_PULSE_AMPLITUDE)

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick?.()
  }

  if (isCore) {
    return (
      <group position={[position.x, 0, position.z]} onClick={onClick ? handleClick : undefined}>
        {/* Foundation band — a darker, wider ring at the very base so the
            tower reads as built into the ground, not a floating primitive. */}
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[1.02, 1.12, 0.22, 12]} />
          <meshStandardMaterial color={BEACON_FOUNDATION_COLOR} flatShading />
        </mesh>

        {/* Tower body, lower stage — wider, matching CoreArchiveBuilding's own body tone. */}
        <mesh position={[0, 0.87, 0]}>
          <cylinderGeometry args={[0.72, 0.95, 1.3, 10]} />
          <meshStandardMaterial color={BEACON_TOWER_LOWER_COLOR} flatShading />
        </mesh>

        {/* Viewing-gallery ring — a thin torus ledge at the seam between the
            two tower stages, reading as an observation deck. Purely
            decorative, not emissive: the lens below is the Beacon's one
            light source, so this stays a plain stone/metal accent. */}
        <mesh position={[0, 1.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8, 0.05, 8, 20]} />
          <meshStandardMaterial color={BEACON_GALLERY_RING_COLOR} flatShading />
        </mesh>

        {/* Tower body, upper stage — narrower, continuing the taper up to the lens. */}
        <mesh position={[0, 2.02, 0]}>
          <cylinderGeometry args={[0.42, 0.68, 1.0, 10]} />
          <meshStandardMaterial color={BEACON_TOWER_UPPER_COLOR} flatShading />
        </mesh>

        {/* Faceted lens cap — the Beacon's signal source. A low-poly
            octahedron (detail 0) for a crystal/lens silhouette, glowing
            violet-white and gently pulsing (useEmissivePulse) to tie back
            to the Core's "broadcasting a signal" fiction. Idle vs.
            highlighted intensity matches the marker's old cone exactly. */}
        <mesh position={[0, 2.87, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            ref={lensMaterialRef}
            color={BEACON_LENS_COLOR}
            emissive={BEACON_LENS_COLOR}
            emissiveIntensity={lensBaseIntensity}
            flatShading
          />
        </mesh>
      </group>
    )
  }

  return (
    <mesh position={[position.x, 0.5, position.z]} onClick={onClick ? handleClick : undefined}>
      <boxGeometry args={[1.6, 1, 1.6]} />
      <meshStandardMaterial color={statusColor} flatShading />
    </mesh>
  )
}
