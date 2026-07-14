import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { getSqlChallengeContent } from './sqlChallengeContentAdapter'

describe('getSqlChallengeContent', () => {
  it('returns one challenge per registered mission', () => {
    expect(getSqlChallengeContent()).toHaveLength(missionRegistry.length)
  })

  it('exposes each mission referenceSql under its mission id and title', () => {
    const [mission] = missionRegistry
    expect(getSqlChallengeContent()).toContainEqual({
      missionId: mission.id,
      missionTitle: mission.title,
      referenceSql: mission.referenceSql,
    })
  })
})
