import { describe, expect, it } from 'vitest'
import { getNpcsByDistrict } from '../npcs'
import { getCompanionNpc, getDistrictIdForMission } from './selectors'

describe('getDistrictIdForMission', () => {
  it('maps a mission to the destination/district that owns it', () => {
    // These pairings come straight from destinationContent.ts (core hosts
    // first-contact, north hosts district-ties) — asserting the lookup
    // reads them, not inventing new relationships.
    expect(getDistrictIdForMission('first-contact')).toBe('core')
    expect(getDistrictIdForMission('district-ties')).toBe('north')
    expect(getDistrictIdForMission('south-stability')).toBe('south')
    expect(getDistrictIdForMission('full-signal')).toBe('east')
  })

  it('returns undefined for a mission no destination owns', () => {
    expect(getDistrictIdForMission('no-such-mission')).toBeUndefined()
  })
})

describe('getCompanionNpc', () => {
  it('resolves the first unlocked NPC in the active mission’s district', () => {
    const coreNpcs = getNpcsByDistrict('core')
    expect(coreNpcs.length).toBeGreaterThan(0)
    const unlockedIds = coreNpcs.map((npc) => npc.id)

    const companion = getCompanionNpc('first-contact', unlockedIds)
    expect(companion).toBeDefined()
    expect(companion!.districtId).toBe('core')
  })

  it('returns undefined when no NPC in the district is unlocked', () => {
    expect(getCompanionNpc('first-contact', [])).toBeUndefined()
  })

  it('returns undefined for a mission with no owning district', () => {
    expect(getCompanionNpc('no-such-mission', ['anything'])).toBeUndefined()
  })
})
