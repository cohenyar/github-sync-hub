import { describe, expect, it } from 'vitest'
import {
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
  CORE_ARCHIVE_POSITION,
  EAST_BUILDING_POSITION,
  getAvatarRespawnPosition,
  getDistrictPosition3D,
  getNpcPosition3D,
  NORTH_BUILDING_POSITION,
  PLAYER_SPAWN_DISTRICT_ID,
  PLAYER_SPAWN_POSITION,
  SOUTH_BUILDING_POSITION,
} from './scenePositions3D'

describe('getDistrictPosition3D', () => {
  it('places the Records Core at the origin', () => {
    expect(getDistrictPosition3D('core')).toEqual({ x: 0, z: 0 })
  })

  it('places north, south, and east per the Visual World Upgrade scale', () => {
    expect(getDistrictPosition3D('north')).toEqual({ x: 0, z: -12 })
    expect(getDistrictPosition3D('south')).toEqual({ x: 0, z: 12 })
    expect(getDistrictPosition3D('east')).toEqual({ x: 12, z: 0 })
  })

  it('falls back to the origin for an unknown district id', () => {
    expect(getDistrictPosition3D('does-not-exist')).toEqual({ x: 0, z: 0 })
  })
})

describe('getNpcPosition3D', () => {
  it('places every real NPC exactly per the Visual World Upgrade scale', () => {
    expect(getNpcPosition3D('north-warden', 'north')).toEqual({ x: -2.25, z: -9.75 })
    expect(getNpcPosition3D('north-analyst', 'north')).toEqual({ x: 2.25, z: -9.75 })
    expect(getNpcPosition3D('south-organizer', 'south')).toEqual({ x: -2.25, z: 9.75 })
    expect(getNpcPosition3D('south-engineer', 'south')).toEqual({ x: 2.25, z: 9.75 })
    expect(getNpcPosition3D('east-broker', 'east')).toEqual({ x: 9.75, z: -2.25 })
    expect(getNpcPosition3D('archivist-mera', 'core')).toEqual({ x: -2.25, z: 2.25 })
    expect(getNpcPosition3D('city-voice', 'core')).toEqual({ x: 2.25, z: 2.25 })
  })

  it("falls back to the district's own center for an NPC not in the layout document", () => {
    expect(getNpcPosition3D('some-future-npc', 'south')).toEqual({ x: 0, z: 12 })
  })
})

describe('building positions', () => {
  it('places each district building just beyond its district marker, on the far side from the plaza center', () => {
    expect(CORE_ARCHIVE_POSITION).toEqual({ x: 0, z: 4 })
    expect(NORTH_BUILDING_POSITION).toEqual({ x: 0, z: -15 })
    expect(SOUTH_BUILDING_POSITION).toEqual({ x: 0, z: 15 })
    expect(EAST_BUILDING_POSITION).toEqual({ x: 15, z: 0 })
  })
})

describe('spawn and camera constants', () => {
  it('spawns the player in North, per the Visual World Upgrade scale', () => {
    expect(PLAYER_SPAWN_DISTRICT_ID).toBe('north')
    expect(PLAYER_SPAWN_POSITION).toEqual({ x: 0, z: -9 })
  })

  it('fixes the camera looking at the plaza center', () => {
    // Scaled up alongside the Visual World Upgrade's larger world (from
    // Game Feel Sprint 1's [0, 17, 20]) — the look-at target and FOV are
    // unchanged.
    expect(CAMERA_POSITION).toEqual([0, 27, 32])
    expect(CAMERA_LOOK_AT).toEqual([0, 0, 0])
    expect(CAMERA_FOV).toBe(45)
  })
})

describe('getAvatarRespawnPosition', () => {
  it('uses the exact spawn point when the player never left North', () => {
    expect(getAvatarRespawnPosition('north')).toEqual(PLAYER_SPAWN_POSITION)
  })

  it('respawns at the district position for any other district, not back at the original spawn', () => {
    // Regression guard: the 3D scene remounts fresh every time the Terminal
    // closes, which used to always reset the avatar to North's spawn point
    // even if the player had walked to the Core beforehand.
    expect(getAvatarRespawnPosition('core')).toEqual(getDistrictPosition3D('core'))
    expect(getAvatarRespawnPosition('south')).toEqual(getDistrictPosition3D('south'))
    expect(getAvatarRespawnPosition('east')).toEqual(getDistrictPosition3D('east'))
  })
})
