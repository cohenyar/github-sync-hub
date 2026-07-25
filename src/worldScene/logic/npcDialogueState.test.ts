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

describe('getNpcDialogueState — lesson-linked NPCs (Batch 3A.4B)', () => {
  const mathTeacher: NpcConfig = {
    id: 'math-teacher',
    name: 'נדב שטרן',
    districtId: 'core',
    role: 'Mathematics Teacher',
    description: '',
  }
  const englishTeacher: NpcConfig = {
    id: 'english-teacher',
    name: 'טליה ריבס',
    districtId: 'core',
    role: 'English Teacher',
    description: '',
  }

  it('is "available" for both teachers when their lesson has not been completed, regardless of mission/district data', () => {
    const ctx = context({
      districtStatusByDistrictId: { core: 'unstable' },
      missionContentStatusByMissionId: { 'first-contact': 'available' },
    })

    expect(getNpcDialogueState(mathTeacher, ctx)).toEqual({ kind: 'lesson', phase: 'available' })
    expect(getNpcDialogueState(englishTeacher, ctx)).toEqual({ kind: 'lesson', phase: 'available' })
  })

  it('is "available" when completedLessonIds is entirely absent from the context', () => {
    expect(getNpcDialogueState(mathTeacher, context())).toEqual({ kind: 'lesson', phase: 'available' })
  })

  it('is "completed" for the math teacher once lesson:math-001 is in completedLessonIds, independent of the english teacher', () => {
    const ctx = context({ completedLessonIds: ['lesson:math-001'] })

    expect(getNpcDialogueState(mathTeacher, ctx)).toEqual({ kind: 'lesson', phase: 'completed' })
    expect(getNpcDialogueState(englishTeacher, ctx)).toEqual({ kind: 'lesson', phase: 'available' })
  })

  it('is "completed" for the english teacher once lesson:english-001 is in completedLessonIds', () => {
    const ctx = context({ completedLessonIds: ['lesson:english-001'] })
    expect(getNpcDialogueState(englishTeacher, ctx)).toEqual({ kind: 'lesson', phase: 'completed' })
  })
})
