import { describe, expect, it } from 'vitest'
import type { NpcConfig } from '../../npcs'
import { getNpcDialogueState, type NpcDialogueContext } from './npcDialogueState'

function context(overrides: Partial<NpcDialogueContext> = {}): NpcDialogueContext {
  return {
    missionContentStatusByMissionId: {},
    activeMissionId: 'first-contact',
    hasAttemptedActiveMission: false,
    districtStatusByDistrictId: {},
    ...overrides,
  }
}

const northWarden: NpcConfig = {
  id: 'north-warden',
  name: 'Devrin Kass',
  districtId: 'north',
  role: 'District Warden',
  description: '',
}

const southOrganizer: NpcConfig = {
  id: 'south-organizer',
  name: 'Priya Nandall',
  districtId: 'south',
  role: 'Community Organizer',
  description: '',
}

const archivistMera: NpcConfig = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  description: '',
}

const cityVoice: NpcConfig = {
  id: 'city-voice',
  name: 'Kestrel Vane',
  districtId: 'core',
  role: 'City Voice',
  description: '',
}

describe('getNpcDialogueState — mission-linked NPCs', () => {
  it('is "locked" when the linked mission is not yet available', () => {
    const state = getNpcDialogueState(
      southOrganizer,
      context({ missionContentStatusByMissionId: { 'south-stability': 'locked' } }),
    )
    expect(state).toEqual({ kind: 'mission', phase: 'locked' })
  })

  it('is "available" once the linked mission unlocks but hasn\'t been attempted', () => {
    const state = getNpcDialogueState(
      southOrganizer,
      context({
        missionContentStatusByMissionId: { 'south-stability': 'available' },
        activeMissionId: 'south-stability',
        hasAttemptedActiveMission: false,
      }),
    )
    expect(state).toEqual({ kind: 'mission', phase: 'available' })
  })

  it('is "available", not "inProgress", if it is available but not the player\'s current active mission', () => {
    const state = getNpcDialogueState(
      southOrganizer,
      context({
        missionContentStatusByMissionId: { 'south-stability': 'available' },
        activeMissionId: 'district-ties',
        hasAttemptedActiveMission: true,
      }),
    )
    expect(state).toEqual({ kind: 'mission', phase: 'available' })
  })

  it('is "inProgress" once the player has attempted the linked mission while it is active', () => {
    const state = getNpcDialogueState(
      northWarden,
      context({
        missionContentStatusByMissionId: { 'first-contact': 'available' },
        activeMissionId: 'first-contact',
        hasAttemptedActiveMission: true,
      }),
    )
    expect(state).toEqual({ kind: 'mission', phase: 'inProgress' })
  })

  it('is "completed" once the linked mission is completed, regardless of the active mission', () => {
    const state = getNpcDialogueState(
      northWarden,
      context({
        missionContentStatusByMissionId: { 'first-contact': 'completed' },
        activeMissionId: 'district-ties',
      }),
    )
    expect(state).toEqual({ kind: 'mission', phase: 'completed' })
  })

  it('defaults to "locked" when the linked mission has no entry in context at all', () => {
    const state = getNpcDialogueState(northWarden, context({ missionContentStatusByMissionId: {} }))
    expect(state).toEqual({ kind: 'mission', phase: 'locked' })
  })
})

describe('getNpcDialogueState — district-status NPCs', () => {
  it("reflects the NPC's home district status", () => {
    const state = getNpcDialogueState(archivistMera, context({ districtStatusByDistrictId: { core: 'thriving' } }))
    expect(state).toEqual({ kind: 'district', status: 'thriving' })
  })

  it('falls back to static when the district has no known status', () => {
    const state = getNpcDialogueState(archivistMera, context({ districtStatusByDistrictId: {} }))
    expect(state).toEqual({ kind: 'static' })
  })
})

describe('getNpcDialogueState — static NPCs', () => {
  it('is always static for City Voice, regardless of mission/district data', () => {
    const state = getNpcDialogueState(
      cityVoice,
      context({ districtStatusByDistrictId: { core: 'unstable' }, missionContentStatusByMissionId: { 'first-contact': 'available' } }),
    )
    expect(state).toEqual({ kind: 'static' })
  })
})
