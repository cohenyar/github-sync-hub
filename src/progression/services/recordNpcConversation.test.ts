import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordNpcConversation } from './recordNpcConversation'

describe('recordNpcConversation', () => {
  it('starts a new NPC at one conversation', () => {
    const progress = recordNpcConversation(createInitialPlayerProgress(), 'archivist-mera')
    expect(progress.npcFamiliarity).toEqual({ 'archivist-mera': 1 })
  })

  it('increments an existing count rather than overwriting it', () => {
    let progress = createInitialPlayerProgress()
    progress = recordNpcConversation(progress, 'archivist-mera')
    progress = recordNpcConversation(progress, 'archivist-mera')
    progress = recordNpcConversation(progress, 'archivist-mera')
    expect(progress.npcFamiliarity).toEqual({ 'archivist-mera': 3 })
  })

  it('tracks separate NPCs independently', () => {
    let progress = createInitialPlayerProgress()
    progress = recordNpcConversation(progress, 'archivist-mera')
    progress = recordNpcConversation(progress, 'north-warden')
    progress = recordNpcConversation(progress, 'archivist-mera')
    expect(progress.npcFamiliarity).toEqual({ 'archivist-mera': 2, 'north-warden': 1 })
  })

  it('does not touch completedMissionIds, completions, unlockState, or campaignProgress', () => {
    const before = createInitialPlayerProgress()
    const after = recordNpcConversation(before, 'archivist-mera')
    expect(after.completedMissionIds).toBe(before.completedMissionIds)
    expect(after.completions).toBe(before.completions)
    expect(after.unlockState).toBe(before.unlockState)
    expect(after.campaignProgress).toBe(before.campaignProgress)
  })

  it('defaults a missing npcFamiliarity (an older save) to empty before recording, rather than throwing', () => {
    const progress = createInitialPlayerProgress()
    delete (progress as { npcFamiliarity?: Record<string, number> }).npcFamiliarity
    expect(() => recordNpcConversation(progress, 'archivist-mera')).not.toThrow()
    expect(recordNpcConversation(progress, 'archivist-mera').npcFamiliarity).toEqual({ 'archivist-mera': 1 })
  })
})
