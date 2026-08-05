import {
  ENGLISH_CENTER_POSITION,
  LEARNING_PLAZA_HOUSE_POSITIONS,
  LEARNING_PLAZA_TREE_POSITIONS,
  MATH_ACADEMY_POSITION,
} from '../../logic/scenePositions3D'
import { Bench } from './props/Bench'
import { Bush } from './props/Bush'
import { Flowerbed } from './props/Flowerbed'
import { House } from './props/House'
import { LampPost } from './props/LampPost'
import { Planter } from './props/Planter'
import { SignBoard } from './props/SignBoard'
import { SimplePath } from './props/SimplePath'
import { Tree } from './props/Tree'

/**
 * Batch 3A.2 (extended in 3A.5) — the new Central Plaza's decorative
 * filler: short connector paths to the two learning buildings, a couple of
 * signs/lamps/benches/planters/trees using the exact same vocabulary
 * TownProps.tsx already established, and a few houses to reduce emptiness.
 * Purely decorative — no interaction, no collision (collision is scoped to
 * the two building colliders only, see collision.ts and PlayerAvatar.tsx).
 *
 * World Polish pass — one bush and one flowerbed, kept modest (this is
 * already the densest area of the world): "balanced greenery, clear paths
 * toward both learning buildings," offset off the x=0 spawn-to-Core
 * corridor so neither sits on the main walking line.
 */
export function LearningPlazaProps() {
  return (
    <group>
      <SimplePath from={{ x: -2.2, z: -2.2 }} to={MATH_ACADEMY_POSITION} />
      <SimplePath from={{ x: 2.2, z: -2.2 }} to={ENGLISH_CENTER_POSITION} />

      <SignBoard position={{ x: -4.6, z: -2.6 }} rotationY={0.5} />
      <SignBoard position={{ x: 4.6, z: -2.6 }} rotationY={-0.5} />

      <LampPost position={{ x: -4.2, z: -4.4 }} />
      <LampPost position={{ x: 4.2, z: -4.4 }} />

      <Bench position={{ x: -6, z: -1 }} rotationY={Math.PI} />
      <Bench position={{ x: 6, z: -1 }} rotationY={Math.PI} />

      <Planter position={{ x: -7.4, z: -3.6 }} />
      <Planter position={{ x: 7.4, z: -3.6 }} />

      <Bush position={{ x: -1.2, z: -5.5 }} />
      <Flowerbed position={{ x: 1.2, z: -0.8 }} />

      {/* Batch 3A.5 — flanking each connector path, to strengthen the
          visual link between the plaza and each learning building. */}
      {LEARNING_PLAZA_TREE_POSITIONS.map((position, index) => (
        <Tree key={index} position={position} />
      ))}

      {LEARNING_PLAZA_HOUSE_POSITIONS.map((position, index) => (
        <House key={index} position={position} />
      ))}
    </group>
  )
}
