import { ENGLISH_CENTER_POSITION, LEARNING_BUILDING_SCALE } from '../../../logic/scenePositions3D'

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
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 2.0, 16]} />
        <meshStandardMaterial color={WALL_COLOR} flatShading />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[1.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={ROOF_COLOR}
          emissive={isHighlighted ? ACCENT_COLOR : undefined}
          emissiveIntensity={isHighlighted ? 0.6 : 0}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.5, -1.32]}>
        <boxGeometry args={[0.65, 1.0, 0.05]} />
        <meshStandardMaterial color={DOOR_COLOR} flatShading />
      </mesh>
      {/* Sign: enlarged slightly and tilted toward the fixed elevated
          camera (rotation.x) so its face reads more directly instead of
          nearly edge-on. */}
      <mesh position={[0, 1.95, -1.42]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.2, 0.42, 0.05]} />
        <meshStandardMaterial color={ACCENT_COLOR} flatShading />
      </mesh>
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
