import type { MissionAnswerConfig } from '../cms/types'

/**
 * Pure, deterministic answer check for a question mission — the SQL-removal
 * pass's replacement for the Verifier's SQL-diffing (see ../verifier). No
 * async work, no external engine: multiple choice compares the submitted
 * option index; short text compares against every accepted answer,
 * case/whitespace-insensitive so "Library", "library ", and "LIBRARY" all
 * count as correct.
 */
export function checkQuestionAnswer(config: MissionAnswerConfig, submittedAnswer: string): boolean {
  if (config.type === 'multiple_choice') {
    const submittedIndex = Number.parseInt(submittedAnswer, 10)
    return Number.isInteger(submittedIndex) && submittedIndex === config.correctIndex
  }
  const normalize = (value: string) => value.trim().toLowerCase()
  const normalizedSubmission = normalize(submittedAnswer)
  return config.acceptedAnswers.some((accepted) => normalize(accepted) === normalizedSubmission)
}
