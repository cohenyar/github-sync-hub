import { describe, expect, it } from 'vitest'
import { checkEnglishAnswer } from './verifiers/englishVerifier'
import { checkMathAnswer } from './verifiers/mathVerifier'
import { getLessonById } from './lessonRegistry'
import { englishLessonPool } from './questionPools/english'
import { mathLessonPool } from './questionPools/math'
import type { EnglishQuestionPool, MathQuestionPool } from './questionPools/types'
import { resolveLessonForDifficulty } from './resolveLessonForDifficulty'
import { isEnglishLesson, isMathLesson } from './types'

const mathLessonUnion = getLessonById('lesson:math-001')!
const englishLessonUnion = getLessonById('lesson:english-001')!
if (!isMathLesson(mathLessonUnion)) throw new Error('expected lesson:math-001 to be a math lesson')
if (!isEnglishLesson(englishLessonUnion)) throw new Error('expected lesson:english-001 to be an english lesson')
const mathLesson = mathLessonUnion
const englishLesson = englishLessonUnion

describe('resolveLessonForDifficulty — at the default rotationSeed=0, every level shows the exact original content for level 1', () => {
  it('math: level 1 matches lesson:math-001 exactly', () => {
    const resolved = resolveLessonForDifficulty(mathLesson, 1)
    expect(isMathLesson(resolved)).toBe(true)
    expect(resolved.instructions).toBe(mathLesson.instructions)
    if (isMathLesson(resolved)) expect(resolved.exercise).toEqual(mathLesson.exercise)
  })

  it('english: level 1 matches lesson:english-001 exactly', () => {
    const resolved = resolveLessonForDifficulty(englishLesson, 1)
    expect(isEnglishLesson(resolved)).toBe(true)
    expect(resolved.instructions).toBe(englishLesson.instructions)
    if (isEnglishLesson(resolved)) expect(resolved.exercise).toEqual(englishLesson.exercise)
  })

  it('identity fields (id, title, subject) are unchanged at every level', () => {
    for (const level of [1, 2, 3] as const) {
      const resolvedMath = resolveLessonForDifficulty(mathLesson, level)
      expect(resolvedMath.id).toBe(mathLesson.id)
      expect(resolvedMath.title).toBe(mathLesson.title)
      expect(resolvedMath.subject).toBe(mathLesson.subject)

      const resolvedEnglish = resolveLessonForDifficulty(englishLesson, level)
      expect(resolvedEnglish.id).toBe(englishLesson.id)
      expect(resolvedEnglish.title).toBe(englishLesson.title)
      expect(resolvedEnglish.subject).toBe(englishLesson.subject)
    }
  })
})

describe('resolveLessonForDifficulty — Easy/Medium/Hard show genuinely different content', () => {
  it('math: levels 1, 2, and 3 never show the same instructions', () => {
    const l1 = resolveLessonForDifficulty(mathLesson, 1).instructions
    const l2 = resolveLessonForDifficulty(mathLesson, 2).instructions
    const l3 = resolveLessonForDifficulty(mathLesson, 3).instructions
    expect(new Set([l1, l2, l3]).size).toBe(3)
  })

  it('english: levels 1, 2, and 3 never show the same instructions', () => {
    const l1 = resolveLessonForDifficulty(englishLesson, 1).instructions
    const l2 = resolveLessonForDifficulty(englishLesson, 2).instructions
    const l3 = resolveLessonForDifficulty(englishLesson, 3).instructions
    expect(new Set([l1, l2, l3]).size).toBe(3)
  })

  it("a submitted answer is checked against whatever question is currently resolved, not the base one — math", () => {
    const l2 = resolveLessonForDifficulty(mathLesson, 2)
    const l3 = resolveLessonForDifficulty(mathLesson, 3)
    expect(checkMathAnswer(mathLesson.exercise, '11').pass).toBe(true)
    if (isMathLesson(l2)) expect(checkMathAnswer(l2.exercise, '11').pass).toBe(false)
    if (isMathLesson(l3)) expect(checkMathAnswer(l3.exercise, '11').pass).toBe(false)
  })
})

