import { he } from '../../../../i18n'
import { LEARNING_BUILDING_SCALE, MATH_ACADEMY_POSITION } from '../../../logic/scenePositions3D'
import { WORLD_PALETTE } from '../../../logic/worldPalette'
import { WorldLabel } from '../WorldLabel'
import { Door } from './parts/Door'
import { Lantern } from './parts/Lantern'
import { SignPost } from './parts/SignPost'
import { WindowFrame } from './parts/WindowFrame'

export interface MathAcademyProps {
  /** Brightens the roof accent when this building is the player's chosen learning path (Batch 3A.2). */
  isHighlighted?: boolean
  /** Batch 3A.5 — shows a small, restrained completion badge near the sign once lesson:math-001 is completed. Independent of isHighlighted: the two can be true at once. */
  isCompleted?: boolean
}

// Batch 3A.5: brightened from the original #4d5f82/#2f3c56 — at the fixed
// camera's distance and the scene's dark ambient/fog, the original muted
// tones read as barely distinguishable from the night background (confirmed
// via a screenshot). Same hue family (cool slate blue), just more saturated
// and lighter so the silhouette actually reads at a glance.
const WALL_COLOR = '#5f74a3'
const ROOF_COLOR = '#3d4d70'
const ACCENT_COLOR = '#e8c14a'
const DOOR_COLOR = '#232b3d'
const LANTERN_COLOR = '#ffcf8a'
const COMPLETED_COLOR = '#5fd382'
// Art Direction pass ("modern academy / observatory") — Math's own
// distinguishing accent, pulled from WORLD_PALETTE.math rather than
// invented fresh: a cool blue used on the window panes and the roof ring
// below, a deliberate contrast against every other building's warm amber
// glow (which this building keeps only on its entrance lantern).
const ACCENT_COOL = WORLD_PALETTE.math.accentCool
// A touch darker than WALL_COLOR — same cool-slate family, already
// reserved for Math in WORLD_PALETTE but previously unused — for the new
// foundation collar.
const FOUNDATION_COLOR = WORLD_PALETTE.math.wallDark

/**
 * A cool-toned, pyramid-roofed building — deliberately distinct in
 * silhouette and palette from every existing district building (all warm
 * browns/tans) and from EnglishCenter's rounded dome. The door sits on the
 * -Z face (facing back toward the spawn/approach direction).
 *
 * Batch 3A.5: the whole body is wrapped in one scale group
 * (LEARNING_BUILDING_SCALE) rather than resizing individual meshes, so
 * every proportion below is unchanged from the original design — only the
 * silhouette's overall size increased. The sign is enlarged and tilted
 * slightly toward the fixed camera's elevated angle for readability; a
 * small warm lantern accent sits beside the door.
 *
 * Art Direction pass ("modern academy / observatory / structured science
 * learning"): the existing pyramid roof is the building's triangular
 * "observation feature" already — leaned into further with a cool-blue-lit
 * ring band around its base (same torus technique as
 * TeacherNpcAccents.tsx's rings) suggesting an observatory collar, rather
 * than replacing the roof shape. The two original windows became a 2x2
 * grid (repetition of the same small WindowFrame part is the "geometric
 * motif" the brief asked for) and now glow cool blue instead of the
 * universal warm amber, while the entrance Lantern (now the real shared
 * part, not an inline sphere) stays warm — a deliberate warm-entrance /
 * cool-interior contrast. A darker, wider foundation collar grounds the
 * body, and a small entrance planter adds local environmental detail.
 * isHighlighted/isCompleted keep their exact prior colors/behavior — both
 * are cross-building state signals (amber = selected path, green =
 * completed), not decoration this pass should touch.
 */
