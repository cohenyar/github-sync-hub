import { he } from '../../i18n'
import type { DifficultyLevel } from '../../progression/types'

export type AskOdinQuestionId = 'what-now' | 'subject' | 'explain-question' | 'hint' | 'why-wrong' | 'where-to-go'

export interface AskOdinLastResult {
  pass: boolean
  submittedAnswer: string
}

export interface AskOdinContext {
  subjectHe: string
  missionGoal: string
  missionPrompt: string
  missionHint?: string
  /** Difficulty-specific authored guidance — see missions/types.ts. Preferred over missionHint when the active difficulty has one. */
  guidanceLevel1?: string
  guidanceLevel2?: string
  guidanceLevel3?: string
  destinationName?: string
  /** The player's most recent submission on the active mission, if any yet this session. */
  lastResult: AskOdinLastResult | null
  difficultyLevel?: DifficultyLevel
}

/**
 * Difficulty-gated the same way QuestionAnswerPanel's in-panel hint is (see
 * its own doc comment): Easy prefers the stronger, always-visible-style
 * guidance; Medium (and the default when omitted) the normal one; Hard
 * prefers its own authored guidance too — every mission's guidanceLevel3
 * is itself already written to never reveal the answer, so reusing it here
 * keeps Ask Odin's hint identical to the in-panel one at every level,
 * rather than inventing a second, generic "no help" message.
 */
function resolveHint(context: AskOdinContext): string {
  if (context.difficultyLevel === 1) {
    return context.guidanceLevel1 ?? context.missionHint ?? he.askOdinNoHintFallback
  }
  if (context.difficultyLevel === 3) {
    return context.guidanceLevel3 ?? he.askOdinHintMinimalAtHard
  }
  return context.guidanceLevel2 ?? context.missionHint ?? he.askOdinNoHintFallback
}

function resolveWhyWrong(context: AskOdinContext): string {
  if (!context.lastResult) return he.askOdinNoWrongAnswerYetFallback
  if (context.lastResult.pass) return he.askOdinLastAnswerWasCorrectFallback
  // Never the correct answer itself — the same difficulty-gated guidance
  // the hint button gives, just reached from a different question.
  return resolveHint(context)
}

/**
 * Playtest fix pass (issue 6C), generalized for the History/English/Math
 * model — Odin's deterministic "Ask" panel. Every answer is resolved from
 * data GameApp already computes (the active mission's own authored text,
 * difficulty, and last result) — no AI/LLM, no new gameplay state, nothing
 * persisted. See resolveFreeTextQuestion.ts for the free-text counterpart,
 * which delegates back to this function for every intent it recognizes.
 */
export function resolveAskOdinAnswer(questionId: AskOdinQuestionId, context: AskOdinContext): string {
  switch (questionId) {
    case 'what-now':
      return context.missionGoal
    case 'subject':
      return `${he.askOdinSubjectPrefix}${context.subjectHe}.`
    case 'explain-question':
      return context.missionPrompt
    case 'hint':
      return resolveHint(context)
    case 'why-wrong':
      return resolveWhyWrong(context)
    case 'where-to-go':
      return context.destinationName
        ? `${he.askOdinWhereToGoPrefix}${context.destinationName}.`
        : he.askOdinNoDestinationFallback
    default:
      return he.askOdinNoHintFallback
  }
}
