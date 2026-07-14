import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../missions'
import { defaultCampaign } from './defaultCampaign'

describe('defaultCampaign', () => {
  it('includes one entry per registered mission, in registry order', () => {
    expect(defaultCampaign.missions).toEqual(
      missionRegistry.map((mission, index) => ({ order: index + 1, missionId: mission.id })),
    )
  })

  it('has a stable id and a non-empty title', () => {
    expect(defaultCampaign.id).toBe('meridian-campaign')
    expect(defaultCampaign.title.length).toBeGreaterThan(0)
  })
})
