import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from './createInitialPlayerProgress'
import { recordArchivePageFound } from './recordArchivePageFound'

describe('recordArchivePageFound', () => {
  it('adds a new page id to an empty list', () => {
    const progress = recordArchivePageFound(createInitialPlayerProgress(), 'archive-page:trade-count')
    expect(progress.collectedArchivePageIds).toEqual(['archive-page:trade-count'])
  })

  it('is idempotent — finding the same page again is a no-op', () => {
    let progress = createInitialPlayerProgress()
    progress = recordArchivePageFound(progress, 'archive-page:trade-count')
    const after = recordArchivePageFound(progress, 'archive-page:trade-count')
    expect(after).toBe(progress)
    expect(after.collectedArchivePageIds).toEqual(['archive-page:trade-count'])
  })

  it('accumulates distinct pages', () => {
    let progress = createInitialPlayerProgress()
    progress = recordArchivePageFound(progress, 'archive-page:trade-count')
    progress = recordArchivePageFound(progress, 'archive-page:lost-and-found')
    expect(progress.collectedArchivePageIds).toEqual(['archive-page:trade-count', 'archive-page:lost-and-found'])
  })

  it('defaults a missing collectedArchivePageIds (an older save) to empty before recording, rather than throwing', () => {
    const progress = createInitialPlayerProgress()
    delete (progress as { collectedArchivePageIds?: readonly string[] }).collectedArchivePageIds
    expect(() => recordArchivePageFound(progress, 'archive-page:trade-count')).not.toThrow()
  })
})
