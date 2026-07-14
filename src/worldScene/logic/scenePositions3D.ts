import type { EntityId } from '../../types/engine'
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
