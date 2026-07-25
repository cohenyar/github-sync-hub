import { describe, expect, it } from 'vitest'
import { isLessonCompleted, type PlayerProgress } from '../../progression'
import { createWorldState } from '../../worldState'
import { clearSavedGame, loadCurrentGame, saveCurrentGame } from './gameSaveService'
import type { GameStorage } from './storageAdapter'

function createFakeStorage(): GameStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

const playerProgress: PlayerProgress = {
  completedMissionIds: ['first-contact'],
  completions: [{ missionId: 'first-contact', sequence: 1 }],
  unlockState: { unlockedMissionIds: ['first-contact', 'district-ties'] },
  campaignProgress: { campaignId: 'meridian-campaign', currentMissionId: 'district-ties', isComplete: false },
}

describe('gameSaveService', () => {
  it('returns null when nothing has been saved yet', () => {
    const storage = createFakeStorage()
    expect(loadCurrentGame(storage)).toBeNull()
  })

  it('loads back exactly what was saved', () => {
    const storage = createFakeStorage()
    const world = createWorldState([{ id: 'north', stats: { loyalty: 55 } }])

    saveCurrentGame(world, playerProgress, storage)

    expect(loadCurrentGame(storage)).toEqual({ version: 1, world, playerProgress })
  })

  it('overwrites a previous save', () => {
    const storage = createFakeStorage()
    saveCurrentGame(createWorldState([]), playerProgress, storage)

    const secondWorld = createWorldState([{ id: 'south', stats: { stability: 20 } }])
    saveCurrentGame(secondWorld, playerProgress, storage)

    expect(loadCurrentGame(storage)?.world).toEqual(secondWorld)
  })

  it('returns null after the save is cleared', () => {
    const storage = createFakeStorage()
    saveCurrentGame(createWorldState([]), playerProgress, storage)

    clearSavedGame(storage)

    expect(loadCurrentGame(storage)).toBeNull()
  })

  it('returns null when the stored value is corrupted', () => {
    const storage = createFakeStorage()
    storage.setItem('meridian:save', 'not valid json')

    expect(loadCurrentGame(storage)).toBeNull()
  })
})

describe('gameSaveService — completedLessonIds (Batch 3A.4B)', () => {
  it('saves and reloads with the lesson still marked completed', () => {
    const storage = createFakeStorage()
    const world = createWorldState([])
    const withLesson: PlayerProgress = { ...playerProgress, completedLessonIds: ['lesson:math-001'] }

    saveCurrentGame(world, withLesson, storage)
    const reloaded = loadCurrentGame(storage)

    expect(reloaded).not.toBeNull()
    expect(isLessonCompleted(reloaded!.playerProgress, 'lesson:math-001')).toBe(true)
  })

  it('loads an older save with no completedLessonIds field safely, treating every lesson as not completed', () => {
    const storage = createFakeStorage()
    // playerProgress (module-level fixture) has no completedLessonIds field at all.
    saveCurrentGame(createWorldState([]), playerProgress, storage)

    const reloaded = loadCurrentGame(storage)
    expect(reloaded).not.toBeNull()
    expect(isLessonCompleted(reloaded!.playerProgress, 'lesson:math-001')).toBe(false)
  })
})
