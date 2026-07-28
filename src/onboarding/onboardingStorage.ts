import { createLocalStorageAdapter, type GameStorage } from '../persistence'

const ONBOARDING_KEY = 'meridian:onboarded'

function defaultStorage(): GameStorage {
  return createLocalStorageAdapter()
}

/**
 * Whether this player has ever finished (or skipped) the boot sequence.
 * Deliberately its own key, independent of `meridian:save` — onboarding is a
 * UI-flow concern, not part of the SaveGame shape, so New Game can reset it
 * without touching the save format at all.
 */
export function hasCompletedOnboarding(storage: GameStorage = defaultStorage()): boolean {
  return storage.getItem(ONBOARDING_KEY) === 'true'
}

export function markOnboardingComplete(storage: GameStorage = defaultStorage()): void {
  storage.setItem(ONBOARDING_KEY, 'true')
}

export function clearOnboardingFlag(storage: GameStorage = defaultStorage()): void {
  storage.removeItem(ONBOARDING_KEY)
}
