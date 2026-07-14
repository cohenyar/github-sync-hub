// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalStorageAdapter } from './storageAdapter'

describe('createLocalStorageAdapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults to window.localStorage', () => {
    const adapter = createLocalStorageAdapter()

    adapter.setItem('k', 'v')
    expect(window.localStorage.getItem('k')).toBe('v')
    expect(adapter.getItem('k')).toBe('v')

    adapter.removeItem('k')
    expect(window.localStorage.getItem('k')).toBeNull()
  })

  it('returns null for a missing key', () => {
    const adapter = createLocalStorageAdapter()
    expect(adapter.getItem('missing')).toBeNull()
  })
})
