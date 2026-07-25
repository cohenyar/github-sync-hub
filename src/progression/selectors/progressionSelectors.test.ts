import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { defaultCampaign } from '../../campaign'
import { createInitialPlayerProgress } from '../services/createInitialPlayerProgress'
import { recordLessonCompletion } from '../services/recordLessonCompletion'
import { recordMissionCompletion } from '../services/recordMissionCompletion'
import {
  getCompletionPercentage,
  getCurrentMissionId,
  getPlayerProgressSummary,
  getUnlockedMissionIds,
  isLessonCompleted,
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

describe('isLessonCompleted (Batch 3A.4B)', () => {
  it('is false before the lesson is recorded', () => {
    const progress = createInitialPlayerProgress(threeStageCampaign)
    expect(isLessonCompleted(progress, 'lesson:math-001')).toBe(false)
  })

  it('is true once the lesson is recorded', () => {
    const progress = recordLessonCompletion(createInitialPlayerProgress(threeStageCampaign), 'lesson:math-001')
    expect(isLessonCompleted(progress, 'lesson:math-001')).toBe(true)
  })

  it('defaults to false when completedLessonIds is entirely absent (an older save)', () => {
    const progress = { ...createInitialPlayerProgress(threeStageCampaign), completedLessonIds: undefined }
    expect(isLessonCompleted(progress, 'lesson:math-001')).toBe(false)
  })
})

describe('lesson completion does not affect SQL campaign completion (Batch 3A.4B)', () => {
  it('completing a lesson does not change completedMissionIds-derived counts', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    const before = getPlayerProgressSummary(progress, threeStageCampaign)

    progress = recordLessonCompletion(progress, 'lesson:math-001')
    progress = recordLessonCompletion(progress, 'lesson:english-001')
    const after = getPlayerProgressSummary(progress, threeStageCampaign)

    expect(after).toEqual(before)
  })

  it('completing every lesson never makes the SQL campaign complete on its own', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    progress = recordLessonCompletion(progress, 'lesson:english-001')

    expect(getPlayerProgressSummary(progress, threeStageCampaign).isCampaignComplete).toBe(false)
    expect(getCompletionPercentage(progress, threeStageCampaign)).toBe(0)
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
