import { describe, expect, it } from 'vitest'
import type { PlayerProgress } from '../../progression'
import { createWorldState } from '../../worldState'
import { CURRENT_SAVE_VERSION, serializeSaveGame } from './serializeSaveGame'

const playerProgress: PlayerProgress = {
  completedMissionIds: ['first-contact'],
  completions: [{ missionId: 'first-contact', sequence: 1 }],
  unlockState: { unlockedMissionIds: ['first-contact', 'district-ties'] },
  campaignProgress: { campaignId: 'meridian-campaign', currentMissionId: 'district-ties', isComplete: false },
}

describe('serializeSaveGame', () => {
  it('stamps the current version alongside the given state', () => {
    const world = createWorldState([{ id: 'north', stats: { loyalty: 55 } }])

    const json = serializeSaveGame({ world, playerProgress })
    const parsed = JSON.parse(json)

    expect(parsed).toEqual({ version: CURRENT_SAVE_VERSION, world, playerProgress })
  })
})
