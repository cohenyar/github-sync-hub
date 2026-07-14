import { describe, expect, it } from 'vitest'
import type { MissionConfig } from '../missions'
import { defaultCampaign } from './defaultCampaign'
import { getCampaignSummary, getCurrentMission, getNextMission, isCampaignComplete } from './selectors'
import type { CampaignProgress, GameCampaign } from './types'

function makeMission(id: string): MissionConfig {
  return { id, title: `Mission ${id}`, goal: 'goal', prompt: 'prompt', setupSql: '', referenceSql: 'SELECT 1' }
}

const missionA = makeMission('a')
const missionB = makeMission('b')
const missionC = makeMission('c')

const testCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
    { order: 3, missionId: 'c' },
  ],
}

function resolve(id: string): MissionConfig | undefined {
  return { a: missionA, b: missionB, c: missionC }[id]
}

function progress(completed: string[]): CampaignProgress {
  return { completedMissionIds: completed }
}

describe('campaign ordering', () => {
  it('resolves the current mission by declared order, not array position', () => {
    const shuffled: GameCampaign = {
      ...testCampaign,
      missions: [
        { order: 3, missionId: 'c' },
        { order: 1, missionId: 'a' },
        { order: 2, missionId: 'b' },
      ],
    }
    expect(getCurrentMission(shuffled, progress([]), resolve)).toEqual(missionA)
  })
})

describe('getCurrentMission', () => {
  it('returns the first uncompleted mission', () => {
    expect(getCurrentMission(testCampaign, progress([]), resolve)).toEqual(missionA)
  })

  it('skips completed missions', () => {
    expect(getCurrentMission(testCampaign, progress(['a']), resolve)).toEqual(missionB)
  })

  it('returns undefined once every mission is completed', () => {
    expect(getCurrentMission(testCampaign, progress(['a', 'b', 'c']), resolve)).toBeUndefined()
  })
})

describe('getNextMission', () => {
  it('returns the mission after the current one', () => {
    expect(getNextMission(testCampaign, progress([]), resolve)).toEqual(missionB)
  })

  it('returns undefined for the final mission', () => {
    expect(getNextMission(testCampaign, progress(['a', 'b']), resolve)).toBeUndefined()
  })

  it('returns undefined once the campaign is complete', () => {
    expect(getNextMission(testCampaign, progress(['a', 'b', 'c']), resolve)).toBeUndefined()
  })
})

describe('isCampaignComplete', () => {
  it('is false when any mission is incomplete', () => {
    expect(isCampaignComplete(testCampaign, progress(['a', 'b']))).toBe(false)
  })

  it('is true once every mission is completed', () => {
    expect(isCampaignComplete(testCampaign, progress(['a', 'b', 'c']))).toBe(true)
  })

  it('is false for an empty campaign', () => {
    expect(isCampaignComplete({ id: 'empty', title: 'Empty', missions: [] }, progress([]))).toBe(false)
  })
})

describe('getCampaignSummary', () => {
  it('reports mission 1 of 3 at the start', () => {
    expect(getCampaignSummary(testCampaign, progress([]))).toEqual({
      totalMissions: 3,
      completedMissions: 0,
      currentMissionIndex: 1,
      isComplete: false,
    })
  })

  it('reports mission 2 of 3 after completing the first', () => {
    expect(getCampaignSummary(testCampaign, progress(['a']))).toEqual({
      totalMissions: 3,
      completedMissions: 1,
      currentMissionIndex: 2,
      isComplete: false,
    })
  })

  it('reports the final index and isComplete once every mission is done', () => {
    expect(getCampaignSummary(testCampaign, progress(['a', 'b', 'c']))).toEqual({
      totalMissions: 3,
      completedMissions: 3,
      currentMissionIndex: 3,
      isComplete: true,
    })
  })
})

describe('backward compatibility with the real campaign', () => {
  it('the current mission matches the existing default mission when nothing is completed', () => {
    expect(getCurrentMission(defaultCampaign, progress([]))?.id).toBe('first-contact')
  })

  it('reports "mission 1 of N" for the real campaign, where N is the registered mission count', () => {
    expect(getCampaignSummary(defaultCampaign, progress([]))).toEqual({
      totalMissions: defaultCampaign.missions.length,
      completedMissions: 0,
      currentMissionIndex: 1,
      isComplete: false,
    })
  })

  it('previews the second mission as next once a second mission is registered', () => {
    if (defaultCampaign.missions.length < 2) return
    expect(getNextMission(defaultCampaign, progress([]))?.id).toBe('district-ties')
  })

  it('is not complete once only the first mission is done, when more than one mission is registered', () => {
    if (defaultCampaign.missions.length < 2) return
    expect(isCampaignComplete(defaultCampaign, progress(['first-contact']))).toBe(false)
  })

  it('is complete once every registered mission is done', () => {
    const allIds = defaultCampaign.missions.map((entry) => entry.missionId)
    expect(isCampaignComplete(defaultCampaign, progress(allIds))).toBe(true)
  })
})
