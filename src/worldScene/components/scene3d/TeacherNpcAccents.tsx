import { getNpcPosition3D } from '../../logic/scenePositions3D'
import { WorldLabel } from './WorldLabel'

export interface TeacherNpcAccentsProps {
  npcId: string
  districtId: string
  name: string
  isHighlighted: boolean
  isSelectedPath: boolean
  /** Batch 3A.5 — a small, restrained completion badge, visually distinct (green, offset position) from both the cyan proximity ring and the gold selected-path ring below. Can be true alongside either of those. */
  isCompleted?: boolean
}

/**
 * The extra identification/feedback layer for Batch 3A.3's two teacher NPCs
 * only — a floating name label, a proximity "in range" ring, and a
 * distance-independent "selected learning path" accent. Purely additive:
 * NpcMarker3D and npcFigures.tsx (and every one of the other 7 NPCs) are
 * completely untouched — this renders as a sibling alongside the existing
 * NpcMarker3D for just these two ids.
 *
 * The two new signals are deliberately distinct from each other (different
 * position, different color) and from any permanent decoration: these two
 * NPCs render via the plain DefaultFigure (see npcFigures.tsx), which has
 * no always-on glow at all, so there is nothing for either signal to be
 * confused with.
 */
export function TeacherNpcAccents({
  npcId,
  districtId,
  name,
  isHighlighted,
  isSelectedPath,
  isCompleted = false,
}: TeacherNpcAccentsProps) {
  const position = getNpcPosition3D(npcId, districtId)

  return (
    <group position={[position.x, 0, position.z]}>
      <WorldLabel position={[0, 1.85, 0]} text={name} />

      {/* Selected-path accent: on whenever this NPC's subject is the
          player's chosen learning path, regardless of distance. */}
      <mesh position={[0, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.03, 8, 20]} />
        <meshStandardMaterial
          color="#e8c14a"
          emissive="#e8c14a"
          emissiveIntensity={isSelectedPath ? 0.9 : 0}
          flatShading
        />
      </mesh>

      {/* In-range indicator: on only while this NPC is the nearest
          interactable — positioned above the head, well clear of the
          selected-path accent below, so the two never overlap visually. */}
      <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.035, 8, 16]} />
        <meshStandardMaterial
          color="#8fd8ff"
          emissive="#8fd8ff"
          emissiveIntensity={isHighlighted ? 1 : 0}
          flatShading
        />
      </mesh>

      {/* Batch 3A.5 — lesson-completed badge: a small green sphere offset
          to the side of the name label, always visible once completed
          regardless of distance or selected-path state. Distinct in both
          color and shape from the two rings above (which are cyan/gold
          tori at different heights), so all three signals stay
          distinguishable when they coexist. */}
      {isCompleted && (
        <mesh position={[0.4, 1.85, 0]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color="#5fd382" emissive="#5fd382" emissiveIntensity={0.9} flatShading />
        </mesh>
      )}
    </group>
  )
}
