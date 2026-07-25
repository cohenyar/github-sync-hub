import { describe, expect, it } from 'vitest'
import { isEnglishLesson, isLessonId, isMathLesson, type EnglishLessonConfig, type MathLessonConfig } from './types'

const MATH_LESSON: MathLessonConfig = {
  id: 'lesson:math-001',
  subject: 'math',
  title: 'חשבון בסיסי',
  instructions: 'כמה זה 3 + 4 × 2?',
  exercise: { correctAnswer: 11, hint: 'בצע קודם את הכפל.' },
}

const ENGLISH_LESSON: EnglishLessonConfig = {
  id: 'lesson:english-001',
  subject: 'english',
  title: 'אוצר מילים',
  instructions: 'תרגם/י.',
  exercise: { items: [{ hebrew: 'כלב', english: 'dog' }], hint: 'D' },
}

describe('isLessonId (Batch 3A.4A)', () => {
  it('is true for a namespaced lesson id', () => {
    expect(isLessonId('lesson:math-001')).toBe(true)
    expect(isLessonId('lesson:english-001')).toBe(true)
  })

  it('is false for every existing SQL mission id', () => {
    const sqlMissionIds = [
      'first-contact',
      'district-ties',
      'south-stability',
      'full-signal',
      'linked-records',
      'priority-signal',
    ]
    for (const id of sqlMissionIds) {
      expect(isLessonId(id)).toBe(false)
    }
  })
})

describe('isMathLesson / isEnglishLesson (Batch 3A.4A)', () => {
  it('narrows a math lesson correctly', () => {
    expect(isMathLesson(MATH_LESSON)).toBe(true)
    expect(isEnglishLesson(MATH_LESSON)).toBe(false)
  })

  it('narrows an english lesson correctly', () => {
    expect(isEnglishLesson(ENGLISH_LESSON)).toBe(true)
    expect(isMathLesson(ENGLISH_LESSON)).toBe(false)
  })
})
