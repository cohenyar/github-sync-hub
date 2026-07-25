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

describe('deserializeSaveGame — completedLessonIds (Batch 3A.4B)', () => {
  it('round-trips a save that includes completedLessonIds', () => {
    const world = createWorldState([{ id: 'north', stats: { loyalty: 55 } }])
    const withLessons: PlayerProgress = { ...playerProgress, completedLessonIds: ['lesson:math-001'] }
    const json = serializeSaveGame({ world, playerProgress: withLessons })

    expect(deserializeSaveGame(json)).toEqual({ version: CURRENT_SAVE_VERSION, world, playerProgress: withLessons })
  })

  it('loads a save with no completedLessonIds field at all (an older save) without rejecting it', () => {
    const world = createWorldState([])
    // playerProgress (above) has no completedLessonIds field — the exact shape a save written before Batch 3A.4B would have.
    const json = serializeSaveGame({ world, playerProgress })

    const loaded = deserializeSaveGame(json)
    expect(loaded).not.toBeNull()
    expect(loaded?.playerProgress.completedLessonIds).toBeUndefined()
  })

  it('rejects a save where completedLessonIds is present but not an array', () => {
    const world = createWorldState([])
    const malformed = { ...playerProgress, completedLessonIds: 'not-an-array' }
    const json = JSON.stringify({ version: CURRENT_SAVE_VERSION, world, playerProgress: malformed })

    expect(deserializeSaveGame(json)).toBeNull()
  })
})
