import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { getSqlReferenceAnswerItems } from './sqlReferenceAnswers'

describe('getSqlReferenceAnswerItems', () => {
  it('returns one reference answer per registered mission', () => {
    expect(getSqlReferenceAnswerItems()).toHaveLength(missionRegistry.length)
  })

  it('exposes each mission referenceSql under its mission id and title', () => {
    const [mission] = missionRegistry
    expect(getSqlReferenceAnswerItems()).toContainEqual({
      missionId: mission.id,
      missionTitle: mission.title,
      referenceSql: mission.referenceSql,
    })
  })
})
