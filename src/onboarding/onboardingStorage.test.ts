import { describe, expect, it } from 'vitest'
import type { GameStorage } from '../persistence'
import { clearOnboardingFlag, hasCompletedOnboarding, markOnboardingComplete } from './onboardingStorage'

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

describe('onboardingStorage', () => {
  it('defaults to not completed', () => {
    const storage = createFakeStorage()
    expect(hasCompletedOnboarding(storage)).toBe(false)
  })

  it('is true after marking complete', () => {
    const storage = createFakeStorage()
    markOnboardingComplete(storage)
    expect(hasCompletedOnboarding(storage)).toBe(true)
  })

  it('is false again after clearing', () => {
    const storage = createFakeStorage()
    markOnboardingComplete(storage)
    clearOnboardingFlag(storage)
    expect(hasCompletedOnboarding(storage)).toBe(false)
  })

  it('clearing an already-clear flag is a safe no-op', () => {
    const storage = createFakeStorage()
    expect(() => clearOnboardingFlag(storage)).not.toThrow()
    expect(hasCompletedOnboarding(storage)).toBe(false)
  })

  it('lives under its own key, independent of any other storage entry', () => {
    const storage = createFakeStorage()
    storage.setItem('meridian:save', 'unrelated-save-payload')
    markOnboardingComplete(storage)
    expect(storage.getItem('meridian:save')).toBe('unrelated-save-payload')
    clearOnboardingFlag(storage)
    expect(storage.getItem('meridian:save')).toBe('unrelated-save-payload')
  })
})
