import { he } from '../../../../i18n'
import { LEARNING_BUILDING_SCALE, MATH_ACADEMY_POSITION } from '../../../logic/scenePositions3D'
import { WorldLabel } from '../WorldLabel'
import { Door } from './parts/Door'
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
 */
export function MathAcademy({ isHighlighted = false, isCompleted = false }: MathAcademyProps) {
  const { x, z } = MATH_ACADEMY_POSITION

  return (
    <group position={[x, 0, z]} scale={LEARNING_BUILDING_SCALE}>
      {/* Design pass — local Y is pre-scale (this whole group scales by
          LEARNING_BUILDING_SCALE=1.2), chosen so the label lands just
          above the roof's actual world-space peak (~3.1 * 1.2 ≈ 3.7). */}
      <WorldLabel position={[0, 3.5, 0]} text={he.mathAcademyName} testId="math-academy-label" />
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
      <Door width={0.7} height={1.1} position={[0, 0.55, -1.11]} color={DOOR_COLOR} />
      {/* Game Feel pass — two real window openings flanking the existing
          lantern, giving the wall actual façade detail instead of a bare
          panel. Kept clear of the lantern (x=0.55) and the sign above. */}
      <WindowFrame width={0.4} height={0.5} position={[-1.0, 0.85, -1.11]} />
      <WindowFrame width={0.4} height={0.5} position={[1.0, 0.85, -1.11]} />
      {/* Sign: enlarged slightly and tilted toward the fixed elevated
          camera (rotation.x) so its face reads more directly instead of
          nearly edge-on. */}
      <SignPost postHeight={0} position={[0, 2.05, -1.16]} tiltX={-0.3} boardWidth={1.3} boardHeight={0.45} boardColor={ACCENT_COLOR} />
      {/* A small warm lantern beside the door — a subtle emissive accent
          rather than a new dynamic light source, matching LampPost's own
          glowing-sphere language. */}
      <mesh position={[0.55, 0.9, -1.1]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color={LANTERN_COLOR} emissive={LANTERN_COLOR} emissiveIntensity={0.9} flatShading />
      </mesh>
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
