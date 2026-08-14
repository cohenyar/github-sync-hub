import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { npcRegistry } from '../../npcs'
import { initialDistricts } from '../../worldState'
import { getGameContentSummary } from './gameContentSummary'

describe('getGameContentSummary', () => {
  it('reports the real mission and district counts', () => {
    const summary = getGameContentSummary()
    expect(summary.missions).toBe(missionRegistry.length)
    expect(summary.districts).toBe(initialDistricts.length)
  })

  it('reports rewards and progression entries derived from missions', () => {
    const summary = getGameContentSummary()
    expect(summary.rewards).toBe(missionRegistry.filter((mission) => mission.successEffect).length)
    expect(summary.progressionEntries).toBe(missionRegistry.length)
  })

  it('reports the real NPC count', () => {
    expect(getGameContentSummary().npcs).toBe(npcRegistry.length)
  })
})
