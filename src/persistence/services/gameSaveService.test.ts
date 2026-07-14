import { describe, expect, it } from 'vitest'
import type { PlayerProgress } from '../../progression'
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
