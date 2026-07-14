import { describe, expect, it } from 'vitest'
import type { GameRewardContent } from '../types/gameRewardContent'
import { validateRewardContent } from './validateRewardContent'

const validReward: GameRewardContent = {
  missionId: 'first-contact',
  missionTitle: 'First Contact',
  effect: { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 },
}

describe('validateRewardContent', () => {
  it('accepts a well-formed reward', () => {
    expect(validateRewardContent(validReward)).toEqual({ valid: true, errors: [] })
  })

  it('rejects a reward missing missionId', () => {
    const result = validateRewardContent({ ...validReward, missionId: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('missionId must be a non-empty string')
  })

  it('rejects a reward with a malformed effect', () => {
    const result = validateRewardContent({
      ...validReward,
      effect: { kind: 'NOT_REAL' } as unknown as GameRewardContent['effect'],
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/effect\.kind must be one of/)
  })
})