export function MathAcademy({ isHighlighted = false, isCompleted = false }: MathAcademyProps) {
  const { x, z } = MATH_ACADEMY_POSITION

  return (
    <group position={[x, 0, z]} scale={LEARNING_BUILDING_SCALE}>
      {/* Design pass — local Y is pre-scale (this whole group scales by
          LEARNING_BUILDING_SCALE=1.2), chosen so the label lands just
          above the roof's actual world-space peak (~3.1 * 1.2 ≈ 3.7). */}
      <WorldLabel position={[0, 3.5, 0]} text={he.mathAcademyName} testId="math-academy-label" />
      {/* Art Direction pass — a darker, slightly wider collar at the very
          base (WORLD_PALETTE.math.wallDark) so the body reads as founded
          on the ground rather than floating. Widened in X only (matching
          the wall's own Z depth exactly) so it can never step in front of
          the door mesh below. */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.8, 0.2, 2.2]} />
        <meshStandardMaterial color={FOUNDATION_COLOR} flatShading />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.6, 2.2, 2.2]} />
        <meshStandardMaterial color={WALL_COLOR} flatShading />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.85, 1.1, 4]} />
        <meshStandardMaterial
          color={ROOF_COLOR}
          emissive={isHighlighted ? ACCENT_COLOR : undefined}
          emissiveIntensity={isHighlighted ? 0.6 : 0}
          flatShading
        />
      </mesh>
      {/* Art Direction pass — a thin, cool-blue-lit ring encircling the
          upper roof: the "circular observation feature" the brief asked
          for, built with the same torusGeometry technique
          TeacherNpcAccents.tsx already uses for its rings. Deliberately
          placed at y=2.5, well above the sign's own height band (peaks at
          ~2.275) so its front arc — the closest part of the ring to the
          fixed camera, since it wraps out beyond the -Z face — never
          crosses in front of the sign. Sized to clear the pyramid's own
          cross-section at this height on every side (a circular ring can
          never sit flush against a square pyramid), so it reads as a
          distinct collar/instrument band, not a clipping artifact. Subtle
          intensity — it's a nod, not a second signal. */}
      <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.04, 8, 24]} />
        <meshStandardMaterial color={ACCENT_COOL} emissive={ACCENT_COOL} emissiveIntensity={0.3} flatShading />
      </mesh>
      <Door width={0.7} height={1.1} position={[0, 0.55, -1.11]} color={DOOR_COLOR} />
      {/* Art Direction pass — glow shifted from the universal warm amber to
          Math's own cool blue (WORLD_PALETTE.math.accentCool), this
          building's distinguishing "cool blue accent lighting."
          Perf pass — the art-direction pass originally expanded this to a
          2x2 grid (4 WindowFrame instances) for a "geometric motif." Direct
          investigation (both this face's camera occlusion, matching every
          other building here, and this component's own live-verification
          report at the time) confirmed the extra pair read as plain dark
          wall at actual gameplay distance, not distinguishable as windows —
          cut back to the original 2, which still carry the cool-blue accent
          this building is distinguished by. */}
      <WindowFrame width={0.4} height={0.45} position={[-1.0, 0.85, -1.11]} glowColor={ACCENT_COOL} />
      <WindowFrame width={0.4} height={0.45} position={[1.0, 0.85, -1.11]} glowColor={ACCENT_COOL} />
      {/* Sign: enlarged slightly and tilted toward the fixed elevated
          camera (rotation.x) so its face reads more directly instead of
          nearly edge-on. */}
      <SignPost postHeight={0} position={[0, 2.05, -1.16]} tiltX={-0.3} boardWidth={1.3} boardHeight={0.45} boardColor={ACCENT_COLOR} />
      {/* Art Direction pass — the inline glowing sphere became the real
          Lantern part (a glow plus a small wall-mount bracket), staying
          warm on purpose: a warm entrance beside cool-blue windows is a
          deliberate contrast, not an inconsistency. */}
      <Lantern position={[0.55, 0.9, -1.15]} glowColor={LANTERN_COLOR} />
      {/* Art Direction pass — a small entrance planter (pot + trimmed
          canopy sphere, matching WORLD_PALETTE.foliage), the local
          environmental prop touch called for, kept to this building's own
          group. Placed clear of the door, lantern, and windows. */}
      <group position={[-1.55, 0, -1.4]}>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.16, 0.19, 0.22, 8]} />
          <meshStandardMaterial color="#4a3f36" flatShading />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshStandardMaterial color={WORLD_PALETTE.foliage.canopy} flatShading />
        </mesh>
      </group>
      {isCompleted && (
        <mesh position={[0, 2.75, -1.16]}>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial
            color={COMPLETED_COLOR}
            emissive={COMPLETED_COLOR}
            emissiveIntensity={0.85}
            flatShading
          />
        </mesh>
      )}
    </group>
  )
}
