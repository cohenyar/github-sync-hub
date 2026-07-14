import type { PlayerProgress } from '../../progression'
import type { WorldState } from '../../worldState'
import type { SaveGame } from '../types'
import { deserializeSaveGame } from './deserializeSaveGame'
import { serializeSaveGame } from './serializeSaveGame'
import { createLocalStorageAdapter, type GameStorage } from './storageAdapter'

const SAVE_KEY = 'meridian:save'

function defaultStorage(): GameStorage {
  return createLocalStorageAdapter()
}

/**
 * The only persistence entry points callers (App.tsx) should use. Storage,
 * serialization, and versioning are all owned here — callers pass plain
 * WorldState/PlayerProgress in and get a SaveGame (or null) back, with no
 * knowledge of localStorage or the on-disk format.
 */
export function saveCurrentGame(
  world: WorldState,
  playerProgress: PlayerProgress,
  storage: GameStorage = defaultStorage(),
): void {
  storage.setItem(SAVE_KEY, serializeSaveGame({ world, playerProgress }))
}

export function loadCurrentGame(storage: GameStorage = defaultStorage()): SaveGame | null {
  const raw = storage.getItem(SAVE_KEY)
  if (raw === null) return null
  return deserializeSaveGame(raw)
}

export function clearSavedGame(storage: GameStorage = defaultStorage()): void {
  storage.removeItem(SAVE_KEY)
}
