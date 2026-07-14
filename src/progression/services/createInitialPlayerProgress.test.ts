import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import { defaultCampaign } from '../../campaign'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'

const threeStageCampaign: GameCampaign = {
  id: 'test-campaign',
  title: 'Test Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
    { order: 3, missionId: 'c' },
  ],
}

describe('createInitialPlayerProgress', () => {
  it('starts with nothing completed', () => {
    expect(createInitialPlayerProgress(threeStageCampaign).completedMissionIds).toEqual([])
    expect(createInitialPlayerProgress(threeStageCampaign).completions).toEqual([])
  })

  it('unlocks only the first mission by declared order', () => {
    const shuffled: GameCampaign = {
      ...threeStageCampaign,
      missions: [
        { order: 3, missionId: 'c' },
        { order: 1, missionId: 'a' },
        { order: 2, missionId: 'b' },
      ],
    }
    expect(createInitialPlayerProgress(shuffled).unlockState.unlockedMissionIds).toEqual(['a'])
  })

  it('sets the current mission to the first mission', () => {
    expect(createInitialPlayerProgress(threeStageCampaign).campaignProgress.currentMissionId).toBe('a')
  })

  it('is not complete', () => {
    expect(createInitialPlayerProgress(threeStageCampaign).campaignProgress.isComplete).toBe(false)
  })

  it('handles an empty campaign without crashing', () => {
    const empty: GameCampaign = { id: 'empty', title: 'Empty', missions: [] }
    const progress = createInitialPlayerProgress(empty)
    expect(progress.unlockState.unlockedMissionIds).toEqual([])
    expect(progress.campaignProgress.currentMissionId).toBeNull()
  })

  it('defaults to the real campaign when none is given', () => {
    expect(createInitialPlayerProgress().campaignProgress.campaignId).toBe(defaultCampaign.id)
  })
})
