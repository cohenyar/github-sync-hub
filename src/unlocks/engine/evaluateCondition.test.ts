import { describe, expect, it } from 'vitest'
import type { GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import { evaluateCondition } from './evaluateCondition'

const campaign: GameCampaign = {
  id: 'campaign-1',
  title: 'Campaign',
  missions: [
    { order: 1, missionId: 'a' },
    { order: 2, missionId: 'b' },
  ],
}

function progress(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    completedMissionIds: [],
    completions: [],
    unlockState: { unlockedMissionIds: ['a'] },
    campaignProgress: { campaignId: campaign.id, currentMissionId: 'a', isComplete: false },
    ...overrides,
  }
}

describe('evaluateCondition — always', () => {
  it('is always true', () => {
    expect(evaluateCondition({ kind: 'always' }, progress(), campaign)).toBe(true)
  })
})

describe('evaluateCondition — missionCompleted', () => {
  it('is true once the mission id is in completedMissionIds', () => {
    const p = progress({ completedMissionIds: ['a'] })
    expect(evaluateCondition({ kind: 'missionCompleted', missionId: 'a' }, p, campaign)).toBe(true)
  })

  it('is false for a mission that has not completed', () => {
    expect(evaluateCondition({ kind: 'missionCompleted', missionId: 'a' }, progress(), campaign)).toBe(false)
  })

  it('is false for a mission id that does not exist in the campaign at all', () => {
    expect(evaluateCondition({ kind: 'missionCompleted', missionId: 'does-not-exist' }, progress(), campaign)).toBe(
      false,
    )
  })
})

describe('evaluateCondition — lessonCompleted', () => {
  it('is true once the lesson id is in completedLessonIds', () => {
    const p = progress({ completedLessonIds: ['lesson:english-001'] })
    expect(evaluateCondition({ kind: 'lessonCompleted', lessonId: 'lesson:english-001' }, p, campaign)).toBe(true)
  })

  it('is false for a lesson that has not completed', () => {
    expect(
      evaluateCondition({ kind: 'lessonCompleted', lessonId: 'lesson:english-001' }, progress(), campaign),
    ).toBe(false)
  })

  it('is false when completedLessonIds is entirely absent, rather than throwing', () => {
    const p = progress()
    delete (p as { completedLessonIds?: readonly string[] }).completedLessonIds
    expect(
      evaluateCondition({ kind: 'lessonCompleted', lessonId: 'lesson:english-001' }, p, campaign),
    ).toBe(false)
  })
})

describe('evaluateCondition — campaignCompleted', () => {
  it('is true once the matching campaign is complete', () => {
    const p = progress({ campaignProgress: { campaignId: campaign.id, currentMissionId: null, isComplete: true } })
    expect(evaluateCondition({ kind: 'campaignCompleted', campaignId: campaign.id }, p, campaign)).toBe(true)
  })

  it('is false when the campaign is not complete', () => {
    expect(evaluateCondition({ kind: 'campaignCompleted', campaignId: campaign.id }, progress(), campaign)).toBe(
      false,
    )
  })

  it('is false when the condition references a different campaign id', () => {
    const p = progress({ campaignProgress: { campaignId: campaign.id, currentMissionId: null, isComplete: true } })
    expect(evaluateCondition({ kind: 'campaignCompleted', campaignId: 'other-campaign' }, p, campaign)).toBe(false)
  })
})

describe('evaluateCondition — progressionPercentage', () => {
  it('is true once completion meets the threshold', () => {
    const p = progress({ completedMissionIds: ['a'] })
    expect(evaluateCondition({ kind: 'progressionPercentage', minPercentage: 50 }, p, campaign)).toBe(true)
  })

  it('is false below the threshold', () => {
    expect(evaluateCondition({ kind: 'progressionPercentage', minPercentage: 50 }, progress(), campaign)).toBe(false)
  })

  it('is true at exactly the threshold', () => {
    const p = progress({ completedMissionIds: ['a'] })
    expect(evaluateCondition({ kind: 'progressionPercentage', minPercentage: 50 }, p, campaign)).toBe(true)
  })
})
