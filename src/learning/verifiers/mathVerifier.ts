import type { LessonVerdict, MathExerciseConfig } from '../types'

/**
 * Deterministic, local numeric comparison only — no AI, no external API.
 */
export function checkMathAnswer(exercise: MathExerciseConfig, learnerInput: string): LessonVerdict {
  const parsed = Number(learnerInput.trim())
  return { pass: Number.isFinite(parsed) && parsed === exercise.correctAnswer }
}
