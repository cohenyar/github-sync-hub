import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { getMissionItems } from './missions'

describe('getMissionItems', () => {
  it('returns one item per registered mission', () => {
    expect(getMissionItems()).toHaveLength(missionRegistry.length)
  })

  it('projects id, title, and goal from each mission', () => {
    const [first] = getMissionItems()
    const [mission] = missionRegistry
    expect(first).toEqual({ id: mission.id, title: mission.title, goal: mission.goal })
  })
})
