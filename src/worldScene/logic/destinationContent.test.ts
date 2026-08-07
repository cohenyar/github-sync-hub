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
  it('is locked when the destination has not been reached yet', () => {
    // south-stability requires district-ties, which requires first-contact.
    expect(getDestinationContentStatus('south', progress([]))).toBe('locked')
  })

  it('is available once its first mission unlocks', () => {
    expect(getDestinationContentStatus('north', progress(['first-contact']))).toBe('available')
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

describe('getDestinationLockRequirementMissionId (playtest fix, issue 4)', () => {
  it('names the real blocking mission for a locked destination — not the destination\'s own first mission id', () => {
    // East's own first mission is full-signal, but what actually blocks it
    // (per defaultUnlockRules) is south-stability — that's what a player
    // needs to be told to go finish, not the internal mission id.
    expect(getDestinationLockRequirementMissionId('east', progress([]))).toBe('south-stability')
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
