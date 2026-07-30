import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { setPlayerProfile } from './setPlayerProfile'

describe('setPlayerProfile', () => {
  it('sets the name and avatar id', () => {
    const progress = setPlayerProfile(createInitialPlayerProgress(), 'נועה', 'azure')
    expect(progress.playerName).toBe('נועה')
    expect(progress.playerAvatarId).toBe('azure')
  })

  it('trims surrounding whitespace from the name', () => {
    const progress = setPlayerProfile(createInitialPlayerProgress(), '  נועה  ', 'azure')
    expect(progress.playerName).toBe('נועה')
  })

  it('treats a whitespace-only name as no name, not literal whitespace', () => {
    const progress = setPlayerProfile(createInitialPlayerProgress(), '   ', 'azure')
    expect(progress.playerName).toBeUndefined()
  })

  it('overwrites a previous name/avatar rather than merging', () => {
    let progress = createInitialPlayerProgress()
    progress = setPlayerProfile(progress, 'נועה', 'azure')
    progress = setPlayerProfile(progress, 'דניאל', 'violet')
    expect(progress.playerName).toBe('דניאל')
    expect(progress.playerAvatarId).toBe('violet')
  })

  it('does not touch completedMissionIds, completions, unlockState, or campaignProgress', () => {
    const before = createInitialPlayerProgress()
    const after = setPlayerProfile(before, 'נועה', 'azure')
    expect(after.completedMissionIds).toBe(before.completedMissionIds)
    expect(after.completions).toBe(before.completions)
    expect(after.unlockState).toBe(before.unlockState)
    expect(after.campaignProgress).toBe(before.campaignProgress)
  })
})
