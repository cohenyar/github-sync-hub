import { Bench } from './props/Bench'
import { Fence } from './props/Fence'
import { LampPost } from './props/LampPost'
import { Mailbox } from './props/Mailbox'
import { MarketCart } from './props/MarketCart'
import { Crate } from './props/Crate'
import { Flowerbed } from './props/Flowerbed'
import { Pillar } from './props/Pillar'
import { Planter } from './props/Planter'
import { SignBoard } from './props/SignBoard'

/**
 * Hand-placed environmental props — deliberately not mirrored or evenly
 * spaced, so the town reads as placed by hand rather than generated.
 * Deliberately sparse: empty ground is left around the Core and between
 * clusters so landmarks stand out rather than competing with clutter.
 * Purely decorative — no interaction, no collision, no logic.
 *
 * World Polish pass adds a small, district-identity-driven set of new
 * instances (12 total, kept modest per the approved plan's density budget):
 * Core Archive gets an archival accent instead of more clutter; North's two
 * fences are the one deliberate exception to "not mirrored" (a disciplined,
 * civic district earns a symmetric flank); South and East get their own
 * warm/commercial details. Every new position was chosen clear of every
 * existing collider, NPC position, and the path network.
 */
export function TownProps() {
  return (
    <group>
      {/* Plaza lamps — four, scattered along the roads rather than ringing the Core symmetrically. */}
      <LampPost position={{ x: 1.7, z: -5.8 }} />
      <LampPost position={{ x: -2.3, z: 6.4 }} />
      <LampPost position={{ x: 5.6, z: 1.3 }} />
      <LampPost position={{ x: -1.4, z: -2 }} />

      {/* Records Core Archive — a planter and a lamp, not mirrored. World
          Polish pass: a violet-tinted lamp (matching the building's own
          window glow) and two stone pillars flanking it, in place of plain
          rocks — a stronger archival identity than generic landscaping. */}
      <LampPost position={{ x: -1.8, z: 2.3 }} />
      <Planter position={{ x: 2, z: 3 }} />
      <LampPost position={{ x: 1.6, z: 3.3 }} glowColor="#d8c9ff" />
      <Pillar position={{ x: -1.7, z: 3.6 }} />
      <Pillar position={{ x: 1.7, z: 3.6 }} />

      {/* North Warden's Post — a sign near the road, a short fence tucked to
          one side. World Polish pass: a mailbox, and two more fence runs
          flanking the tower's approach — deliberately mirrored (the one
          exception to this file's "not mirrored" rule), since "disciplined
          landscaping" is North's own identity. */}
      <SignBoard position={{ x: 1.6, z: -13.2 }} rotationY={0.3} />
      <Fence position={{ x: -1.9, z: -15.8 }} rotationY={Math.PI / 2} />
      <Mailbox position={{ x: 2.6, z: -11.5 }} />
      <Fence position={{ x: -1.6, z: -13.7 }} rotationY={Math.PI / 2} />
      <Fence position={{ x: 1.6, z: -13.7 }} rotationY={Math.PI / 2} />

      {/* South Community Hall — a bench facing the plaza, a planter, one
          lamp set back. World Polish pass: two flowerbeds and a mailbox —
          warm/social, not mirrored (varied offsets, matching this file's
          own hand-placed discipline everywhere except North). */}
      <Bench position={{ x: -1.8, z: 13.6 }} rotationY={Math.PI} />
      <Planter position={{ x: 2.1, z: 14.2 }} />
      <LampPost position={{ x: 0.6, z: 17 }} />
      <Flowerbed position={{ x: -2.6, z: 13 }} />
      <Flowerbed position={{ x: 2.8, z: 12.6 }} />
      <Mailbox position={{ x: -0.8, z: 11.5 }} />

      {/* East Trading Post — a sign near its crates (the Post itself already
          has two crates). World Polish pass: a market cart, one more crate,
          and a second, gently swaying sign along the approach path. */}
      <SignBoard position={{ x: 13.3, z: -1.6 }} rotationY={-0.4} />
      <MarketCart position={{ x: 11.5, z: 2 }} rotationY={0.3} />
      <Crate position={{ x: 12.2, z: 2.6 }} />
      <SignBoard position={{ x: 10.8, z: -0.5 }} rotationY={0.6} sway />
    </group>
  )
}
