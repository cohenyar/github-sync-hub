import { describe, expect, it } from 'vitest'
import { archivePageRegistry, getArchivePageByLessonId, getArchivePageById } from './registry'

describe('archivePageRegistry', () => {
  it('gives every page a non-empty id, lessonId, title, and body', () => {
    expect(archivePageRegistry.length).toBeGreaterThan(0)
    for (const page of archivePageRegistry) {
      expect(page.id.length).toBeGreaterThan(0)
      expect(page.lessonId.length).toBeGreaterThan(0)
      expect(page.title.length).toBeGreaterThan(0)
      expect(page.body.length).toBeGreaterThan(0)
    }
  })

  it('has exactly one page per rewritten lesson, with no duplicate ids', () => {
    const ids = archivePageRegistry.map((page) => page.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(archivePageRegistry.map((page) => page.lessonId).sort()).toEqual(['lesson:english-001', 'lesson:math-001'])
  })
})

describe('getArchivePageById', () => {
  it('finds a real page by id', () => {
    expect(getArchivePageById('archive-page:trade-count')?.lessonId).toBe('lesson:math-001')
  })

  it('returns undefined for an id that does not exist', () => {
    expect(getArchivePageById('does-not-exist')).toBeUndefined()
  })
})

describe('getArchivePageByLessonId', () => {
  it('finds the page tied to a given lesson', () => {
    expect(getArchivePageByLessonId('lesson:english-001')?.id).toBe('archive-page:lost-and-found')
  })

  it('returns undefined for a lesson with no linked page', () => {
    expect(getArchivePageByLessonId('lesson:does-not-exist')).toBeUndefined()
  })
})
