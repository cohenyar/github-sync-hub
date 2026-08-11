import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import { toCmsError, unavailableResult } from './shared'

describe('toCmsError', () => {
  it('returns null when there is no error', () => {
    expect(toCmsError(null)).toBeNull()
  })

  it('never leaks the raw Postgres/PostgREST message to the caller', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = toCmsError({ message: 'permission denied for table profiles' })
    expect(result).toBe(he.cmsGenericError)
    expect(result).not.toContain('permission denied')
    consoleSpy.mockRestore()
  })
})

describe('unavailableResult', () => {
  it('returns a null data payload with the unavailable message', () => {
    expect(unavailableResult()).toEqual({ data: null, error: he.cmsUnavailableMessage })
  })
})
