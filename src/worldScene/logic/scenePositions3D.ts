import type { EntityId } from '../../types/engine'
import type { CircleCollider } from './collision'
import type { Position2D } from './movement'

/**
 * Every coordinate here follows the Visual World Upgrade Sprint's approved
 * scale (district distance 12, NPC offset 2.5–3.5 from their district
 * center) — a uniform ~1.5x expansion of the original Meridian Plaza
 * Layout Design's proportions, not a re-derived layout. Y is omitted — the
 * ground plane is flat, so only x/z ever matters for movement, proximity,
 * or district membership.
 */
const DISTRICT_POSITIONS: Record<string, Position2D> = {
  core: { x: 0, z: 0 },
  north: { x: 0, z: -12 },
  south: { x: 0, z: 12 },
  east: { x: 12, z: 0 },
}

const DEFAULT_DISTRICT_POSITION: Position2D = { x: 0, z: 0 }

export function getDistrictPosition3D(districtId: EntityId): Position2D {
  return DISTRICT_POSITIONS[districtId] ?? DEFAULT_DISTRICT_POSITION
}

const NPC_POSITIONS: Record<string, Position2D> = {
  'north-warden': { x: -2.25, z: -9.75 },
  'north-analyst': { x: 2.25, z: -9.75 },
  'south-organizer': { x: -2.25, z: 9.75 },
  'south-engineer': { x: 2.25, z: 9.75 },
  'east-broker': { x: 9.75, z: -2.25 },
  'archivist-mera': { x: -2.25, z: 2.25 },
  'city-voice': { x: 2.25, z: 2.25 },
  // Batch 3A.3 — stationed just outside each building's -Z-facing door
  // (see MathAcademy.tsx/EnglishCenter.tsx), and just clear of that
  // building's own 1.6-radius collider so talking to the teacher never
  // fights with the building pushing the player back.
  'math-teacher': { x: -6, z: -4.9 },
  'english-teacher': { x: 6, z: -4.9 },
}

/** Falls back to its district's own center for any NPC not in the layout doc yet, rather than dropping it. */
export function getNpcPosition3D(npcId: string, districtId: EntityId): Position2D {
  return NPC_POSITIONS[npcId] ?? getDistrictPosition3D(districtId)
}

/**
 * Static building placements — one per district, positioned just beyond
 * each district's marker (on the far side from the plaza center) so an
 * NPC's home is visible behind them as they stand near their own marker.
 * Purely decorative scenery: no unlock gating, no interaction, no gameplay
 * meaning — the city exists whether or not its NPCs are unlocked yet.
 */
export const CORE_ARCHIVE_POSITION: Position2D = { x: 0, z: 4 }
export const NORTH_BUILDING_POSITION: Position2D = { x: 0, z: -15 }
export const SOUTH_BUILDING_POSITION: Position2D = { x: 0, z: 15 }
export const EAST_BUILDING_POSITION: Position2D = { x: 15, z: 0 }

export const PLAYER_SPAWN_POSITION: Position2D = { x: 0, z: -9 }
export const PLAYER_SPAWN_DISTRICT_ID: EntityId = 'north'

/**
 * Batch 3A.2 — the new Central Plaza's two learning buildings, placed just
 * off the existing North road (which stays within x∈[0, 2.4]) so neither
 * building nor its connector path overlaps any existing road, building, or
 * NPC position above. Purely additive: no existing district/building
 * position changes.
 */
export const MATH_ACADEMY_POSITION: Position2D = { x: -6, z: -3 }
export const ENGLISH_CENTER_POSITION: Position2D = { x: 6, z: -3 }

/**
 * Batch 3A.5 — a controlled, proportional scale applied to each building's
 * whole group (see MathAcademy.tsx/EnglishCenter.tsx) to increase their
 * visual prominence without touching any individual mesh's geometry or the
 * building's own position. 1.2 was chosen empirically: large enough to read
 * as more prominent, small enough that the building's visual footprint
 * (see LEARNING_BUILDING_COLLIDERS below) still clears both teacher
 * positions (each 1.9 units from its building's center).
 */
export const LEARNING_BUILDING_SCALE = 1.2

/** Simple decorative filler — no unlock gating, no interaction, no collision. */
export const LEARNING_PLAZA_HOUSE_POSITIONS: readonly Position2D[] = [
  { x: -9, z: -3 },
  { x: 9, z: -3 },
  { x: -6, z: -7 },
  // Batch 3A.5 — two more, hand-placed (not mirrored, same discipline
  // TownProps.tsx already uses) to fill out the plaza without touching the
  // spawn-to-plaza walking corridor (x≈0) or either teacher's approach line
  // (z≈-4.9).
  { x: 6, z: -7 },
  { x: -9, z: -7 },
]

/**
 * Batch 3A.5 — a small number of trees flanking each connector path (see
 * LearningPlazaProps.tsx), to strengthen the visual link between the
 * Central Plaza and each learning building. Purely decorative — no
 * collision, same as every other plaza prop.
 */
export const LEARNING_PLAZA_TREE_POSITIONS: readonly Position2D[] = [
  { x: -4.0, z: -1.3 },
  { x: 4.0, z: -1.3 },
]

/**
 * The only two colliders in the world right now (see collision.ts) —
 * deliberately scoped to just these two new buildings, not retrofitted onto
 * any existing building/prop/NPC. Radius bumped from the original 1.6 to
 * 1.75 alongside the Batch 3A.5 visual scale increase (LEARNING_BUILDING_SCALE)
 * — deliberately less than a fully proportional bump (1.6 × 1.2 = 1.92)
 * would have been, since that would exceed the 1.9-unit distance to each
 * building's own teacher and break interaction. 1.75 keeps a small (0.15
 * unit) safety margin from that distance while still noticeably reducing
 * the walk-through gap the larger building would otherwise leave.
 */
export const LEARNING_BUILDING_COLLIDER_RADIUS = 1.75

export const LEARNING_BUILDING_COLLIDERS: readonly CircleCollider[] = [
  { id: 'math-academy', center: MATH_ACADEMY_POSITION, radius: LEARNING_BUILDING_COLLIDER_RADIUS },
  { id: 'english-center', center: ENGLISH_CENTER_POSITION, radius: LEARNING_BUILDING_COLLIDER_RADIUS },
]

/**
 * Where the avatar reappears when the 3D scene (re)mounts. The scene
 * unmounts entirely while the Terminal is open, which resets any position
 * held in a ref — but sceneState.playerDistrictId survives (it lives in
 * App.tsx), so a returning player reappears at their last-known district's
 * position instead of always snapping back to the original spawn point.
 */
export function getAvatarRespawnPosition(currentDistrictId: EntityId): Position2D {
  return currentDistrictId === PLAYER_SPAWN_DISTRICT_ID
    ? PLAYER_SPAWN_POSITION
    : getDistrictPosition3D(currentDistrictId)
}

/**
 * Fixed camera placement. Scaled up from Game Feel Sprint 1's [0, 17, 20]
 * (itself already tuned to avoid clipping the South movement boundary) by
 * roughly the same ~1.5–1.6x factor as the Visual World Upgrade's world
 * scale, so the South boundary and the new district buildings both stay
 * inside the frustum. Re-verified empirically at all four boundaries, same
 * method as Sprint 1 — see the Visual World Upgrade screenshot check.
 */
export const CAMERA_POSITION: readonly [number, number, number] = [0, 27, 32]
export const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0, 0]
export const CAMERA_FOV = 45
