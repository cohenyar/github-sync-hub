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
  //
  // Game Feel pass (occlusion fix, full resolution) — the earlier z-only
  // nudge (z=-4.9 -> -5.3) reduced but never eliminated the occlusion,
  // because the actual cause isn't depth at all: each teacher stood at the
  // exact same x as their building's own center, dead in front of the
  // door, and the fixed camera (see CAMERA_POSITION) looks down the length
  // of the plaza from due south (x=0) — so the camera-to-teacher sightline
  // runs straight down the building's own centerline regardless of how far
  // north/south the teacher stands. Ray-traced precisely: at z=-5.3, the
  // sightline's x stays within +-0.2 of x*0.93..0.97 across the building's
  // whole z-span, which is why any z-only fix was doomed to partially fail.
  // The real fix is lateral: shifted x from the building's own centerline
  // (-6 / +6) to just past the building's own half-width toward the plaza
  // center (-4.2 / +4.2, each building being 1.56 units half-wide) — this
  // moves the teacher to the near corner of their building's silhouette
  // instead of dead-center, clearing the sightline entirely while staying
  // close enough to read as "just outside their own building" (distance to
  // building center: 2.9, vs. the original 1.9-2.3). Confirmed via a real
  // screenshot: both teachers are now fully visible, head to feet, at the
  // normal exploration camera. Verified clear of every collider (nearest,
  // the building's own 1.75-radius collider, at distance 2.9) and every
  // other NPC (nearest, north-warden/reunited-owner, both >4.5 units away —
  // beyond INTERACTION_RADIUS, so no ambiguous nearest-interactable case).
  'math-teacher': { x: -4.2, z: -5.3 },
  'english-teacher': { x: 4.2, z: -5.3 },
  // Meridian 1.3 — stationed a clear step east of the English Center's own
  // door position, close enough to read as "at the board" without
  // overlapping the teacher or the building's collider.
  'reunited-owner': { x: 8.5, z: -4.5 },
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
 * Game Feel pass — every named building now has a real façade (doors,
 * windows, signs — see each building's own file) instead of 2-3 bare
 * primitives, and a façade you can walk straight through looks broken, so
 * each gets a matching collider. Radii are each chosen strictly less than
 * that building's own nearest-NPC distance, so no NPC ever becomes
 * unreachable — see the safety-margin tests below for the exact numbers.
 */
export const SOUTH_BUILDING_COLLIDER_RADIUS = 2.0
export const CORE_ARCHIVE_COLLIDER_RADIUS = 1.5
export const NORTH_BUILDING_COLLIDER_RADIUS = 1.5
export const EAST_BUILDING_COLLIDER_RADIUS = 1.5

export const SOUTH_BUILDING_COLLIDER: CircleCollider = {
  id: 'south-community-hall',
  center: SOUTH_BUILDING_POSITION,
  radius: SOUTH_BUILDING_COLLIDER_RADIUS,
}

export const CORE_ARCHIVE_COLLIDER: CircleCollider = {
  id: 'core-archive',
  center: CORE_ARCHIVE_POSITION,
  radius: CORE_ARCHIVE_COLLIDER_RADIUS,
}

export const NORTH_BUILDING_COLLIDER: CircleCollider = {
  id: 'north-wardens-post',
  center: NORTH_BUILDING_POSITION,
  radius: NORTH_BUILDING_COLLIDER_RADIUS,
}

export const EAST_BUILDING_COLLIDER: CircleCollider = {
  id: 'east-trading-post',
  center: EAST_BUILDING_POSITION,
  radius: EAST_BUILDING_COLLIDER_RADIUS,
}

/** Every building collider added this pass, for WorldScene3D to spread alongside LEARNING_BUILDING_COLLIDERS. */
export const DISTRICT_BUILDING_COLLIDERS: readonly CircleCollider[] = [
  SOUTH_BUILDING_COLLIDER,
  CORE_ARCHIVE_COLLIDER,
  NORTH_BUILDING_COLLIDER,
  EAST_BUILDING_COLLIDER,
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
 * Fixed camera placement. Design pass — viewport dominance/"the world feels
 * visually distant": scaled in ~10% from [0, 27, 32] (itself scaled up from
 * Game Feel Sprint 1's [0, 17, 20]), a uniform distance reduction along the
 * exact same viewing direction so nothing about the angle/composition
 * changes, only how large everything reads. Re-verified empirically at all
 * four MOVEMENT_BOUNDS corners (±14, ±14) plus every district building —
 * same method as every prior camera tuning pass here — confirmed nothing
 * newly clips the frustum at this distance.
 */
export const CAMERA_POSITION: readonly [number, number, number] = [0, 24.3, 28.8]
export const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0, 0]
export const CAMERA_FOV = 45

/**
 * Dialogue presentation pass — a conversation only ever involves two
 * figures within INTERACTION_RADIUS (4.5 units) of each other, framed
 * against the *entire* ~28-unit plaza the exploration camera is tuned for.
 * Rather than a second camera or any rotation, this scales the exact same
 * fixed offset/angle down toward the conversation's own midpoint — the
 * viewing direction never changes, only the distance, so a player's sense
 * of orientation carries over automatically. 0.45 keeps the frame
 * (~15-19 units across at that distance) comfortably larger than the
 * interaction radius while making both figures roughly twice as prominent
 * on screen. SceneCamera.tsx is the only caller; kept here (not there)
 * because it's plain-number math, same convention as every other camera
 * constant in this file.
 */
export const DIALOGUE_CAMERA_ZOOM = 0.45

export interface CameraFraming {
  position: readonly [number, number, number]
  lookAt: readonly [number, number, number]
}

/** The default (exploration) framing, unscaled — SceneCamera's target whenever no dialogue is open. */
export const DEFAULT_CAMERA_FRAMING: CameraFraming = { position: CAMERA_POSITION, lookAt: CAMERA_LOOK_AT }

export function computeDialogueCameraFraming(focus: Position2D, zoom: number = DIALOGUE_CAMERA_ZOOM): CameraFraming {
  return {
    position: [
      focus.x + (CAMERA_POSITION[0] - CAMERA_LOOK_AT[0]) * zoom,
      CAMERA_LOOK_AT[1] + (CAMERA_POSITION[1] - CAMERA_LOOK_AT[1]) * zoom,
      focus.z + (CAMERA_POSITION[2] - CAMERA_LOOK_AT[2]) * zoom,
    ],
    lookAt: [focus.x, 0, focus.z],
  }
}
