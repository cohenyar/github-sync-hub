import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordLessonCompletion } from './recordLessonCompletion'
import { recordMissionCompletion } from './recordMissionCompletion'

const threeStageCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
    { order: 3, missionId: 'c' },
  ],
}

describe('recordLessonCompletion', () => {
  it('adds the lesson id to completedLessonIds', () => {
    const initial = createInitialPlayerProgress(threeStageCampaign)
    const next = recordLessonCompletion(initial, 'lesson:math-001')

    expect(next.completedLessonIds).toEqual(['lesson:math-001'])
  })

  it('accumulates completions across multiple calls', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    progress = recordLessonCompletion(progress, 'lesson:english-001')

    expect(progress.completedLessonIds).toEqual(['lesson:math-001', 'lesson:english-001'])
  })

  it('is idempotent: completing the same lesson twice does not duplicate it', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    const again = recordLessonCompletion(progress, 'lesson:math-001')

    expect(again).toBe(progress)
    expect(again.completedLessonIds).toEqual(['lesson:math-001'])
  })

  it('defaults a missing completedLessonIds field to [] before appending', () => {
    const initial = createInitialPlayerProgress(threeStageCampaign)
    const withoutField = { ...initial, completedLessonIds: undefined }
    const next = recordLessonCompletion(withoutField, 'lesson:math-001')

    expect(next.completedLessonIds).toEqual(['lesson:math-001'])
  })

  it('never touches completedMissionIds, completions, unlockState, or campaignProgress', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    const before = {
      completedMissionIds: progress.completedMissionIds,
      completions: progress.completions,
      unlockState: progress.unlockState,
      campaignProgress: progress.campaignProgress,
    }

    const next = recordLessonCompletion(progress, 'lesson:math-001')

    expect(next.completedMissionIds).toEqual(before.completedMissionIds)
    expect(next.completions).toEqual(before.completions)
    expect(next.unlockState).toEqual(before.unlockState)
    expect(next.campaignProgress).toEqual(before.campaignProgress)
  })
})
