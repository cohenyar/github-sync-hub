// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCloudClient } from './supabaseClient'

describe('loadCloudClient — Preview reliability pass (retry on transient chunk-load failure)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('never attempts the import, and warns "missing", when not configured', async () => {
    const importFn = vi.fn(async () => ({ supabase: { marker: 'real-client' } }))

    const result = await loadCloudClient(importFn, false)

    expect(result).toBeNull()
    expect(importFn).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('are missing from this build'))
  })

  it('resolves the real client on the first attempt when nothing fails', async () => {
    const importFn = vi.fn(async () => ({ supabase: { marker: 'real-client' } }))

    const result = await loadCloudClient(importFn, true)

    expect(result).toEqual({ marker: 'real-client' })
    expect(importFn).toHaveBeenCalledTimes(1)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  // The exact scenario this fix targets: env vars ARE present (configured
  // is true), but the one-shot dynamic import chunk-load fails once — e.g.
  // a transient network/CDN blip inside Lovable Preview's sandboxed iframe
  // — and a retry recovers it instead of permanently degrading to guest mode.
  it('recovers via retry after exactly one transient failure, and warns "present, but failed" (not "missing")', async () => {
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('simulated chunk load failure'))
      .mockResolvedValueOnce({ supabase: { marker: 'real-client' } })

    const result = await loadCloudClient(importFn, true)

    expect(result).toEqual({ marker: 'real-client' })
    expect(importFn).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('are present, but the generated client failed to load'),
      expect.any(Error),
    )
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('are missing from this build'))
  })

  it('degrades to guest mode (null), never throwing, once every attempt is exhausted', async () => {
    const importFn = vi.fn(async () => {
      throw new Error('persistent chunk load failure')
    })

    const result = await loadCloudClient(importFn, true)

    expect(result).toBeNull()
    // Bounded — this must not retry forever.
    expect(importFn.mock.calls.length).toBeGreaterThan(1)
    expect(importFn.mock.calls.length).toBeLessThanOrEqual(3)
  })
})
