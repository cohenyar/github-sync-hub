/**
 * Minimal storage contract the persistence services depend on, so they can
 * be unit-tested against an in-memory fake without a browser/jsdom present.
 */
export interface GameStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function createLocalStorageAdapter(storage: Storage = window.localStorage): GameStorage {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  }
}
