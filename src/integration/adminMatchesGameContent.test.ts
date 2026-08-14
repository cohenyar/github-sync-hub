import { describe, expect, it } from 'vitest'
import { getAdminRegistry } from '../admin/data/registry'
import { getGameContentSummary } from '../gameContent'

function itemCount(sectionId: string): number {
  return getAdminRegistry().find((section) => section.id === sectionId)?.itemCount ?? -1
}

describe('Admin sections stay in sync with the game content schema layer', () => {
  it('matches counts for every section backed by the schema layer', () => {
    const summary = getGameContentSummary()

    expect(itemCount('missions')).toBe(summary.missions)
    expect(itemCount('districts')).toBe(summary.districts)
    expect(itemCount('npcs')).toBe(summary.npcs)
    expect(itemCount('rewards')).toBe(summary.rewards)
    expect(itemCount('progression')).toBe(summary.progressionEntries)
  })
})
