import { describe, expect, it } from 'vitest'
import { getLessonById, lessonRegistry } from './lessonRegistry'
import { isMathLesson, isEnglishLesson } from './types'

describe('lessonRegistry (Batch 3A.4A)', () => {
  it('contains exactly the two namespaced sample lessons', () => {
    expect(lessonRegistry.map((lesson) => lesson.id)).toEqual(['lesson:math-001', 'lesson:english-001'])
  })

  it('resolves the math lesson by its namespaced id', () => {
    const lesson = getLessonById('lesson:math-001')
    expect(lesson).toBeDefined()
    expect(lesson && isMathLesson(lesson)).toBe(true)
  })

  it('resolves the english lesson by its namespaced id', () => {
    const lesson = getLessonById('lesson:english-001')
    expect(lesson).toBeDefined()
    expect(lesson && isEnglishLesson(lesson)).toBe(true)
  })

  it('returns undefined for an id that is not in the lesson registry, including real SQL mission ids', () => {
    expect(getLessonById('lesson:unknown')).toBeUndefined()
    expect(getLessonById('first-contact')).toBeUndefined()
  })

  it('provides a non-empty hint for both sample lessons', () => {
    for (const lesson of lessonRegistry) {
      expect(lesson.exercise.hint.length).toBeGreaterThan(0)
    }
  })

  it('the english lesson has between 3 and 5 vocabulary items', () => {
    const lesson = getLessonById('lesson:english-001')
    expect(lesson && isEnglishLesson(lesson) ? lesson.exercise.items.length : 0).toBeGreaterThanOrEqual(3)
    expect(lesson && isEnglishLesson(lesson) ? lesson.exercise.items.length : 0).toBeLessThanOrEqual(5)
  })
})
