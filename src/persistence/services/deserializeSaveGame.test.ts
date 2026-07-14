import { describe, expect, it } from 'vitest'
import type { PlayerProgress } from '../../progression'
import { createWorldState } from '../../worldState'
import { deserializeSaveGame } from './deserializeSaveGame'
import { CURRENT_SAVE_VERSION, serializeSaveGame } from './serializeSaveGame'

const playerProgress: PlayerProgress = {
  completedMissionIds: ['first-contact'],
  completions: [{ missionId: 'first-contact', sequence: 1 }],
  unlockState: { unlockedMissionIds: ['first-contact', 'district-ties'] },
  campaignProgress: { campaignId: 'meridian-campaign', currentMissionId: 'district-ties', isComplete: false },
}

describe('deserializeSaveGame', () => {
  it('round-trips a value produced by serializeSaveGame', () => {
    const world = createWorldState([{ id: 'north', stats: { loyalty: 55 } }])
    const json = serializeSaveGame({ world, playerProgress })

    expect(deserializeSaveGame(json)).toEqual({ version: CURRENT_SAVE_VERSION, world, playerProgress })
  })

  it('returns null for malformed JSON', () => {
    expect(deserializeSaveGame('not json {')).toBeNull()
  })

  it('returns null when the version does not match', () => {
    const world = createWorldState([])
    const json = JSON.stringify({ version: CURRENT_SAVE_VERSION + 1, world, playerProgress })

    expect(deserializeSaveGame(json)).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    expect(deserializeSaveGame(JSON.stringify({ version: CURRENT_SAVE_VERSION }))).toBeNull()
    expect(
      deserializeSaveGame(JSON.stringify({ version: CURRENT_SAVE_VERSION, world: createWorldState([]) })),
    ).toBeNull()
  })

  it('returns null for a JSON value that is not an object', () => {
    expect(deserializeSaveGame(JSON.stringify(42))).toBeNull()
    expect(deserializeSaveGame(JSON.stringify(null))).toBeNull()
  })
})
