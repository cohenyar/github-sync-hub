import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { setDifficultyLevel } from './setDifficultyLevel'

describe('setDifficultyLevel (First Mission UX pass)', () => {
  it.each([1, 2, 3] as const)('sets difficultyLevel to %i', (level) => {
    const progress = setDifficultyLevel(createInitialPlayerProgress(), level)
    expect(progress.difficultyLevel).toBe(level)
  })

  it('overwrites a previous value rather than merging', () => {
    let progress = createInitialPlayerProgress()
    progress = setDifficultyLevel(progress, 3)
    progress = setDifficultyLevel(progress, 1)
    expect(progress.difficultyLevel).toBe(1)
  })

  it('never changes the campaign, missions, or story — same missions, same progression order, same unlock rules', () => {
    const before = createInitialPlayerProgress()
    const after = setDifficultyLevel(before, 3)
    expect(after.completedMissionIds).toBe(before.completedMissionIds)
    expect(after.completions).toBe(before.completions)
    expect(after.unlockState).toBe(before.unlockState)
    expect(after.campaignProgress).toBe(before.campaignProgress)
  })

  it('does not touch the player\'s name or avatar', () => {
    const before = { ...createInitialPlayerProgress(), playerName: 'נועה', playerAvatarId: 'azure' }
    const after = setDifficultyLevel(before, 2)
    expect(after.playerName).toBe('נועה')
    expect(after.playerAvatarId).toBe('azure')
  })
})
