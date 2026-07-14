import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { defaultCampaign } from '../../campaign'
import { createInitialPlayerProgress } from '../services/createInitialPlayerProgress'
import { recordMissionCompletion } from '../services/recordMissionCompletion'
import {
  getCompletionPercentage,
  getCurrentMissionId,
  getPlayerProgressSummary,
  getUnlockedMissionIds,
  isMissionUnlocked,
} from './progressionSelectors'

const threeStageCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
    { order: 3, missionId: 'c' },
  ],
}

describe('getCurrentMissionId', () => {
  it('returns the current mission id', () => {
    const progress = createInitialPlayerProgress(threeStageCampaign)
    expect(getCurrentMissionId(progress)).toBe('a')
  })

  it('returns null once the campaign is complete', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    for (const id of ['a', 'b', 'c']) progress = recordMissionCompletion(progress, id, threeStageCampaign)
    expect(getCurrentMissionId(progress)).toBeNull()
  })
})

describe('getUnlockedMissionIds / isMissionUnlocked', () => {
  it('only the first mission is unlocked initially', () => {
    const progress = createInitialPlayerProgress(threeStageCampaign)
    expect(getUnlockedMissionIds(progress)).toEqual(['a'])
    expect(isMissionUnlocked(progress, 'a')).toBe(true)
    expect(isMissionUnlocked(progress, 'b')).toBe(false)
  })

  it('unlocks the next mission after completing the current one', () => {
    const progress = recordMissionCompletion(createInitialPlayerProgress(threeStageCampaign), 'a', threeStageCampaign)
    expect(isMissionUnlocked(progress, 'b')).toBe(true)
    expect(isMissionUnlocked(progress, 'c')).toBe(false)
  })
})

describe('getCompletionPercentage', () => {
  it('is 0 at the start', () => {
    expect(getCompletionPercentage(createInitialPlayerProgress(threeStageCampaign), threeStageCampaign)).toBe(0)
  })

  it('rounds to the nearest whole percent', () => {
    const progress = recordMissionCompletion(createInitialPlayerProgress(threeStageCampaign), 'a', threeStageCampaign)
    expect(getCompletionPercentage(progress, threeStageCampaign)).toBe(33)
  })

  it('is 100 once every mission is completed', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    for (const id of ['a', 'b', 'c']) progress = recordMissionCompletion(progress, id, threeStageCampaign)
    expect(getCompletionPercentage(progress, threeStageCampaign)).toBe(100)
  })

  it('is 0 for an empty campaign rather than dividing by zero', () => {
    const empty: GameCampaign = { id: 'empty', title: 'Empty', missions: [] }
    expect(getCompletionPercentage(createInitialPlayerProgress(empty), empty)).toBe(0)
  })
})

describe('getPlayerProgressSummary', () => {
  it('combines counts, unlocks, current mission, and completion into one summary', () => {
    const progress = recordMissionCompletion(createInitialPlayerProgress(threeStageCampaign), 'a', threeStageCampaign)
    expect(getPlayerProgressSummary(progress, threeStageCampaign)).toEqual({
      completedMissions: 1,
      totalMissions: 3,
      completionPercentage: 33,
      unlockedMissionIds: ['a', 'b'],
      currentMissionId: 'b',
      isCampaignComplete: false,
    })
  })
})

describe('backward compatibility with the real campaign', () => {
  it('starts with the real first mission unlocked and current', () => {
    const progress = createInitialPlayerProgress()
    expect(getCurrentMissionId(progress)).toBe('first-contact')
    expect(getUnlockedMissionIds(progress)).toEqual(['first-contact'])
  })

  it('reports 0% complete initially, rising as each registered mission completes', () => {
    let progress = createInitialPlayerProgress()
    expect(getCompletionPercentage(progress)).toBe(0)

    const total = defaultCampaign.missions.length
    let completedCount = 0
    for (const entry of [...defaultCampaign.missions].sort((a, b) => a.order - b.order)) {
      progress = recordMissionCompletion(progress, entry.missionId, defaultCampaign)
      completedCount += 1
      expect(getCompletionPercentage(progress)).toBe(Math.round((completedCount / total) * 100))
    }

    expect(getPlayerProgressSummary(progress).isCampaignComplete).toBe(true)
  })
})
