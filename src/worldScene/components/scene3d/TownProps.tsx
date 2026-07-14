import { Bench } from './props/Bench'
import { Fence } from './props/Fence'
import { LampPost } from './props/LampPost'
import { Planter } from './props/Planter'
import { SignBoard } from './props/SignBoard'

/**
 * Hand-placed environmental props — deliberately not mirrored or evenly
 * spaced, so the town reads as placed by hand rather than generated.
 * Deliberately sparse: empty ground is left around the Core and between
 * clusters so landmarks stand out rather than competing with clutter.
 * Purely decorative — no interaction, no collision, no logic.
 */
export function TownProps() {
  return (
    <group>
      {/* Plaza lamps — four, scattered along the roads rather than ringing the Core symmetrically. */}
      <LampPost position={{ x: 1.7, z: -5.8 }} />
      <LampPost position={{ x: -2.3, z: 6.4 }} />
      <LampPost position={{ x: 5.6, z: 1.3 }} />
      <LampPost position={{ x: -1.4, z: -2 }} />

      {/* Records Core Archive — a planter and a lamp, not mirrored. */}
      <LampPost position={{ x: -1.8, z: 2.3 }} />
      <Planter position={{ x: 2, z: 3 }} />

      {/* North Warden's Post — a sign near the road, a short fence tucked to one side. */}
      <SignBoard position={{ x: 1.6, z: -13.2 }} rotationY={0.3} />
      <Fence position={{ x: -1.9, z: -15.8 }} rotationY={Math.PI / 2} />

      {/* South Community Hall — a bench facing the plaza, a planter, one lamp set back. */}
      <Bench position={{ x: -1.8, z: 13.6 }} rotationY={Math.PI} />
      <Planter position={{ x: 2.1, z: 14.2 }} />
      <LampPost position={{ x: 0.6, z: 17 }} />

      {/* East Trading Post — a sign near its crates (the Post itself already has two crates). */}
      <SignBoard position={{ x: 13.3, z: -1.6 }} rotationY={-0.4} />
    </group>
  )
}
