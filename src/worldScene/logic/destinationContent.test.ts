import { describe, expect, it } from 'vitest'
import { defaultCampaign } from '../../campaign'
import { createInitialPlayerProgress, recordMissionCompletion, type PlayerProgress } from '../../progression'
import {
  DESTINATION_IDS,
  getDestinationConfig,
  getDestinationContentStatus,
  getDestinationEntryMission,
  getDestinationLockRequirementMissionId,
  getDestinationMissions,
  getDestinationProgress,
} from './destinationContent'

function progress(completedMissionIds: readonly string[]): PlayerProgress {
  let result = createInitialPlayerProgress(defaultCampaign)
  for (const missionId of completedMissionIds) {
    result = recordMissionCompletion(result, missionId, defaultCampaign)
  }
  return result
}

describe('getDestinationConfig', () => {
  it('names every destination in Hebrew, never exposing the raw district id', () => {
    for (const id of DESTINATION_IDS) {
      const config = getDestinationConfig(id)
      expect(config).toBeDefined()
      expect(config!.name).not.toBe(id)
      expect(/[֐-׿]/.test(config!.name)).toBe(true)
    }
  })

  it('gives East three missions and the Hub exactly one', () => {
    expect(getDestinationMissions('east').map((m) => m.id)).toEqual(['full-signal', 'linked-records', 'priority-signal'])
    expect(getDestinationMissions('core').map((m) => m.id)).toEqual(['first-contact'])
  })

  it('returns undefined for an unknown destination id', () => {
    expect(getDestinationConfig('west')).toBeUndefined()
    expect(getDestinationMissions('west')).toEqual([])
  })
})

describe('getDestinationEntryMission', () => {
  it('enters on the first mission when nothing is completed yet', () => {
    expect(getDestinationEntryMission('east', progress([]))?.id).toBe('full-signal')
  })

  it('advances to the next incomplete mission as earlier ones complete', () => {
    expect(getDestinationEntryMission('east', progress(['full-signal']))?.id).toBe('linked-records')
    expect(getDestinationEntryMission('east', progress(['full-signal', 'linked-records']))?.id).toBe('priority-signal')
  })

  it('falls back to the last mission once every mission in the destination is completed', () => {
    const allDone = progress(['full-signal', 'linked-records', 'priority-signal'])
    expect(getDestinationEntryMission('east', allDone)?.id).toBe('priority-signal')
  })

  it('returns undefined for a destination with no missions', () => {
    expect(getDestinationEntryMission('west', progress([]))).toBeUndefined()
  })
})

describe('getDestinationContentStatus', () => {
  it('the three subject-starting destinations (core/north/south) are all open from a brand new game — Meridian 2.0', () => {
    // History (core), English (north), and Math (south) each start with an
    // always-unlocked first mission — no subject blocks another.
    expect(getDestinationContentStatus('core', progress([]))).toBe('available')
    expect(getDestinationContentStatus('north', progress([]))).toBe('available')
    expect(getDestinationContentStatus('south', progress([]))).toBe('available')
  })

  it('east is locked only until at least one subject\'s first mission is completed', () => {
    expect(getDestinationContentStatus('east', progress([]))).toBe('locked')
    // Completing English's first mission alone is enough to open East for
    // English's own continuation (linked-records) — no History or Math
    // required, proving East no longer gates one subject behind another.
    expect(getDestinationContentStatus('east', progress(['district-ties']))).toBe('available')
  })

  it('is available mid-way through a multi-mission destination', () => {
    expect(getDestinationContentStatus('east', progress(['first-contact', 'district-ties', 'south-stability', 'full-signal']))).toBe(
      'available',
    )
  })

  it('is completed only once every mission in the destination is done', () => {
    const allSix = progress([
      'first-contact',
      'district-ties',
      'south-stability',
      'full-signal',
      'linked-records',
      'priority-signal',
    ])
    expect(getDestinationContentStatus('east', allSix)).toBe('completed')
    expect(getDestinationContentStatus('core', allSix)).toBe('completed')
  })
})

describe('getDestinationLockRequirementMissionId (Meridian 2.0 open-world pass)', () => {
  it('names the same-subject prerequisite for a fully locked destination', () => {
    // East's own first-listed mission is full-signal (History), whose real
    // prerequisite is now first-contact — History's own first mission, not
    // an unrelated subject like the old cross-subject chain used to require.
    expect(getDestinationLockRequirementMissionId('east', progress([]))).toBe('first-contact')
  })

  it('is undefined once the destination is no longer locked', () => {
    expect(
      getDestinationLockRequirementMissionId('east', progress(['first-contact', 'district-ties', 'south-stability'])),
    ).toBeUndefined()
  })

  it('is undefined for a destination that was never gated (always available)', () => {
    expect(getDestinationLockRequirementMissionId('core', progress([]))).toBeUndefined()
  })
})

describe('getDestinationProgress', () => {
  it('counts completed missions against the destination\'s own total, not the whole campaign', () => {
    expect(getDestinationProgress('east', progress([]))).toEqual({ completed: 0, total: 3 })
    expect(
      getDestinationProgress('east', progress(['first-contact', 'district-ties', 'south-stability', 'full-signal'])),
    ).toEqual({ completed: 1, total: 3 })
    expect(getDestinationProgress('core', progress(['first-contact']))).toEqual({ completed: 1, total: 1 })
  })
})
