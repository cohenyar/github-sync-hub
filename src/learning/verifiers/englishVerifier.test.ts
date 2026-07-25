import { describe, expect, it } from 'vitest'
import type { EnglishExerciseConfig } from '../types'
import { checkEnglishAnswer } from './englishVerifier'

const EXERCISE: EnglishExerciseConfig = {
  items: [
    { hebrew: 'כלב', english: 'dog' },
    { hebrew: 'חתול', english: 'cat' },
    { hebrew: 'בית', english: 'house' },
  ],
  hint: 'D',
}

describe('checkEnglishAnswer', () => {
  it('passes when every translation matches exactly', () => {
    expect(checkEnglishAnswer(EXERCISE, ['dog', 'cat', 'house'])).toEqual({ pass: true })
  })

  it('normalizes case and surrounding whitespace before comparing', () => {
    expect(checkEnglishAnswer(EXERCISE, [' Dog ', 'CAT', '  House'])).toEqual({ pass: true })
  })

  it('fails when any single item is wrong', () => {
    expect(checkEnglishAnswer(EXERCISE, ['dog', 'wrong', 'house'])).toEqual({ pass: false })
  })

  it('fails when the answer count does not match the item count', () => {
    expect(checkEnglishAnswer(EXERCISE, ['dog', 'cat'])).toEqual({ pass: false })
  })

  it('fails safely on missing/empty answers rather than throwing', () => {
    expect(checkEnglishAnswer(EXERCISE, ['', '', ''])).toEqual({ pass: false })
  })

  it('exposes a hint the caller can display', () => {
    expect(EXERCISE.hint.length).toBeGreaterThan(0)
  })
})
