import { useMemo } from 'react'
import * as THREE from 'three'

const PATH_COLOR = new THREE.Color('#7a7360')
const PLAZA_COLOR = new THREE.Color('#847d68')
/** Fraction of each road's half-width that stays full PATH_COLOR before the blend-to-ground rim starts. */
const PLATEAU_FRACTION = 0.68

/**
 * The same warm/cool radial falloff GroundPlane.tsx paints the floor with —
 * duplicated as one line rather than imported, so a road segment's edge
 * blends into whatever the ground actually looks like at that point,
 * instead of a fixed unrelated tone. Keeps the "soft transition" honest.
 */
const GROUND_WARM = new THREE.Color('#3d4a70')
const GROUND_COOL = new THREE.Color('#0e1428')
function groundColorAt(x: number, z: number): THREE.Color {
  const t = THREE.MathUtils.clamp(Math.sqrt(x * x + z * z) / 16, 0, 1)
  return GROUND_WARM.clone().lerp(GROUND_COOL, t)
}

interface RoadPoint {
  x: number
  z: number
  width: number
}

/**
 * A road is ONE continuous ribbon across every waypoint, not a chain of
 * independent per-segment trapezoids. That independence was the root cause
 * of a defect adversarial review kept re-finding at every bend: each
 * segment's cross-section was perpendicular to only ITS OWN direction, so
 * at any turn the outer edges of two adjacent segments didn't line up —
 * leaving a sliver of bare ground notched into the outside of the curve.
 * Building one ribbon fixes it structurally: every interior waypoint's
 * cross-section is perpendicular to the BISECTOR of its incoming and
 * outgoing directions (the standard mitered-join technique), so consecutive
 * segments always share a seamless edge, at every bend, by construction —
 * not something to keep re-tuning point by point.
 *
 * Each cross-section is 4 vertices (edgeL, innerL, innerR, edgeR): a
 * full-PATH_COLOR plateau across the inner two, with only the outer rim
 * blended toward that point's actual ground color, so the visible surface
 * stays high-contrast and only the edge itself softens into the landscape.
 */
