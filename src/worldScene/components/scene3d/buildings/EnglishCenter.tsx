import { he } from '../../../../i18n'
import { ENGLISH_CENTER_POSITION, LEARNING_BUILDING_SCALE } from '../../../logic/scenePositions3D'
import { WorldLabel } from '../WorldLabel'
import { DomedRoof } from './parts/DomedRoof'
import { Door } from './parts/Door'
import { SignPost } from './parts/SignPost'
import { WindowFrame } from './parts/WindowFrame'

export interface EnglishCenterProps {
  /** Brightens the roof accent when this building is the player's chosen learning path (Batch 3A.2). */
  isHighlighted?: boolean
  /** Batch 3A.5 — shows a small, restrained completion badge near the sign once lesson:english-001 is completed. Independent of isHighlighted: the two can be true at once. */
  isCompleted?: boolean
}

// Batch 3A.5: brightened from the original #9c7a5a/#7a4f42 for the same
// readability reason as MathAcademy's — same warm-tan hue family, lighter
// and more saturated.
const WALL_COLOR = '#b08a63'
const ROOF_COLOR = '#8f5e4c'
const ACCENT_COLOR = '#e0c9a6'
const DOOR_COLOR = '#3a2a22'
const LANTERN_COLOR = '#ffcf8a'
const COMPLETED_COLOR = '#5fd382'

/**
 * A warm-toned, domed-roof building — a cylinder body with a hemisphere
 * roof, deliberately distinct in silhouette from MathAcademy's angular
 * pyramid and every existing district building. The door sits on the -Z
 * face, matching MathAcademy's orientation.
 *
 * Batch 3A.5: the whole body is wrapped in one scale group
 * (LEARNING_BUILDING_SCALE) rather than resizing individual meshes, so
 * every proportion below is unchanged from the original design — only the
 * silhouette's overall size increased. The sign is enlarged and tilted
 * slightly toward the fixed camera's elevated angle for readability; a
 * small warm lantern accent sits beside the door.
 */
export function EnglishCenter({ isHighlighted = false, isCompleted = false }: EnglishCenterProps) {
  const { x, z } = ENGLISH_CENTER_POSITION

  return (
    <group position={[x, 0, z]} scale={LEARNING_BUILDING_SCALE}>
      {/* Design pass — local Y is pre-scale (this whole group scales by
          LEARNING_BUILDING_SCALE=1.2), chosen so the label lands just
          above the dome's actual world-space peak (~3.35 * 1.2 ≈ 4.0). */}
      <WorldLabel position={[0, 3.77, 0]} text={he.englishCenterName} testId="english-center-label" />
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 2.0, 16]} />
        <meshStandardMaterial color={WALL_COLOR} flatShading />
      </mesh>
      <DomedRoof
        radius={1.35}
        position={[0, 2.0, 0]}
        color={ROOF_COLOR}
        emissive={isHighlighted ? ACCENT_COLOR : undefined}
        emissiveIntensity={isHighlighted ? 0.6 : 0}
      />
      <Door width={0.65} height={1.0} position={[0, 0.5, -1.32]} color={DOOR_COLOR} />
      {/* Game Feel pass — two real window openings, mirroring MathAcademy's
          own facade upgrade so neither building "opts out" of the kit. */}
      <WindowFrame width={0.35} height={0.45} position={[-0.85, 0.85, -1.33]} />
      <WindowFrame width={0.35} height={0.45} position={[0.85, 0.85, -1.33]} />
      {/* Sign: enlarged slightly and tilted toward the fixed elevated
          camera (rotation.x) so its face reads more directly instead of
          nearly edge-on. */}
      <SignPost postHeight={0} position={[0, 1.95, -1.42]} tiltX={-0.3} boardWidth={1.2} boardHeight={0.42} boardColor={ACCENT_COLOR} />
      {/* A small warm lantern beside the door — a subtle emissive accent
          rather than a new dynamic light source, matching LampPost's own
          glowing-sphere language. */}
      <mesh position={[0.5, 0.85, -1.3]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color={LANTERN_COLOR} emissive={LANTERN_COLOR} emissiveIntensity={0.9} flatShading />
      </mesh>
      {isCompleted && (
        <mesh position={[0, 2.65, -1.42]}>
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
