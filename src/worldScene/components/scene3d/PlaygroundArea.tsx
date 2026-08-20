import { Bench } from './props/Bench'
import { Fence } from './props/Fence'
import { Flowerbed } from './props/Flowerbed'
import { LampPost } from './props/LampPost'
import { Slide } from './props/Slide'
import { Swing } from './props/Swing'
import { Tree } from './props/Tree'

/**
 * A small social/play area — the brief's "at least one area that makes it
 * feel inhabited, not just a row of school buildings." Deliberately
 * composed (not scattered): the swing and slide form one clear play
 * cluster, a bench faces them for "supervision," a short fence segment
 * marks the area's SW edge, a tree and flowerbed give it shade/color, and a
 * lamp gives it evening warmth (matching this world's dusk lighting).
 * Purely decorative — no interaction, no collision, no gameplay meaning,
 * same as every other prop group in this scene (TownProps.tsx/
 * LearningPlazaProps.tsx).
 *
 * Perf pass — the original composition also had a short connecting
 * SimplePath and a second Planter. Both were confirmed (live screenshots)
 * to read as barely legible clutter at this cluster's actual on-screen
 * size/distance, so per "spend geometry where the player can see it" both
 * were cut rather than kept as low-value cost — the Flowerbed alone still
 * carries the "color" beat the Planter would have added.
 *
 * Placement: a genuinely open SE-quadrant pocket (bounding box roughly
 * x:[8.0,12.5], z:[6.6,10.0]) verified clear of every movement bound,
 * building collider, road ribbon, and existing prop position in
 * scenePositions3D.ts/PathNetwork.tsx/TownProps.tsx/LearningPlazaProps.tsx —
 * see this component's own file header in the integration PR notes for the
 * exact distances checked. Not wired into WorldScene3D.tsx by this pass;
 * that's a deliberate follow-up integration step.
 */
export function PlaygroundArea() {
  return (
    <group>
      {/* The play cluster itself — swing and slide grouped close together. */}
      <Swing position={{ x: 9.3, z: 7.5 }} rotationY={0.3} />
      <Slide position={{ x: 10.6, z: 7.3 }} rotationY={-0.5} />

      {/* A supervision bench, facing the play cluster (north, -Z). */}
      <Bench position={{ x: 10.2, z: 9.1 }} rotationY={Math.PI} />

      {/* A short fence run marking the area's SW edge. */}
      <Fence position={{ x: 8.3, z: 8.1 }} rotationY={Math.PI / 2} />

      {/* Shade, color, and evening warmth. */}
      <Tree position={{ x: 11.7, z: 8.7 }} />
      <Flowerbed position={{ x: 9.6, z: 9.6 }} />
      <LampPost position={{ x: 11.5, z: 6.8 }} />
    </group>
  )
}
