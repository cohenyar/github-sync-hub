import { describe, expect, it } from 'vitest'
import { MOVEMENT_BOUNDS } from './movement'
import {
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
  CORE_ARCHIVE_POSITION,
  EAST_BUILDING_POSITION,
  ENGLISH_CENTER_POSITION,
  getAvatarRespawnPosition,
  getDistrictPosition3D,
  getNpcPosition3D,
  LEARNING_BUILDING_COLLIDER_RADIUS,
  LEARNING_BUILDING_COLLIDERS,
  LEARNING_BUILDING_SCALE,
  LEARNING_PLAZA_HOUSE_POSITIONS,
  LEARNING_PLAZA_TREE_POSITIONS,
  MATH_ACADEMY_POSITION,
  NORTH_BUILDING_POSITION,
  PLAYER_SPAWN_DISTRICT_ID,
  PLAYER_SPAWN_POSITION,
  SOUTH_BUILDING_POSITION,
} from './scenePositions3D'

function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

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

  it('places the Batch 3A.3 teacher NPCs just outside their own building, clear of its collider', () => {
    expect(getNpcPosition3D('math-teacher', 'core')).toEqual({ x: -6, z: -4.9 })
    expect(getNpcPosition3D('english-teacher', 'core')).toEqual({ x: 6, z: -4.9 })

    for (const [npcId, buildingPosition] of [
      ['math-teacher', MATH_ACADEMY_POSITION],
      ['english-teacher', ENGLISH_CENTER_POSITION],
    ] as const) {
      const collider = LEARNING_BUILDING_COLLIDERS.find((c) => c.center === buildingPosition)!
      expect(distance(getNpcPosition3D(npcId, 'core'), buildingPosition)).toBeGreaterThan(collider.radius)
    }
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

describe('Batch 3A.2 — learning plaza positions', () => {
  it('places both learning buildings within the movement bounds', () => {
    for (const position of [MATH_ACADEMY_POSITION, ENGLISH_CENTER_POSITION]) {
      expect(position.x).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minX)
      expect(position.x).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxX)
      expect(position.z).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minZ)
      expect(position.z).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxZ)
    }
  })

  it('keeps both learning buildings clear of every existing building and NPC position', () => {
    const existing = [
      CORE_ARCHIVE_POSITION,
      NORTH_BUILDING_POSITION,
      SOUTH_BUILDING_POSITION,
      EAST_BUILDING_POSITION,
      getNpcPosition3D('archivist-mera', 'core'),
      getNpcPosition3D('city-voice', 'core'),
      getNpcPosition3D('north-warden', 'north'),
      getNpcPosition3D('north-analyst', 'north'),
    ]
    for (const learningPosition of [MATH_ACADEMY_POSITION, ENGLISH_CENTER_POSITION]) {
      for (const other of existing) {
        expect(distance(learningPosition, other)).toBeGreaterThan(2)
      }
    }
  })

  it('places every house within bounds and clear of both learning buildings', () => {
    for (const house of LEARNING_PLAZA_HOUSE_POSITIONS) {
      expect(house.x).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minX)
      expect(house.x).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxX)
      expect(distance(house, MATH_ACADEMY_POSITION)).toBeGreaterThan(LEARNING_BUILDING_COLLIDER_RADIUS)
      expect(distance(house, ENGLISH_CENTER_POSITION)).toBeGreaterThan(LEARNING_BUILDING_COLLIDER_RADIUS)
    }
  })

  it('scopes the collider list to exactly the two new learning buildings', () => {
    expect(LEARNING_BUILDING_COLLIDERS).toEqual([
      { id: 'math-academy', center: MATH_ACADEMY_POSITION, radius: expect.any(Number) },
      { id: 'english-center', center: ENGLISH_CENTER_POSITION, radius: expect.any(Number) },
    ])
  })
})

describe('Batch 3A.5 — building scale and collider safety margin', () => {
  it('keeps the collider radius below a fully proportional scale-up, so each teacher stays reachable', () => {
    const teacherDistance = 1.9 // distance from each building's center to its own teacher, see NPC_POSITIONS
    expect(LEARNING_BUILDING_COLLIDER_RADIUS).toBeLessThan(teacherDistance)
    expect(LEARNING_BUILDING_COLLIDER_RADIUS).toBeLessThan(1.6 * LEARNING_BUILDING_SCALE)
  })

  it('every learning-plaza collider uses the shared radius constant', () => {
    for (const collider of LEARNING_BUILDING_COLLIDERS) {
      expect(collider.radius).toBe(LEARNING_BUILDING_COLLIDER_RADIUS)
    }
  })
})

describe('Batch 3A.5 — new plaza props stay within bounds and clear of interaction zones', () => {
  const teacherPositions = [getNpcPosition3D('math-teacher', 'core'), getNpcPosition3D('english-teacher', 'core')]

  it('places every tree within movement bounds', () => {
    for (const tree of LEARNING_PLAZA_TREE_POSITIONS) {
      expect(tree.x).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minX)
      expect(tree.x).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxX)
      expect(tree.z).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minZ)
      expect(tree.z).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxZ)
    }
  })

  it('keeps every new house within movement bounds on both axes', () => {
    for (const house of LEARNING_PLAZA_HOUSE_POSITIONS) {
      expect(house.z).toBeGreaterThanOrEqual(MOVEMENT_BOUNDS.minZ)
      expect(house.z).toBeLessThanOrEqual(MOVEMENT_BOUNDS.maxZ)
    }
  })

  it('keeps every house and tree clear of both teacher interaction positions', () => {
    for (const prop of [...LEARNING_PLAZA_HOUSE_POSITIONS, ...LEARNING_PLAZA_TREE_POSITIONS]) {
      for (const teacherPosition of teacherPositions) {
        expect(distance(prop, teacherPosition)).toBeGreaterThan(1.5)
      }
    }
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
