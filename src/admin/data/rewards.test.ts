import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { getRewardItems } from './rewards'

describe('getRewardItems', () => {
  it('includes only missions that define a successEffect', () => {
    const expectedCount = missionRegistry.filter((mission) => mission.successEffect).length
    expect(getRewardItems()).toHaveLength(expectedCount)
  })

  it('exposes the successEffect as the reward for a mission that has one', () => {
    const mission = missionRegistry.find((m) => m.successEffect)
    expect(mission).toBeDefined()
    expect(getRewardItems()).toContainEqual({
      missionId: mission!.id,
      missionTitle: mission!.title,
      effect: mission!.successEffect,
    })
  })
})
