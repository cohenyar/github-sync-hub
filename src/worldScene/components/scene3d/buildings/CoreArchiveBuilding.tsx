import { he } from '../../../../i18n'
import { CORE_ARCHIVE_POSITION } from '../../../logic/scenePositions3D'
import { WorldLabel } from '../WorldLabel'
import { Door } from './parts/Door'
import { SignPost } from './parts/SignPost'
import { WindowFrame } from './parts/WindowFrame'

// Art-direction pass — "modern archive/civic history center" identity.
// Stone tones stay in the body's own established violet-stone family
// (WORLD_PALETTE.core), just split into distinct values per part so the
// new detail actually reads instead of blending into one flat mass.
const STONE_DARK = '#453a5c' // WORLD_PALETTE.core.stoneDark — foundation, a shade darker than the #584a72 wall.
const PLAQUE_BRONZE = '#b8925a' // WORLD_PALETTE.history.plaque — warm brass/bronze, deliberately NOT violet, so the plaque reads as an applied civic fixture rather than more Core architecture.

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
 *
 * World art-direction pass ("modern archive/civic history center") — the
 * body/cap/door/windows/label above are all untouched (same dimensions,
 * same position, same violet window glow — that glow stays this building's
 * signature material identity). New: a foundation band so the cylinder
 * reads as built rather than floating, and the existing sign recolored from
 * violet to a bronze plaque (so it reads as an applied civic marker, not
 * more Core glow — a free change, no extra geometry).
 *
 * Perf pass — the art-direction pass originally also added two stone
 * pilasters, a two-tier entrance landing, two Lanterns, a pulsing emblem,
 * and a bench, all clustered around the door on this building's -Z face.
 * Direct investigation (this scene's fixed camera sits at [0,24.3,28.8]
 * looking at the origin; this building's -Z face, like every other
 * building's entrance here, faces *away* from that camera, occluded by the
 * building's own body at every zoom level including the dialogue-zoomed
 * view) confirmed all of that detail was genuinely invisible in real
 * gameplay screenshots — not just hard to see, structurally hidden. Per
 * "spend geometry where the player can actually see it," it was cut
 * entirely rather than kept as invisible cost; the foundation band and
 * bronze plaque recolor survive because both remain visible from this
 * camera (the band at the base silhouette, the plaque's own position
 * unchanged from before this pass).
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

      {/* Foundation band — a slightly wider, darker ring at the very base
          so the body reads as constructed rather than a floating primitive. */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[1.45, 1.5, 0.15, 12]} />
        <meshStandardMaterial color={STONE_DARK} flatShading />
      </mesh>

      <Door width={0.55} height={0.9} position={[0, 0.5, -1.4]} color="#232833" />
      <WindowFrame width={0.32} height={0.42} position={[-0.55, 1.15, -1.34]} glowColor="#d8c9ff" />
      <WindowFrame width={0.32} height={0.42} position={[0.55, 1.15, -1.34]} glowColor="#d8c9ff" />

      {/* The existing sign, recolored from violet to a warm bronze plaque —
          an applied civic fixture, distinct from the building's own
          violet-toned architecture, rather than more Core glow. */}
      <SignPost postHeight={0} position={[0, 1.85, -1.32]} tiltX={-0.3} boardWidth={0.55} boardHeight={0.3} boardColor={PLAQUE_BRONZE} />
    </group>
  )
}
