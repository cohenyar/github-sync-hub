import { he } from '../../../../i18n'
import { CORE_ARCHIVE_POSITION } from '../../../logic/scenePositions3D'
import { WorldLabel } from '../WorldLabel'
import { Door } from './parts/Door'
import { SignPost } from './parts/SignPost'
import { WindowFrame } from './parts/WindowFrame'

/**
 * A small archive structure behind Mera Solt (and, later, Kestrel Vane) —
 * purely decorative scenery, no interaction, no unlock gating. The body and
 * cap (a squat cylinder + a shallow cone) are untouched; Game Feel pass
 * adds a real door, two windows, and a sign on the -Z face (facing Mera/
 * city-voice, both stationed north of here), giving it the same façade
 * treatment every other named building now has. Windows glow a cool
 * violet-white rather than the warm amber every other building uses,
 * matching DistrictMarker's own Core palette — this building visually
 * belongs to the Core, not to any one district.
 *
 * Playtest fix pass (issue 2) — the actual interactable (the Records Hub
 * destination marker) stands a few meters away and had no visible name of
 * its own; this building is the thing a player naturally associates with
 * "the Records Hub," so its floating name label (same <Html> technique as
 * TeacherNpcAccents, not drei's <Text> — see that file's own comment on
 * why) is what actually answers "what is this place" on approach. The
 * building itself is not the interactable and stays exactly that: scenery.
 */
export function CoreArchiveBuilding() {
  const { x, z } = CORE_ARCHIVE_POSITION

  return (
    <group position={[x, 0, z]}>
      <WorldLabel position={[0, 3.1, 0]} text={he.recordsCoreName} testId="core-archive-building-label" />
      {/* Meridian 1.2 palette pass: nudged from #4a4358/#5f5570 toward the
          brand's violet, matching DistrictMarker's Core landmark color —
          both were already this hue family, just desaturated. */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 1.8, 12]} />
        <meshStandardMaterial color="#584a72" flatShading />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <coneGeometry args={[1.55, 0.9, 12]} />
        <meshStandardMaterial color="#6f5f8a" flatShading />
      </mesh>
      <Door width={0.55} height={0.9} position={[0, 0.5, -1.4]} color="#232833" />
      <WindowFrame width={0.32} height={0.42} position={[-0.55, 1.15, -1.34]} glowColor="#d8c9ff" />
      <WindowFrame width={0.32} height={0.42} position={[0.55, 1.15, -1.34]} glowColor="#d8c9ff" />
      <SignPost postHeight={0} position={[0, 1.85, -1.32]} tiltX={-0.3} boardWidth={0.55} boardHeight={0.3} boardColor="#9d7bff" />
    </group>
  )
}
