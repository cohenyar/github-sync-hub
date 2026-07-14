import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { validateRewardContent } from '../validation/validateRewardContent'
import { getRewardContent } from './rewardContentAdapter'

describe('getRewardContent', () => {
  it('includes only missions that define a successEffect', () => {
    const expectedCount = missionRegistry.filter((mission) => mission.successEffect).length
    expect(getRewardContent()).toHaveLength(expectedCount)
  })

  it('produces content that passes validation', () => {
    for (const content of getRewardContent()) {
      expect(validateRewardContent(content).valid).toBe(true)
    }
  })
})