describe('resolveLessonForDifficulty — rotationSeed cycles through the whole pool, no immediate repetition', () => {
  it('omitting rotationSeed is identical to passing 0 explicitly, at every level', () => {
    for (const level of [1, 2, 3] as const) {
      expect(resolveLessonForDifficulty(mathLesson, level)).toEqual(resolveLessonForDifficulty(mathLesson, level, 0))
      expect(resolveLessonForDifficulty(englishLesson, level)).toEqual(resolveLessonForDifficulty(englishLesson, level, 0))
    }
  })

  it('a different rotationSeed produces genuinely different instructions, at every level, for both subjects', () => {
    for (const level of [1, 2, 3] as const) {
      const mathSeed0 = resolveLessonForDifficulty(mathLesson, level, 0).instructions
      const mathSeed1 = resolveLessonForDifficulty(mathLesson, level, 1).instructions
      expect(mathSeed1, `math level ${level}`).not.toBe(mathSeed0)

      const englishSeed0 = resolveLessonForDifficulty(englishLesson, level, 0).instructions
      const englishSeed1 = resolveLessonForDifficulty(englishLesson, level, 1).instructions
      expect(englishSeed1, `english level ${level}`).not.toBe(englishSeed0)
    }
  })

  it('6 consecutive seeds visit 6 distinct questions before the 7th deterministically repeats the 1st', () => {
    for (const lesson of [mathLesson, englishLesson]) {
      for (const level of [1, 2, 3] as const) {
        const seen = Array.from({ length: 6 }, (_, seed) => resolveLessonForDifficulty(lesson, level, seed).instructions)
        expect(new Set(seen).size, `${lesson.id} level ${level}`).toBe(6)
        const wrapped = resolveLessonForDifficulty(lesson, level, 6).instructions
        expect(wrapped, `${lesson.id} level ${level}`).toBe(seen[0])
      }
    }
  })
})

describe('lesson question pools — content quality', () => {
  const POOLS: Record<string, MathQuestionPool | EnglishQuestionPool> = {
    math: mathLessonPool,
    english: englishLessonPool,
  }

  it('each subject has exactly 6 questions at every one of the 3 difficulty levels (18 per subject, 36 total)', () => {
    let total = 0
    for (const [subject, pool] of Object.entries(POOLS)) {
      for (const level of [1, 2, 3] as const) {
        expect(pool[level].length, `${subject} level ${level}`).toBe(6)
        total += pool[level].length
      }
    }
    expect(total).toBe(36)
  })

  it('every pool question id is unique within its own pool', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      const ids = ([1, 2, 3] as const).flatMap((level) => pool[level].map((q) => q.id))
      expect(ids.length, subject).toBe(new Set(ids).size)
    }
  })

  it('the set of instructions in one level is disjoint from every other level, within the same subject pool', () => {
    for (const [subject, pool] of Object.entries(POOLS)) {
      const byLevel = {
        1: new Set(pool[1].map((q) => q.instructions)),
        2: new Set(pool[2].map((q) => q.instructions)),
        3: new Set(pool[3].map((q) => q.instructions)),
      }
      for (const text of byLevel[2]) expect(byLevel[1].has(text), `${subject}: "${text}"`).toBe(false)
      for (const text of byLevel[3]) expect(byLevel[1].has(text), `${subject}: "${text}"`).toBe(false)
      for (const text of byLevel[3]) expect(byLevel[2].has(text), `${subject}: "${text}"`).toBe(false)
    }
  })

  it('every math pool question is internally answerable: its own correctAnswer passes and an obviously wrong one fails', () => {
    for (const level of [1, 2, 3] as const) {
      for (const question of mathLessonPool[level]) {
        expect(checkMathAnswer(question.exercise, String(question.exercise.correctAnswer)).pass, question.id).toBe(true)
        expect(checkMathAnswer(question.exercise, String(question.exercise.correctAnswer + 1)).pass, question.id).toBe(false)
      }
    }
  })

  it('every english pool question is internally answerable: its own translations pass and an obviously wrong one fails', () => {
    for (const level of [1, 2, 3] as const) {
      for (const question of englishLessonPool[level]) {
        const correctAnswers = question.exercise.items.map((item) => item.english)
        expect(checkEnglishAnswer(question.exercise, correctAnswers).pass, question.id).toBe(true)
        expect(checkEnglishAnswer(question.exercise, correctAnswers.map(() => 'תשובה שגויה')).pass, question.id).toBe(false)
      }
    }
  })

  it('Level 3 hints never spell out the correct answer text', () => {
    for (const question of mathLessonPool[3]) {
      expect(question.exercise.hint).not.toContain(String(question.exercise.correctAnswer))
    }
    for (const question of englishLessonPool[3]) {
      for (const item of question.exercise.items) {
        expect(question.exercise.hint.toLowerCase()).not.toContain(item.english.toLowerCase())
      }
    }
  })
})
