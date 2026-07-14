import { describe, expect, it } from 'vitest'
import {
  distance2D,
  getInteractablesInRadius,
  getNearestDistrictId,
  getNearestInteractable,
  type Interactable,
} from './proximity'

describe('distance2D', () => {
  it('computes straight-line distance on the ground plane', () => {
    expect(distance2D({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5)
  })
})

describe('getNearestInteractable', () => {
  const interactables: Interactable[] = [
    { id: 'core', kind: 'district', position: { x: 0, z: 0 } },
    { id: 'north-warden', kind: 'npc', position: { x: -1.5, z: -6.5 } },
  ]

  it('returns null when nothing is within range', () => {
    expect(getNearestInteractable({ x: 20, z: 20 }, interactables)).toBeNull()
  })

  it('returns the interactable when the player is within its radius', () => {
    const result = getNearestInteractable({ x: 1, z: 0 }, interactables)
    expect(result?.id).toBe('core')
  })

  it('returns the closer of two interactables both in range', () => {
    const closeInteractables: Interactable[] = [
      { id: 'a', kind: 'npc', position: { x: 1, z: 0 } },
      { id: 'b', kind: 'npc', position: { x: 2, z: 0 } },
    ]
    expect(getNearestInteractable({ x: 0, z: 0 }, closeInteractables)?.id).toBe('a')
  })

  it('respects a custom radius', () => {
    expect(getNearestInteractable({ x: 0.6, z: 0 }, interactables, 0.5)).toBeNull()
  })
})

describe('getInteractablesInRadius', () => {
  const core: Interactable = { id: 'core', kind: 'district', position: { x: 0, z: 0 } }
  const nearbyNpc: Interactable = { id: 'archivist-mera', kind: 'npc', position: { x: -1.5, z: 1.5 } }
  const farNpc: Interactable = { id: 'north-warden', kind: 'npc', position: { x: -1.5, z: -6.5 } }
  const interactables = [core, nearbyNpc, farNpc]

  it('returns every interactable within radius, not just the nearest', () => {
    const result = getInteractablesInRadius({ x: 0, z: 0 }, interactables)
    expect(result.map((interactable) => interactable.id).sort()).toEqual(['archivist-mera', 'core'])
  })

  it('excludes interactables outside the radius', () => {
    const result = getInteractablesInRadius({ x: 0, z: 0 }, interactables)
    expect(result.some((interactable) => interactable.id === 'north-warden')).toBe(false)
  })

  it('returns an empty array when nothing is in range', () => {
    expect(getInteractablesInRadius({ x: 50, z: 50 }, interactables)).toEqual([])
  })
})

describe('getNearestDistrictId', () => {
  const districts = [
    { id: 'core', position: { x: 0, z: 0 } },
    { id: 'north', position: { x: 0, z: -8 } },
    { id: 'south', position: { x: 0, z: 8 } },
    { id: 'east', position: { x: 8, z: 0 } },
  ]

  it('returns core when standing at the center', () => {
    expect(getNearestDistrictId({ x: 0, z: 0 }, districts)).toBe('core')
  })

  it('returns north when standing near the north marker', () => {
    expect(getNearestDistrictId({ x: 0, z: -7 }, districts)).toBe('north')
  })

  it('returns east when standing near the east marker', () => {
    expect(getNearestDistrictId({ x: 7, z: 0 }, districts)).toBe('east')
  })
})