function useRoadRibbonGeometry(points: RoadPoint[]) {
  return useMemo(() => {
    const n = points.length
    const positions = new Float32Array(n * 4 * 3)
    const colors = new Float32Array(n * 4 * 3)

    for (let i = 0; i < n; i++) {
      const prev = points[Math.max(i - 1, 0)]
      const next = points[Math.min(i + 1, n - 1)]
      const dx = next.x - prev.x
      const dz = next.z - prev.z
      const len = Math.hypot(dx, dz) || 1
      // perpendicular to the direction of travel, in the flat XZ plane
      const px = dz / len
      const pz = -dx / len

      const p = points[i]
      const fw = p.width / 2
      const hw = fw * PLATEAU_FRACTION
      const rim = groundColorAt(p.x, p.z).lerp(PATH_COLOR, 0.4)

      const base = i * 4
      const corners: Array<[number, number]> = [
        [p.x - px * fw, p.z - pz * fw],
        [p.x - px * hw, p.z - pz * hw],
        [p.x + px * hw, p.z + pz * hw],
        [p.x + px * fw, p.z + pz * fw],
      ]
      const cornerColors = [rim, PATH_COLOR, PATH_COLOR, rim]
      for (let k = 0; k < 4; k++) {
        const vi = (base + k) * 3
        positions[vi] = corners[k][0]
        positions[vi + 1] = 0
        positions[vi + 2] = corners[k][1]
        const c = cornerColors[k]
        colors[vi] = c.r
        colors[vi + 1] = c.g
        colors[vi + 2] = c.b
      }
    }

    const indices: number[] = []
    for (let i = 0; i < n - 1; i++) {
      const nearBase = i * 4
      const farBase = (i + 1) * 4
      // Three bands (left rim, center plateau, right rim) per step. Pattern
      // per quad (A=near-left, B=near-right, C=far-right, D=far-left):
      // triangles (A,C,B),(A,D,C) — the winding confirmed correct earlier
      // (a flat XZ mesh under a downward-looking camera needs a +Y normal,
      // and the reverse order was the original all-roads-invisible bug).
      for (let k = 0; k < 3; k++) {
        const nearA = nearBase + k
        const nearB = nearBase + k + 1
        const farA = farBase + k
        const farB = farBase + k + 1
        indices.push(nearA, farB, nearB, nearA, farA, farB)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
    // points is a plain array literal recreated every render, so depend on
    // its serialized content rather than referential identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)])
}

/**
 * A road as one mitered ribbon across every waypoint: wide where it leaves
 * the plaza, narrowing as it nears the district's building, with small
 * lateral jitter so it reads as a path worn in over years rather than a
 * ruler-drawn strip. A small threshold widening at the very end — modest,
 * narrower than the plaza — marks the doorstep without repeating the
 * plaza's own scale there.
 */
function Road({ points, y }: { points: RoadPoint[]; y: number }) {
  const geometry = useRoadRibbonGeometry(points)
  return (
    <mesh geometry={geometry} position={[0, y, 0]}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  )
}

const CURB_COLOR = '#6b6455'
const PLAZA_RADIUS = 4.2

/**
 * A low stone curb along the plaza's true outer edge — the "the town is
 * built up here, not just flat ground" cue Stage 3 asks for. Safe to run
 * as one complete, ungapped ring: every road's first waypoint was already
 * pulled in to ~2.6-2.9 from center (an earlier fix, to clear the plaza's
 * own edge-fade), so no road ever reaches radius 4.2 — the rim is entirely
 * clear. A torus lying flat needs rotation.x = PI/2; the OPPOSITE mistake
 * (an unrotated torus reading as a vertical ring) was the sandbox archway
 * bug — here the flat orientation is the one actually wanted.
 */
function PlazaCurb() {
  return (
    <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[PLAZA_RADIUS, 0.09, 8, 48]} />
      <meshStandardMaterial color={CURB_COLOR} flatShading />
    </mesh>
  )
}

function useLitPlazaGeometry() {
  return useMemo(() => {
    const radius = 4.2
    const geo = new THREE.CircleGeometry(radius, 24)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // CircleGeometry is authored in XY before the mesh's own rotation
      const t = THREE.MathUtils.clamp(Math.hypot(x, y) / radius, 0, 1)
      const edge = groundColorAt(x, y).lerp(PLAZA_COLOR, 0.4)
      const c = PLAZA_COLOR.clone().lerp(edge, THREE.MathUtils.smoothstep(t, 0.88, 1))
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])
}

/**
 * The town's road network — a plaza pad under the Records Core, and three
 * roads reaching out to North/South/East that widen where they meet the
 * plaza and narrow toward each district's building. Purely a flat ground
 * overlay (no collision, no pathfinding): the point is that buildings read
 * as attached to the road, not that movement is constrained to it — the
 * player can already walk anywhere within bounds. Waypoints are hand-placed
 * (not procedural) so the wander stays deliberate and legible rather than
 * noisy — the same discipline TownProps.tsx already uses for its props.
 */
export function PathNetwork() {
  const plazaGeometry = useLitPlazaGeometry()

  // The plaza's rim is round (radius 4.2) but each road's near end is a
  // straight edge, so the first waypoint has to sit well inside that
  // radius even after accounting for its own half-width corners, or a
  // dim band shows between the plaza and the road — a defect pixel-level
  // adversarial sampling caught even after an earlier fix, since the
  // plaza's own edge-fade and the road's rim-blend can both land in the
  // same zone and compound into a visible dip. z=2.6 keeps even the
  // corners (distance ≈ sqrt(1.3²+2.6²) ≈ 2.9) well clear of the plaza's
  // fade zone (which now only starts at 0.88 × 4.2 ≈ 3.7).
  // The lookout deck of NorthWardensPost sits on posts at world (0.6,-11.4)
  // with a ~1.8x1.8 footprint — directly on the straight line from the
  // plaza to the tower. Its dark support posts caused the same class of
  // defect as the archive building below: not a missing road, but an
  // existing structure's unlit material visually cutting the road where
  // they overlap. A first attempt swung the road WEST to dodge the deck,
  // but that route ran straight into the tower's annex (world ~(-2.6,
  // -14.25), footprint x:[-3.45,-1.75]) instead — confirmed by adding
  // temporary debug markers at every waypoint and finding several of them
  // correctly placed but with no visible road surface leading to them, i.e.
  // occluded by the annex, not missing geometry. Routing EAST instead
  // clears both: the deck's footprint tops out around x=1.5, and the annex
  // sits entirely west of x=-1.75, so a swing out to x≈2.4 has real margin
  // from both before curving back to the tower's doorstep.
  const north: RoadPoint[] = [
    { x: 0, z: -2.6, width: 2.6 },
    { x: 0.32, z: -7.4, width: 2.0 },
    { x: 1.3, z: -9.3, width: 1.7 },
    { x: 2.4, z: -11.0, width: 1.5 },
    { x: 1.9, z: -12.6, width: 1.4 },
    { x: 0.8, z: -13.8, width: 1.4 },
    { x: 0.12, z: -14.4, width: 1.6 },
  ]
  // The south road's straight line to the plaza runs right into the
  // Records Core Archive (CoreArchiveBuilding, a cylinder+cone at x=0,z=4,
  // footprint radius up to ~1.55) — that building sitting on the road's
  // direct line is what pixel sampling was actually finding as a "gap": not
  // missing geometry, but the archive's own dark, un-lit material
  // visually cutting the road in two right where they overlap. A gentle,
  // many-waypoint arc (not the original 2-point diversion, which read as a
  // sharp zigzag with an apparent width-pinch at the corner) swings out to
  // x=-2.6 with real clearance from the building before rejoining.
  const south: RoadPoint[] = [
    { x: 0, z: 2.6, width: 2.6 },
    { x: -2.0, z: 3.2, width: 2.3 },
    { x: -2.6, z: 4.5, width: 1.9 },
    { x: -2.0, z: 5.6, width: 1.9 },
    { x: -1.1, z: 6.6, width: 1.9 },
    { x: -0.6, z: 7.1, width: 1.95 },
    { x: -0.3, z: 7.4, width: 2.0 },
    { x: 0.24, z: 10.6, width: 1.55 },
    { x: -0.1, z: 13.6, width: 1.3 },
    { x: -0.1, z: 14.4, width: 1.6 },
  ]
  // EastTradingPost's overhang plank + crates extend toward the plaza
  // (world x~13-14.5, z~-1.2 to 1.2) right along the road's straight
  // approach — the same occlusion pattern as the archive building and the
  // North deck/annex. Curving the last stretch south (+z) clears the
  // cluster before the final approach turns back in to the doorway.
  const east: RoadPoint[] = [
    { x: 2.6, z: 0, width: 2.6 },
    { x: 7.4, z: 0.3, width: 2.0 },
    { x: 10.6, z: -0.24, width: 1.55 },
    { x: 12.6, z: 0.9, width: 1.3 },
    { x: 14.4, z: 1.8, width: 1.5 },
    // The curve-south fix cleared the crate cluster but only redirected
    // the approach angle — it never actually continued into the building's
    // own footprint (x:13.9-16.1, z:-0.9 to 0.9), so the ribbon tapered to
    // a point in open ground short of the Trading Post. This point brings
    // it back in to actually terminate at the building.
    { x: 14.8, z: 0.7, width: 1.4 },
  ]

  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={plazaGeometry}>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      <PlazaCurb />

      <Road points={north} y={0.015} />
      <Road points={south} y={0.015} />
      <Road points={east} y={0.015} />
    </group>
  )
}
