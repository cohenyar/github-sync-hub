import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { defaultCampaign } from '../../campaign'
import { createInitialPlayerProgress } from '../services/createInitialPlayerProgress'
import { recordLessonCompletion } from '../services/recordLessonCompletion'
import { recordMissionCompletion } from '../services/recordMissionCompletion'
import { recordNpcConversation } from '../services/recordNpcConversation'
import {
  getCompletionPercentage,
  getCurrentMissionId,
  getExplorerRank,
  getExplorerRankLabel,
  getNpcConversationCount,
  getNpcFamiliarityLabel,
  getNpcFamiliarityTier,
  getPlayerProgressSummary,
  getUnlockedMissionIds,
  hasLocalPlayerProfile,
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

describe('getExplorerRank (Meridian 1.3 — one shared rank across every subject)', () => {
  it('starts at the newcomer tier with zero completions', () => {
    const progress = createInitialPlayerProgress()
    const rank = getExplorerRank(progress)
    expect(rank.completions).toBe(0)
    expect(rank.tier).toBe('newcomer')
  })

  it('counts a lesson completion toward the same rank as a mission completion', () => {
    let progress = createInitialPlayerProgress()
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    expect(getExplorerRank(progress).completions).toBe(1)
    expect(getExplorerRank(progress).tier).toBe('helper')

    progress = recordMissionCompletion(progress, 'first-contact', defaultCampaign)
    expect(getExplorerRank(progress).completions).toBe(2)
  })

  it('advances through every tier as total completions (missions + lessons) rise', () => {
    let progress = createInitialPlayerProgress()
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    progress = recordLessonCompletion(progress, 'lesson:english-001')
    progress = recordMissionCompletion(progress, 'first-contact', defaultCampaign)
    progress = recordMissionCompletion(progress, 'district-ties', defaultCampaign)
    expect(getExplorerRank(progress).tier).toBe('trusted')

    progress = recordMissionCompletion(progress, 'south-stability', defaultCampaign)
    progress = recordMissionCompletion(progress, 'full-signal', defaultCampaign)
    progress = recordMissionCompletion(progress, 'linked-records', defaultCampaign)
    expect(getExplorerRank(progress).tier).toBe('guardian')
  })

  it('reports the total content count as missions plus lessons together', () => {
    const progress = createInitialPlayerProgress()
    expect(getExplorerRank(progress).totalContent).toBe(defaultCampaign.missions.length + 2)
  })

  it('gives every tier a non-empty, distinct label', () => {
    const tiers = ['newcomer', 'helper', 'trusted', 'guardian'] as const
    const labels = tiers.map(getExplorerRankLabel)
    for (const label of labels) expect(label.length).toBeGreaterThan(0)
    expect(new Set(labels).size).toBe(tiers.length)
  })
})

describe('NPC familiarity (Meridian 1.3)', () => {
  it('starts a never-met NPC at zero conversations and the stranger tier', () => {
    const progress = createInitialPlayerProgress()
    expect(getNpcConversationCount(progress, 'archivist-mera')).toBe(0)
    expect(getNpcFamiliarityTier(progress, 'archivist-mera')).toBe('stranger')
  })

  it('advances through every tier as conversation count rises, independent of other NPCs', () => {
    let progress = createInitialPlayerProgress()
    progress = recordNpcConversation(progress, 'archivist-mera')
    expect(getNpcFamiliarityTier(progress, 'archivist-mera')).toBe('acquaintance')
    expect(getNpcFamiliarityTier(progress, 'north-warden')).toBe('stranger')

    for (let i = 0; i < 4; i += 1) progress = recordNpcConversation(progress, 'archivist-mera')
    expect(getNpcConversationCount(progress, 'archivist-mera')).toBe(5)
    expect(getNpcFamiliarityTier(progress, 'archivist-mera')).toBe('trusted')

    for (let i = 0; i < 5; i += 1) progress = recordNpcConversation(progress, 'archivist-mera')
    expect(getNpcConversationCount(progress, 'archivist-mera')).toBe(10)
    expect(getNpcFamiliarityTier(progress, 'archivist-mera')).toBe('friend')
  })

  it('gives every tier a non-empty, distinct label', () => {
    const tiers = ['stranger', 'acquaintance', 'trusted', 'friend'] as const
    const labels = tiers.map(getNpcFamiliarityLabel)
    for (const label of labels) expect(label.length).toBeGreaterThan(0)
    expect(new Set(labels).size).toBe(tiers.length)
  })
})

describe('hasLocalPlayerProfile (Meridian 1.4)', () => {
  it('is false for a fresh save with no name set yet', () => {
    expect(hasLocalPlayerProfile(createInitialPlayerProgress())).toBe(false)
  })

  it('is true once a real name is set', () => {
    expect(hasLocalPlayerProfile({ ...createInitialPlayerProgress(), playerName: 'נועה' })).toBe(true)
  })

  it('treats a whitespace-only name the same as no name', () => {
    expect(hasLocalPlayerProfile({ ...createInitialPlayerProgress(), playerName: '   ' })).toBe(false)
  })
})
