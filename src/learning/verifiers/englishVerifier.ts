import type { EnglishExerciseConfig, LessonVerdict } from '../types'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Deterministic, local string comparison only — no AI, no external API.
 * Passes only when every item's translation matches (order-aligned with
 * `exercise.items`).
 */
export function checkEnglishAnswer(exercise: EnglishExerciseConfig, learnerInputs: readonly string[]): LessonVerdict {
  if (learnerInputs.length !== exercise.items.length) {
    return { pass: false }
  }
  const allCorrect = exercise.items.every(
    (item, index) => normalize(learnerInputs[index] ?? '') === normalize(item.english),
  )
  return { pass: allCorrect }
}
