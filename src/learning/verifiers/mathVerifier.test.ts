import { describe, expect, it } from 'vitest'
import type { MathExerciseConfig } from '../types'
import { checkMathAnswer } from './mathVerifier'

const EXERCISE: MathExerciseConfig = { correctAnswer: 11, hint: 'בצע קודם את הכפל.' }

describe('checkMathAnswer', () => {
  it('passes on the exact correct numeric answer', () => {
    expect(checkMathAnswer(EXERCISE, '11')).toEqual({ pass: true })
  })

  it('passes when the input has surrounding whitespace', () => {
    expect(checkMathAnswer(EXERCISE, '  11  ')).toEqual({ pass: true })
  })

  it('fails on a wrong numeric answer', () => {
    expect(checkMathAnswer(EXERCISE, '7')).toEqual({ pass: false })
  })

  it('fails on non-numeric input rather than throwing', () => {
    expect(checkMathAnswer(EXERCISE, 'abc')).toEqual({ pass: false })
  })

  it('fails on an empty answer', () => {
    expect(checkMathAnswer(EXERCISE, '')).toEqual({ pass: false })
  })

  it('exposes a hint the caller can display', () => {
    expect(EXERCISE.hint.length).toBeGreaterThan(0)
  })
})
