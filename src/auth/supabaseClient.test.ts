// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCloudClient } from './supabaseClient'

describe('loadCloudClient — Preview reliability pass (retry on transient chunk-load failure)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    infoSpy.mockRestore()
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

  // Playtest diagnosis pass — env-var presence is reported unconditionally
  // (success or failure) as plain booleans — structurally incapable of
  // carrying the actual secret values, unlike a string would be. The real
  // ambient VITE_SUPABASE_* values in whatever environment runs this test
  // are deliberately not asserted on (they're outside this test's control);
  // only the shape/type is.
  it('always reports env-var presence as booleans, unconditionally, never the values themselves', async () => {
    const importFn = vi.fn(async () => ({ supabase: { marker: 'real-client' } }))

    await loadCloudClient(importFn, true)

    const call = infoSpy.mock.calls.find((args: unknown[]) => args[0] === '[meridian][auth-diagnostic] Cloud client load starting')
    const detail = call?.[1] as { isSupabaseConfigured: unknown; urlPresent: unknown; keyPresent: unknown }
    expect(detail).toBeDefined()
    expect(detail.isSupabaseConfigured).toBe(true)
    expect(typeof detail.urlPresent).toBe('boolean')
    expect(typeof detail.keyPresent).toBe('boolean')
  })
})

describe('loadCloudClient — failure-stage diagnosis (prove which stage fails, not assume)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it('confirms a real client was reached and classifies success, with hasClient true', async () => {
    const importFn = vi.fn(async () => ({ supabase: { marker: 'real-client' } }))

    await loadCloudClient(importFn, true)

    expect(infoSpy).toHaveBeenCalledWith(
      '[meridian][auth-diagnostic] Cloud client import succeeded',
      expect.objectContaining({ attempt: 1, hasClient: true }),
    )
  })

  it('classifies a browser dynamic-import fetch failure as chunk-fetch-failed, and extracts the chunk URL', async () => {
    const chunkUrl = 'https://preview--example.lovable.app/assets/client-abc123.js'
    const importFn = vi.fn(async () => {
      throw new TypeError(`Failed to fetch dynamically imported module: ${chunkUrl}`)
    })

    await loadCloudClient(importFn, true)

    expect(warnSpy).toHaveBeenCalledWith(
      '[meridian][auth-diagnostic] Cloud client import failed',
      expect.objectContaining({
        stage: 'chunk-fetch-failed',
        chunkUrl,
        generatedModuleReached: false,
        likelyReachedCreateClient: false,
        errorName: 'TypeError',
      }),
    )
  })

  // The one case that would actually contradict isSupabaseConfigured: the
  // generated file's own env guard fired, verbatim, proving its module DID
  // start evaluating and its own lookup disagreed with ours.
  it('classifies the generated file\'s own env-guard throw as generated-module-env-guard, reached, but createClient not reached', async () => {
    const importFn = vi.fn(async () => {
      throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Set both in .env.local before importing this client.')
    })

    await loadCloudClient(importFn, true)

    expect(warnSpy).toHaveBeenCalledWith(
      '[meridian][auth-diagnostic] Cloud client import failed',
      expect.objectContaining({
        stage: 'generated-module-env-guard',
        chunkUrl: null,
        generatedModuleReached: true,
        likelyReachedCreateClient: false,
      }),
    )
  })

  it('classifies any other error as "other" — module reached, likely inside/after createClient()', async () => {
    const importFn = vi.fn(async () => {
      throw new Error('Invalid URL')
    })

    await loadCloudClient(importFn, true)

    expect(warnSpy).toHaveBeenCalledWith(
      '[meridian][auth-diagnostic] Cloud client import failed',
      expect.objectContaining({
        stage: 'other',
        chunkUrl: null,
        generatedModuleReached: true,
        likelyReachedCreateClient: true,
        errorMessage: 'Invalid URL',
      }),
    )
  })
})
