import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordArchivePageFound } from './recordArchivePageFound'
import { recordLessonCompletion } from './recordLessonCompletion'
import { recordMissionCompletion } from './recordMissionCompletion'
import { recordNpcConversation } from './recordNpcConversation'

const threeStageCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
    { order: 3, missionId: 'c' },
  ],
}

describe('recordMissionCompletion — mission completion updates', () => {
  it('adds the mission to completedMissionIds and completions', () => {
    const initial = createInitialPlayerProgress(threeStageCampaign)
    const next = recordMissionCompletion(initial, 'a', threeStageCampaign)

    expect(next.completedMissionIds).toEqual(['a'])
    expect(next.completions).toEqual([{ missionId: 'a', sequence: 1 }])
  })

  it('accumulates completions across multiple calls', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    progress = recordMissionCompletion(progress, 'b', threeStageCampaign)

    expect(progress.completedMissionIds).toEqual(['a', 'b'])
    expect(progress.completions).toEqual([
      { missionId: 'a', sequence: 1 },
      { missionId: 'b', sequence: 2 },
    ])
  })

  it('is idempotent: completing the same mission twice does not duplicate it', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    const again = recordMissionCompletion(progress, 'a', threeStageCampaign)

    expect(again).toBe(progress)
    expect(again.completedMissionIds).toEqual(['a'])
  })
})

describe('recordMissionCompletion — unlock logic', () => {
  it('unlocks the next mission once the current one completes', () => {
    const initial = createInitialPlayerProgress(threeStageCampaign)
    const next = recordMissionCompletion(initial, 'a', threeStageCampaign)

    expect(next.unlockState.unlockedMissionIds).toEqual(['a', 'b'])
    expect(next.campaignProgress.currentMissionId).toBe('b')
  })

  it('does not unlock missions beyond the next one', () => {
    const initial = createInitialPlayerProgress(threeStageCampaign)
    const next = recordMissionCompletion(initial, 'a', threeStageCampaign)

    expect(next.unlockState.unlockedMissionIds).not.toContain('c')
  })

  it('keeps earlier unlocked missions unlocked as later ones unlock', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    progress = recordMissionCompletion(progress, 'b', threeStageCampaign)

    expect(progress.unlockState.unlockedMissionIds).toEqual(['a', 'b', 'c'])
  })
})

describe('recordMissionCompletion — completed campaign', () => {
  it('marks the campaign complete once every mission is done', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    progress = recordMissionCompletion(progress, 'b', threeStageCampaign)
    progress = recordMissionCompletion(progress, 'c', threeStageCampaign)

    expect(progress.campaignProgress.isComplete).toBe(true)
    expect(progress.campaignProgress.currentMissionId).toBeNull()
  })

  it('is not complete while any mission remains', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)
    progress = recordMissionCompletion(progress, 'b', threeStageCampaign)

    expect(progress.campaignProgress.isComplete).toBe(false)
  })
})

describe('recordMissionCompletion — preserves fields it does not own (Meridian 1.3 regression)', () => {
  it('does not erase completedLessonIds recorded before this mission completed', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordLessonCompletion(progress, 'lesson:math-001')
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)

    expect(progress.completedLessonIds).toEqual(['lesson:math-001'])
  })

  it('does not erase npcFamiliarity recorded before this mission completed', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordNpcConversation(progress, 'archivist-mera')
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)

    expect(progress.npcFamiliarity).toEqual({ 'archivist-mera': 1 })
  })

  it('does not erase collectedArchivePageIds recorded before this mission completed', () => {
    let progress = createInitialPlayerProgress(threeStageCampaign)
    progress = recordArchivePageFound(progress, 'archive-page:trade-count')
    progress = recordMissionCompletion(progress, 'a', threeStageCampaign)

    expect(progress.collectedArchivePageIds).toEqual(['archive-page:trade-count'])
  })
})
