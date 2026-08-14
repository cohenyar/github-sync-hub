import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { validateMissionContent } from '../validation/validateMissionContent'
import { getMissionContent } from './missionContentAdapter'

describe('getMissionContent', () => {
  it('adapts every registered mission', () => {
    expect(getMissionContent()).toHaveLength(missionRegistry.length)
  })

  it('maps id, title, goal, and prompt from the real mission', () => {
    const [mission] = missionRegistry
    expect(getMissionContent()).toContainEqual({
      id: mission.id,
      title: mission.title,
      goal: mission.goal,
      prompt: mission.prompt,
    })
  })

  it('produces content that passes validation', () => {
    for (const content of getMissionContent()) {
      expect(validateMissionContent(content).valid).toBe(true)
    }
  })
})
