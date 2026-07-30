import type { ThreeEvent } from '@react-three/fiber'
import type { DistrictStatus } from '../../../worldState'
import { getDistrictPosition3D } from '../../logic/scenePositions3D'

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

// Was amber/gold (#f5b800) — didn't match any part of the established
// brand palette and read as a stray traffic-light color next to the
// status-colored districts. Violet makes the Core read as "the landmark,"
// distinct from every status color a district can have.
const CORE_COLOR = '#9d7bff'

const CORE_EMISSIVE_INTENSITY = 0.6
const CORE_HIGHLIGHT_EMISSIVE_INTENSITY = 1.2

/**
 * A simple flat-shaded primitive per district — a box for the three real
 * districts, a taller, larger, emissive cone for the Records Core so it
 * reads as visually dominant rather than just another landmark. Only the
 * Core is ever clickable (see WorldScene3D); the others are landmarks whose
 * color reflects district status, and whose proximity silently reveals
 * NPCs. isHighlighted brightens the Core when it's the current interaction
 * target, matching the Hebrew prompt.
 */
export function DistrictMarker({ districtId, status, isCore, isHighlighted = false, onClick }: DistrictMarkerProps) {
  const position = getDistrictPosition3D(districtId)
  const color = isCore ? CORE_COLOR : STATUS_COLOR[status]

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick?.()
  }

  return (
    <mesh position={[position.x, isCore ? 1.1 : 0.5, position.z]} onClick={onClick ? handleClick : undefined}>
      {isCore ? <coneGeometry args={[1.8, 2.6, 4]} /> : <boxGeometry args={[1.6, 1, 1.6]} />}
      <meshStandardMaterial
        color={color}
        emissive={isCore ? color : undefined}
        emissiveIntensity={isCore ? (isHighlighted ? CORE_HIGHLIGHT_EMISSIVE_INTENSITY : CORE_EMISSIVE_INTENSITY) : undefined}
        flatShading
      />
    </mesh>
  )
}
